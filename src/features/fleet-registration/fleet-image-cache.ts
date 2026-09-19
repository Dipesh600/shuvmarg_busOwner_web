import { authFetch } from "@/lib/auth";
import { getFleetDetail } from "./api";
import { loadDraftFiles } from "./draft-file-storage";

const memoryCache = new Map<string, string>();
const pendingFetches = new Map<string, Promise<string | null>>();
const revisions = new Map<string, number>();

const CACHE_PREFIX = "shuvmarg_bus_front_img_";

export function invalidateFleetImageCache(fleetId: string, frontImage?: { imageId: string | null; index: number }) {
  revisions.set(fleetId, (revisions.get(fleetId) || 0) + 1);
  memoryCache.delete(fleetId); pendingFetches.delete(fleetId);
  if (typeof window !== "undefined") {
    try { window.localStorage.removeItem(`${CACHE_PREFIX}${fleetId}`); } catch { /* Storage can be unavailable. */ }
    window.dispatchEvent(new CustomEvent("fleet-front-image-changed", { detail: { fleetId, frontImage } }));
  }
}

function getLocalStorageImage(fleetId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(`${CACHE_PREFIX}${fleetId}`);
  } catch {
    return null;
  }
}

function setLocalStorageImage(fleetId: string, dataUrl: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${CACHE_PREFIX}${fleetId}`, dataUrl);
  } catch {
    // If quota exceeded or restricted, fail silently; memoryCache still retains it
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert image blob to data URL"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Creates a downscaled JPEG/WEBP thumbnail data URL (~15-25KB)
 * so storing multiple bus photos in browser localStorage never exceeds storage quotas.
 */
async function createThumbnailDataUrl(
  blob: Blob,
  maxWidth = 320,
  maxHeight = 220,
): Promise<string> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return blobToDataUrl(blob);
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (!width || !height) {
        blobToDataUrl(blob).then(resolve).catch(() => resolve(""));
        return;
      }

      const scale = Math.min(maxWidth / width, maxHeight / height, 1);
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        blobToDataUrl(blob).then(resolve).catch(() => resolve(""));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      try {
        const thumbUrl = canvas.toDataURL("image/webp", 0.85);
        resolve(thumbUrl);
      } catch {
        blobToDataUrl(blob).then(resolve).catch(() => resolve(""));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      blobToDataUrl(blob).then(resolve).catch(() => resolve(""));
    };
    img.src = objectUrl;
  });
}

/**
 * Retrieves the front-facing bus photo with local persistent caching.
 * Hierarchy:
 * 1. In-memory Map (instant synchronous access)
 * 2. Browser localStorage (persists across page reloads without network hits)
 * 3. Local Draft IndexedDB (if localDraftId is provided and contains photos.front)
 * 4. Backend document query (fetches image blob once, caches as Data URL)
 */
export async function getBusFrontImageUrl(
  fleetId: string,
  localDraftId?: string | null,
  frontImageMetadata?: { imageId: string | null; index: number } | null,
): Promise<string | null> {
  if (!fleetId && !localDraftId) return null;

  const cacheKey = fleetId || localDraftId || "";
  const revision = revisions.get(cacheKey) || 0;

  // 1. Check in-memory cache
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  // 2. Check localStorage cache
  const localCached = getLocalStorageImage(cacheKey);
  if (localCached) {
    memoryCache.set(cacheKey, localCached);
    return localCached;
  }

  // 3. Deduplicate in-flight fetches for the same bus
  if (pendingFetches.has(cacheKey)) {
    return pendingFetches.get(cacheKey)!;
  }

  const fetchPromise = (async (): Promise<string | null> => {
    try {
      // Try local draft storage first if localDraftId exists
      if (localDraftId) {
        try {
          const draftFiles = await loadDraftFiles(localDraftId);
          if (draftFiles.photos.front) {
            const dataUrl = await blobToDataUrl(draftFiles.photos.front);
            memoryCache.set(cacheKey, dataUrl);
            setLocalStorageImage(cacheKey, dataUrl);
            return dataUrl;
          }
        } catch {
          // Fall through to server fetch
        }
      }

      if (!fleetId) return null;

      let frontImage = frontImageMetadata;
      if (frontImage === undefined) {
        const detail = await getFleetDetail(fleetId);
        const images = detail.documents?.fleetImages?.images || [];
        const image = images.find(img => String(img.view || "").toLowerCase() === "front") || images[0];
        frontImage = image ? { imageId: image.imageId || null, index: Math.max(0, images.indexOf(image)) } : null;
      }
      if (!frontImage) return null;
      const queryParam = frontImage.imageId
        ? `?imageId=${encodeURIComponent(frontImage.imageId)}`
        : `?imageIndex=${frontImage.index}`;

      // Fetch the actual document view endpoint
      const docRes = await authFetch(
        `/busowner/fleets/${encodeURIComponent(fleetId)}/documents/fleetImages/view${queryParam}`,
      );

      if (!docRes.ok) return null;

      const blob = await docRes.blob();
      if (!blob || blob.size === 0) return null;

      // Generate compact thumbnail data URL for persistent caching
      const dataUrl = await createThumbnailDataUrl(blob);
      if (!dataUrl) return null;
      if (revision !== (revisions.get(cacheKey) || 0)) return null;

      memoryCache.set(cacheKey, dataUrl);
      setLocalStorageImage(cacheKey, dataUrl);
      return dataUrl;
    } catch {
      return null;
    }
  })();

  pendingFetches.set(cacheKey, fetchPromise);
  fetchPromise.finally(() => {
    if (pendingFetches.get(cacheKey) === fetchPromise) pendingFetches.delete(cacheKey);
  });

  return fetchPromise;
}

/**
 * Synchronously checks if a cached image is already available in memory or localStorage.
 */
export function getCachedBusFrontImageUrl(fleetId: string, localDraftId?: string | null): string | null {
  const cacheKey = fleetId || localDraftId || "";
  if (!cacheKey) return null;
  return memoryCache.get(cacheKey) || getLocalStorageImage(cacheKey);
}

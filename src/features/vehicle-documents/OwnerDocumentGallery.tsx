"use client";
import { useCallback, useSyncExternalStore } from "react";
import { authFetch, getAccessToken, subscribeToAuthChanges, invalidateReadCache } from "@/lib/auth";
import { API_URL } from "@/lib/config";
import { requestDataRefresh } from "@/lib/data-refresh";
import { accountScope } from "./blob-cache";
import { readVideoResponse } from "./video-response";
import type { VideoDescriptor } from "./VehicleVideo";
import DocumentGallery, { type DocumentManifest, type FileDescriptor } from "./DocumentGallery";
import { PHOTO_VIEWS, type PhotoFiles } from "./photo-policy";
import { invalidateFleetImageCache } from "../fleet-registration/fleet-image-cache";
async function loadFile(path: string): Promise<Blob> {
  const response = await authFetch(path);
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.message || `Unable to load this file (HTTP ${response.status}).`); }
  return response.blob();
}
function refreshDetails() { invalidateReadCache(); requestDataRefresh(); }
export default function OwnerDocumentGallery({ manifest, fleetId }: { manifest: DocumentManifest; fleetId: string }) {
  const token = useSyncExternalStore(subscribeToAuthChanges, getAccessToken, () => null);
  const principal = accountScope(token);
  const path = `/busowner/fleets/${encodeURIComponent(fleetId)}/video`;
  const loadStatus = useCallback(async (): Promise<VideoDescriptor> => {
    const response = await authFetch(path);
    return readVideoResponse(response);
  }, [path]);
  const uploadVideo = useCallback(async (file: File): Promise<VideoDescriptor> => {
    const form = new FormData(); form.append("video", file);
    const response = await authFetch(path, { method: "PUT", body: form });
    return readVideoResponse(response);
  }, [path]);
  const uploadPhotos = useCallback(async (files: PhotoFiles): Promise<FileDescriptor> => {
    const entries = PHOTO_VIEWS.filter(view => files[view]);
    const form = new FormData();
    const fields = { FRONT: "imageFront", SIDE: "imageSide", BACK: "imageBack", INSIDE: "imageInside" };
    for (const view of entries) form.append(entries.length === 1 ? "file" : fields[view], files[view]!);
    const response = await authFetch(`/busowner/fleets/${encodeURIComponent(fleetId)}/images${entries.length === 1 ? `/${entries[0]}` : ""}`, { method: "PUT", body: form });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || "Unable to replace photos.");
    const photos: FileDescriptor = body.documents.fleetImages;
    if (files.FRONT) {
      const index = photos.images?.findIndex(image => image.view === "FRONT") ?? -1;
      const image = photos.images?.[index];
      invalidateFleetImageCache(fleetId, image ? { imageId: image.imageId || null, index } : undefined);
    }
    return photos;
  }, [fleetId]);
  return <DocumentGallery manifest={manifest} fleetId={fleetId} scope={principal ? `owner:${API_URL}:${principal}` : null} basePath="/busowner/fleets" loadFile={loadFile} onRefresh={refreshDetails} loadVideoStatus={loadStatus} uploadVideo={uploadVideo} uploadPhotos={uploadPhotos} />;
}

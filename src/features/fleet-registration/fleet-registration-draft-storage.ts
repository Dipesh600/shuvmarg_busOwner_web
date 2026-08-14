import { getAccessToken } from "../../lib/auth.ts";
import { deleteDraftFiles, loadDraftFiles, saveDraftFiles } from "./draft-file-storage.ts";
import { type FleetRegistrationDraft, type FleetStep } from "./types.ts";

const REGISTRY_PREFIX = "shuvmarg:fleet-registration:registry:v2";
const ACTIVE_DRAFT_KEY = "shuvmarg:fleet-registration:active-id:v2";
const LEGACY_V1_PREFIX = "shuvmarg:fleet-registration:v1";
export const FLEET_DRAFTS_CHANGED_EVENT = "shuvmarg:fleet-drafts-changed";

export interface DraftMetadata {
  id: string;
  name: string;
  busNumber: string;
  vehicleType: string;
  step: FleetStep;
  totalPlaces: number;
  updatedAt: string;
  serverFleetId?: string;
  hasFiles: boolean;
}

interface StoredDraftRecord {
  version: 2;
  id: string;
  draft: Omit<FleetRegistrationDraft, "files">;
  step: FleetStep;
  completed: FleetStep[];
  serverFleetId?: string;
  hasFiles: boolean;
  updatedAt: string;
}

const memoryStore = new Map<string, string>();

function notifyDraftsChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(FLEET_DRAFTS_CHANGED_EVENT));
  }
}

export function subscribeToFleetDraftChanges(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("storage", listener);
  window.addEventListener(FLEET_DRAFTS_CHANGED_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(FLEET_DRAFTS_CHANGED_EVENT, listener);
  };
}

function getStorageItem(key: string): string | null {
  try {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(key);
    }
  } catch {
    // Fallback to memory
  }
  return memoryStore.get(key) || null;
}

function setStorageItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
      return;
    }
  } catch {
    // Fallback to memory
  }
  memoryStore.set(key, value);
}

function removeStorageItem(key: string): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
      return;
    }
  } catch {
    // Fallback to memory
  }
  memoryStore.delete(key);
}

function ownerIdentity() {
  try {
    const token = getAccessToken();
    if (!token) return "anonymous-session";
    const encoded = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=")));
    return String(
      payload.id || payload.sub || payload.userId || payload.busOwnerId || "anonymous-session"
    ).replace(/[^a-zA-Z0-9_-]/g, "");
  } catch {
    return "anonymous-session";
  }
}

const getRegistryKey = () => `${REGISTRY_PREFIX}:${ownerIdentity()}`;
const getActiveKey = () => `${ACTIVE_DRAFT_KEY}:${ownerIdentity()}`;
const getDraftStorageKey = (draftId: string) => `${REGISTRY_PREFIX}:${ownerIdentity()}:${draftId}`;
const getLegacyKey = () => `${LEGACY_V1_PREFIX}:${ownerIdentity()}`;

export function generateDraftId(): string {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function getActiveDraftId(): string | null {
  return getStorageItem(getActiveKey());
}

export function setActiveDraftId(draftId: string | null): void {
  if (draftId) {
    setStorageItem(getActiveKey(), draftId);
  } else {
    removeStorageItem(getActiveKey());
  }
}

export function listFleetDrafts(): DraftMetadata[] {
  try {
    migrateLegacyDraft();
    const raw = getStorageItem(getRegistryKey());
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    const drafts = list as DraftMetadata[];
    const meaningful = drafts.filter((item) => !(
      item.name === "Untitled bus draft"
      && !item.busNumber
      && item.step === "vehicle"
      && item.totalPlaces === 0
      && !item.hasFiles
      && !item.serverFleetId
    ));
    if (meaningful.length !== drafts.length) {
      const retainedIds = new Set(meaningful.map((item) => item.id));
      drafts.filter((item) => !retainedIds.has(item.id)).forEach((item) => {
        removeStorageItem(getDraftStorageKey(item.id));
      });
      saveRegistry(meaningful);
      const activeId = getActiveDraftId();
      if (activeId && !retainedIds.has(activeId)) setActiveDraftId(meaningful[0]?.id || null);
    }
    return meaningful;
  } catch {
    return [];
  }
}

export function hasMeaningfulFleetDraft(draft: FleetRegistrationDraft): boolean {
  const hasFiles = Object.values(draft.files.photos).some(Boolean)
    || Boolean(draft.files.fitnessCert || draft.files.insurance || draft.files.bluebook || draft.files.routePermit);
  return Boolean(
    draft.vehicle.busName.trim()
    || draft.vehicle.busNumber.trim()
    || draft.vehicle.registrationYear.trim()
    || draft.vehicle.amenityIds.length
    || draft.route.origin.trim()
    || draft.route.destination.trim()
    || draft.route.viaStops.trim()
    || draft.layout
    || Object.values(draft.documents).some((value) => value.trim())
    || hasFiles
  );
}

function saveRegistry(list: DraftMetadata[]): void {
  try {
    setStorageItem(getRegistryKey(), JSON.stringify(list));
  } catch {
    // Ignore storage errors
  }
}

function deriveDraftName(draft: Omit<FleetRegistrationDraft, "files">): string {
  const name = draft.vehicle.busName.trim();
  const num = draft.vehicle.busNumber.trim();
  if (name && num) return `${name} (${num})`;
  if (name) return name;
  if (num) return `Bus ${num}`;
  return "Untitled bus draft";
}

function migrateLegacyDraft() {
  try {
    const legacyRaw = getStorageItem(getLegacyKey());
    if (!legacyRaw) return;

    const legacy = JSON.parse(legacyRaw);
    if (legacy?.draft?.vehicle) {
      const draftId = generateDraftId();
      const metadata: DraftMetadata = {
        id: draftId,
        name: deriveDraftName(legacy.draft),
        busNumber: legacy.draft.vehicle.busNumber || "",
        vehicleType: legacy.draft.vehicle.vehicleType || "BUS",
        step: legacy.step || "vehicle",
        totalPlaces: legacy.draft.layout?.totalPlaces || 0,
        updatedAt: new Date().toISOString(),
        hasFiles: legacy.hadFileSelections || false,
      };

      const record: StoredDraftRecord = {
        version: 2,
        id: draftId,
        draft: legacy.draft,
        step: legacy.step || "vehicle",
        completed: legacy.completed || [],
        hasFiles: legacy.hadFileSelections || false,
        updatedAt: new Date().toISOString(),
      };

      setStorageItem(getDraftStorageKey(draftId), JSON.stringify(record));
      const existingRaw = getStorageItem(getRegistryKey());
      const parsed = existingRaw ? JSON.parse(existingRaw) : [];
      const existing: DraftMetadata[] = Array.isArray(parsed) ? parsed : [];
      saveRegistry([metadata, ...existing.filter((d) => d.id !== draftId)]);
      setActiveDraftId(draftId);
    }
    removeStorageItem(getLegacyKey());
  } catch {
    // Ignore migration errors
  }
}

export async function saveFleetRegistrationDraft(
  draftId: string,
  draft: FleetRegistrationDraft,
  step: FleetStep,
  completed: FleetStep[],
  serverFleetId?: string
): Promise<void> {
  if (!serverFleetId && !hasMeaningfulFleetDraft(draft)) return;
  const hasFiles = Boolean(
    Object.values(draft.files.photos).some(Boolean) ||
      draft.files.fitnessCert ||
      draft.files.insurance ||
      draft.files.bluebook ||
      draft.files.routePermit
  );

  const serializable: StoredDraftRecord["draft"] = {
    vehicle: draft.vehicle,
    route: draft.route,
    layout: draft.layout,
    documents: draft.documents,
  };

  const updatedAt = new Date().toISOString();

  const record: StoredDraftRecord = {
    version: 2,
    id: draftId,
    draft: serializable,
    step,
    completed,
    serverFleetId,
    hasFiles,
    updatedAt,
  };

  try {
    setStorageItem(getDraftStorageKey(draftId), JSON.stringify(record));
    setActiveDraftId(draftId);

    // Update Registry Metadata
    const existing = listFleetDrafts();
    const metadata: DraftMetadata = {
      id: draftId,
      name: deriveDraftName(serializable),
      busNumber: draft.vehicle.busNumber.trim(),
      vehicleType: draft.vehicle.vehicleType || "BUS",
      step,
      totalPlaces: draft.layout?.totalPlaces || 0,
      updatedAt,
      serverFleetId,
      hasFiles,
    };

    const nextList = [metadata, ...existing.filter((item) => item.id !== draftId)];
    saveRegistry(nextList);

    // Save files to IndexedDB if available
    await saveDraftFiles(draftId, draft.files);
    notifyDraftsChanged();
  } catch (err) {
    console.warn("Failed to save fleet registration draft:", err);
  }
}

export async function loadFleetRegistrationDraft(
  targetDraftId?: string | null
): Promise<{
  draftId: string;
  draft: FleetRegistrationDraft;
  step: FleetStep;
  completed: FleetStep[];
  serverFleetId?: string;
} | null> {
  try {
    migrateLegacyDraft();
    let id = targetDraftId || getActiveDraftId();
    if (!id) {
      const drafts = listFleetDrafts();
      if (drafts.length > 0) id = drafts[0].id;
    }
    if (!id) return null;

    const raw = getStorageItem(getDraftStorageKey(id));
    if (!raw) return null;

    const record = JSON.parse(raw) as StoredDraftRecord;
    if (record.version !== 2 || !record.draft?.vehicle) return null;

    // Load persisted files from IndexedDB
    const files = await loadDraftFiles(id);

    return {
      draftId: id,
      draft: {
        ...record.draft,
        files,
      },
      step: record.step || "vehicle",
      completed: Array.isArray(record.completed) ? record.completed : [],
      serverFleetId: record.serverFleetId,
    };
  } catch (err) {
    console.warn("Failed to load fleet registration draft:", err);
    return null;
  }
}

export async function deleteFleetRegistrationDraft(draftId: string): Promise<void> {
  try {
    removeStorageItem(getDraftStorageKey(draftId));
    const drafts = listFleetDrafts().filter((d) => d.id !== draftId);
    saveRegistry(drafts);

    if (getActiveDraftId() === draftId) {
      setActiveDraftId(drafts.length > 0 ? drafts[0].id : null);
    }

    await deleteDraftFiles(draftId);
    notifyDraftsChanged();
  } catch (err) {
    console.warn("Failed to delete fleet draft:", err);
  }
}

export function hasFleetRegistrationDraft(): boolean {
  return listFleetDrafts().length > 0;
}

export function clearFleetRegistrationDraft(): void {
  const activeId = getActiveDraftId();
  if (activeId) {
    void deleteFleetRegistrationDraft(activeId);
  }
}

import { getAccessToken } from "@/lib/auth";
import { EMPTY_FLEET_DRAFT, type FleetRegistrationDraft, type FleetStep } from "./types";

const PREFIX = "shuvmarg:fleet-registration:v1";

interface StoredDraft {
  version: 1;
  draft: Omit<FleetRegistrationDraft, "files">;
  step: FleetStep;
  completed: FleetStep[];
  hadFileSelections: boolean;
}

function ownerIdentity() {
  try {
    const token = getAccessToken();
    if (!token) return "anonymous-session";
    const encoded = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=")));
    return String(payload.id || payload.sub || payload.userId || payload.busOwnerId || "anonymous-session").replace(/[^a-zA-Z0-9_-]/g, "");
  } catch { return "anonymous-session"; }
}

const key = () => `${PREFIX}:${ownerIdentity()}`;
const emptyFiles = () => ({ ...EMPTY_FLEET_DRAFT.files, photos: { ...EMPTY_FLEET_DRAFT.files.photos } });

export function saveFleetRegistrationDraft(draft: FleetRegistrationDraft, step: FleetStep, completed: FleetStep[], previouslyHadFiles = false) {
  const hadFileSelections = previouslyHadFiles || Boolean(Object.values(draft.files.photos).some(Boolean) || draft.files.fitnessCert || draft.files.insurance || draft.files.bluebook || draft.files.routePermit);
  const serializable: StoredDraft["draft"] = {
    vehicle: draft.vehicle,
    route: draft.route,
    layout: draft.layout,
    documents: draft.documents,
  };
  const value: StoredDraft = { version: 1, draft: serializable, step, completed, hadFileSelections };
  localStorage.setItem(key(), JSON.stringify(value));
}

export function loadFleetRegistrationDraft(): { draft: FleetRegistrationDraft; step: FleetStep; completed: FleetStep[]; filesNeedReselection: boolean } | null {
  try {
    const raw = localStorage.getItem(key());
    if (!raw) return null;
    const value = JSON.parse(raw) as StoredDraft;
    if (value.version !== 1 || !value.draft?.vehicle) return null;
    return { draft: { ...value.draft, files: emptyFiles() }, step: value.step || "vehicle", completed: Array.isArray(value.completed) ? value.completed : [], filesNeedReselection: value.hadFileSelections };
  } catch { return null; }
}

export function clearFleetRegistrationDraft() { localStorage.removeItem(key()); }

export function hasFleetRegistrationDraft() {
  try { return Boolean(localStorage.getItem(key())); } catch { return false; }
}

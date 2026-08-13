import { authFetch } from "@/lib/auth";
import type { FleetRegistrationDraft } from "./types";
import { adoptTemplate, createInitialCustomFleetLayout } from "@/features/seat-layout-v3/api";

export interface FleetListItem {
  fleetId: string;
  fleetCode: string | null;
  busName: string;
  busNumber: string;
  busType: string;
  totalSeats: number;
  approvalStatus: string;
  status: string;
  setupComplete?: boolean;
  rejectionReason?: string | null;
  documentSummary?: {
    totalSlots?: number;
    present?: number;
    missing?: number;
    pending?: number;
    approved?: number;
    rejected?: number;
  };
}

export interface RegisterFleetProgress {
  stage: string;
  stepNumber: number;
  totalSteps: number;
}

async function read<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `Request failed (${response.status})`);
  }
  return payload;
}

export async function listOperatorFleets(): Promise<FleetListItem[]> {
  const payload = await read<{ data?: { items?: FleetListItem[] } }>(
    await authFetch("/busowner/fleets?limit=100")
  );
  return payload.data?.items || [];
}

export async function submitFleetDraft(fleetId: string): Promise<void> {
  await read(await authFetch(`/busowner/fleets/${fleetId}/submit`, { method: "POST" }));
}

async function createDraft(draft: FleetRegistrationDraft): Promise<string> {
  const response = await authFetch("/busowner/fleets", {
    method: "POST",
    body: JSON.stringify({
      ...draft.vehicle,
      totalSeats: draft.layout!.totalPlaces,
      requestOriginCity: draft.route.origin.trim() || undefined,
      requestDestinationCity: draft.route.destination.trim() || undefined,
      requestViaStops: draft.route.viaStops
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    }),
  });
  const payload = await read<{ data?: { fleet?: { _id?: string; id?: string; fleetId?: string } } }>(response);
  const fleet = payload.data?.fleet;
  const id = fleet?._id || fleet?.id || fleet?.fleetId;
  if (!id) throw new Error("Fleet draft was created without an ID.");
  return id;
}

async function upload(
  fleetId: string,
  slot: string,
  files: File[] | File,
  metadata: Record<string, string> = {}
) {
  const body = new FormData();
  Object.entries(metadata).forEach(([key, value]) => {
    if (value) body.append(key, value);
  });
  for (const file of Array.isArray(files) ? files : [files]) {
    body.append(slot, file);
  }
  await read(await authFetch(`/busowner/fleets/${fleetId}/documents/${slot}`, { method: "PUT", body }));
}

export async function registerFleet(
  draft: FleetRegistrationDraft,
  options: {
    existingFleetId?: string;
    onDraftCreated?: (fleetId: string) => void;
    onProgress?: (progress: RegisterFleetProgress) => void;
    submitForReview: boolean;
  }
): Promise<string> {
  const totalSteps = options.submitForReview ? 7 : 6;
  let currentStep = 0;

  const notify = (stage: string) => {
    currentStep += 1;
    options.onProgress?.({
      stage,
      stepNumber: currentStep,
      totalSteps,
    });
  };

  // Step 1: Initialize or continue server draft
  notify("Preparing vehicle record…");
  let fleetId = options.existingFleetId;
  if (!fleetId) {
    fleetId = await createDraft(draft);
    options.onDraftCreated?.(fleetId);
  }

  // Step 2: Upload vehicle exterior & interior photos
  notify("Uploading vehicle photos…");
  const photos = Object.values(draft.files.photos).filter((file): file is File => Boolean(file));
  if (photos.length > 0) {
    await upload(fleetId, "fleetImages", photos);
  }

  // Step 3: Upload fitness & insurance documents
  notify("Uploading fitness & insurance certificates…");
  if (draft.files.fitnessCert) {
    await upload(fleetId, "fitnessCert", draft.files.fitnessCert, {
      validTill: draft.documents.fitnessValidTill,
    });
  }
  if (draft.files.insurance) {
    await upload(fleetId, "insurance", draft.files.insurance, {
      policyNumber: draft.documents.insurancePolicyNumber,
      validTill: draft.documents.insuranceValidTill,
    });
  }

  // Step 4: Upload bluebook & route permit
  notify("Uploading bluebook & route permit…");
  if (draft.files.bluebook) {
    await upload(fleetId, "bluebook", draft.files.bluebook);
  }
  if (draft.files.routePermit) {
    await upload(fleetId, "routePermit", draft.files.routePermit, {
      validTill: draft.documents.routePermitValidTill,
    });
  }

  // Step 5: Assign seat layout
  notify("Configuring seat layout…");
  const assignment = await read<{ data?: { assignment?: unknown } }>(
    await authFetch(`/busowner/seat-layout-v3/fleets/${fleetId}/assignment`)
  ).catch(() => ({ data: undefined }));

  if (!assignment.data?.assignment) {
    if (draft.layout!.customized) {
      await createInitialCustomFleetLayout(fleetId, {
        name: draft.layout!.templateName,
        layout: draft.layout!.layout,
        sourceTemplateId: draft.layout!.sourceTemplateId,
      });
    } else if (draft.layout!.revisionId) {
      let revisionId = draft.layout!.revisionId;
      if (draft.layout!.templateScope === "PLATFORM" && draft.layout!.templateId) {
        const adopted = await adoptTemplate(
          draft.layout!.templateId,
          draft.layout!.templateName,
          `OP-${draft.layout!.templateId.slice(-10).toUpperCase()}`
        );
        revisionId = adopted.revision.id;
      }
      await read(
        await authFetch(`/busowner/seat-layout-v3/fleets/${fleetId}/assignment`, {
          method: "POST",
          body: JSON.stringify({ revisionId }),
        })
      );
    } else {
      throw new Error("Choose or build a valid seat layout.");
    }
  }

  // Step 6: Submit for verification review if requested
  if (options.submitForReview) {
    notify("Submitting for verification…");
    await read(await authFetch(`/busowner/fleets/${fleetId}/submit`, { method: "POST" }));
  }

  return fleetId;
}

import { authFetch } from "@/lib/auth";
import type { FleetRouteDraft } from "./types";
import type { SeatLayoutV3 } from "@/features/seat-layout-v3/types";
import { ApiResponseError } from "@/lib/api-error";
import type { FleetRegistrationDraft } from "./types";
import { adoptTemplate, createInitialCustomFleetLayout } from "@/features/seat-layout-v3/api";
import { saveFleetRouteSetup } from "./api-route-setup";

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

interface SubmittedFleetPayload {
  data?: {
    fleet?: {
      approvalStatus?: string;
    };
  };
}

async function read<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiResponseError(response, payload);
  }
  return payload;
}

export async function listOperatorFleets(): Promise<FleetListItem[]> {
  const payload = await read<{ data?: { items?: FleetListItem[] } }>(
    await authFetch("/busowner/fleets?limit=100", {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    })
  );
  return payload.data?.items || [];
}

export interface FleetDetailDocument {
  present?: boolean;
  validTill?: string;
  policyNumber?: string;
  count?: number;
  images?: Array<{ view?: string | null }>;
}

export interface FleetDetailPayload {
  brandId?: string;
  busName?: string;
  busNumber?: string;
  busType?: string;
  vehicleType?: string;
  registrationYear?: string;
  totalSeats?: number;
  features?: string[];
  rejectionReason?: string | null;
  vehicle?: {
    busName?: string;
    busNumber?: string;
    busType?: string;
    vehicleType?: string;
    registrationYear?: string;
    totalSeats?: number;
    features?: string[];
  };
  documents?: Record<string, FleetDetailDocument> & { fleetImages?: FleetDetailDocument };
  route?: Partial<FleetRouteDraft>;
  seatLayout?: {
    templateId?: string | null;
    revisionId?: string | null;
    totalPlaces?: number;
    layout?: SeatLayoutV3;
  };
}

export async function getFleetDetail(fleetId: string): Promise<FleetDetailPayload> {
  const payload = await read<{ data?: unknown }>(
    await authFetch(`/busowner/fleets/${fleetId}`, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    })
  );
  const raw = payload.data;
  if (!raw || typeof raw !== "object") return {};
  if ("fleet" in raw && raw.fleet && typeof raw.fleet === "object") {
    return raw.fleet as FleetDetailPayload;
  }
  return raw as FleetDetailPayload;
}

export async function submitFleetDraft(fleetId: string): Promise<void> {
  const payload = await read<SubmittedFleetPayload>(
    await authFetch(`/busowner/fleets/${fleetId}/submit`, { method: "POST" })
  );
  const status = String(payload.data?.fleet?.approvalStatus || "").toUpperCase();
  if (status !== "PENDING") {
    throw new Error("The bus was saved, but it was not submitted for review. Please try Submit for review again.");
  }
}

async function createDraft(draft: FleetRegistrationDraft): Promise<string> {
  const response = await authFetch("/busowner/fleets", {
    method: "POST",
    body: JSON.stringify({
      ...draft.vehicle,
      vehicleType: draft.vehicle.vehicleType.toLowerCase(),
      totalSeats: draft.layout!.totalPlaces,
      corridorId: draft.route.corridorId || undefined,
    }),
  });
  let payload: { data?: { fleet?: { _id?: string; id?: string; fleetId?: string } } };
  try {
    payload = await read<{ data?: { fleet?: { _id?: string; id?: string; fleetId?: string } } }>(response);
  } catch (error) {
    if (error instanceof ApiResponseError && error.status === 409 && error.code === "FLEET_ALREADY_EXISTS") {
      const busNumber = draft.vehicle.busNumber.trim().toUpperCase();
      throw new Error(`A bus with number ${busNumber} is already registered on your account.`);
    }
    throw error;
  }
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

function isLocalFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

async function updateExistingFleet(fleetId: string, draft: FleetRegistrationDraft) {
  await read(await authFetch(`/busowner/fleets/${fleetId}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...draft.vehicle,
      vehicleType: draft.vehicle.vehicleType.toLowerCase(),
      totalSeats: draft.layout?.totalPlaces || 0,
      corridorId: draft.route.corridorId || undefined,
    }),
  }));
}

async function uploadFleetPhotos(
  fleetId: string,
  photos: FleetRegistrationDraft["files"]["photos"],
  changeReason?: string,
) {
  const body = new FormData();
  if (changeReason) body.append("changeReason", changeReason);
  body.append("imageFront", photos.front!);
  body.append("imageSide", photos.side!);
  body.append("imageBack", photos.rear!);
  body.append("imageInside", photos.cabin!);
  await read(await authFetch(`/busowner/fleets/${fleetId}/documents/fleetImages`, { method: "PUT", body }));
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
  const totalSteps = options.submitForReview ? 8 : 7;
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
    // Pre-flight check to avoid 409 console errors for duplicate buses
    const busNumber = draft.vehicle.busNumber.trim().toUpperCase();
    const existingFleets = await listOperatorFleets().catch(() => []);
    const existing = existingFleets.find((fleet) => fleet.busNumber.trim().toUpperCase() === busNumber);

    if (existing) {
      const status = String(existing.approvalStatus || "DRAFT").toUpperCase();
      const statusText =
        status === "PENDING" ? "already in review"
          : status === "APPROVED" ? "already approved"
            : status === "REJECTED" ? "already saved and needs changes"
              : "already saved as a draft";
      throw new Error(`Bus ${busNumber} is ${statusText}. Open it from Your buses instead of submitting it again.`);
    }

    fleetId = await createDraft(draft);
    options.onDraftCreated?.(fleetId);
  } else {
    await updateExistingFleet(fleetId, draft);
  }

  // Step 2: Upload vehicle exterior & interior photos
  notify("Uploading vehicle photos…");
  const photoFiles = Object.values(draft.files.photos);
  const changedPhotoCount = photoFiles.filter(isLocalFile).length;
  if (changedPhotoCount > 0 && changedPhotoCount < 4) {
    throw new Error("To replace fleet photos, choose all four views again: front, rear, side, and cabin.");
  }
  if (changedPhotoCount === 4) {
    await uploadFleetPhotos(
      fleetId,
      draft.files.photos,
      options.existingFleetId ? "Correcting rejected fleet application" : undefined,
    );
  }

  // Step 3: Upload fitness & insurance documents
  notify("Uploading fitness & insurance certificates…");
  if (isLocalFile(draft.files.fitnessCert)) {
    await upload(fleetId, "fitnessCert", draft.files.fitnessCert, {
      validTill: draft.documents.fitnessValidTill,
      ...(options.existingFleetId ? { changeReason: "Correcting rejected fleet application" } : {}),
    });
  }
  if (isLocalFile(draft.files.insurance)) {
    await upload(fleetId, "insurance", draft.files.insurance, {
      policyNumber: draft.documents.insurancePolicyNumber,
      validTill: draft.documents.insuranceValidTill,
      ...(options.existingFleetId ? { changeReason: "Correcting rejected fleet application" } : {}),
    });
  }

  // Step 4: Upload bluebook & route permit
  notify("Uploading bluebook & route permit…");
  if (isLocalFile(draft.files.bluebook)) {
    await upload(fleetId, "bluebook", draft.files.bluebook, options.existingFleetId
      ? { changeReason: "Correcting rejected fleet application" }
      : {});
  }
  if (isLocalFile(draft.files.routePermit)) {
    await upload(fleetId, "routePermit", draft.files.routePermit, {
      validTill: draft.documents.routePermitValidTill,
      ...(options.existingFleetId ? { changeReason: "Correcting rejected fleet application" } : {}),
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

  // Step 6: Persist the canonical journey, selected path and served stops.
  notify("Saving route and meeting places…");
  await saveFleetRouteSetup(fleetId, draft);

  // Step 7: Submit for verification review if requested
  if (options.submitForReview) {
    notify("Submitting for verification…");
    await submitFleetDraft(fleetId);
  }

  return fleetId;
}

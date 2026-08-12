"use client";

import { authFetch } from "@/lib/auth";

export type FleetDocumentSlot =
  | "fleetImages"
  | "fitnessCert"
  | "insurance"
  | "bluebook"
  | "routePermit";

export interface FleetDraftInput {
  busName: string;
  busNumber: string;
  busType: string;
  vehicleType: string;
  totalSeats: number;
  registrationYear?: string;
  requestOriginCity?: string;
  requestDestinationCity?: string;
  requestViaStops?: string[];
}

export interface FleetRegistrationDocuments {
  fleetImages: File[];
  fitnessCert: File;
  insurance: File;
  bluebook: File;
  routePermit: File;
  fitnessCertValidTill?: string;
  insurancePolicyNumber?: string;
  insuranceValidTill?: string;
  routePermitValidTill?: string;
}

export type SeatType = "STANDARD" | "SEMI_SLEEPER" | "SLEEPER_LOWER" | "SLEEPER_UPPER" | "SOFA" | "PRIORITY";
export type CellType = "SEAT" | "AISLE" | "EMPTY" | "DRIVER" | "DOOR";

export interface SeatLayoutCell {
  colIndex: number;
  cellType: CellType;
  seatId: string | null;
  seatLabel: string | null;
  labelScheme?: "KA_KHA" | "ALPHA_NUM" | "NUMERIC";
  seatType?: SeatType;
  isActive?: boolean;
  rowSpan?: number;
  colSpan?: number;
  zone?: "LEFT" | "RIGHT" | "BACK" | "DOOR_ADJACENT" | null;
}

export interface SeatLayoutConfig {
  busShape: "SINGLE_DECKER" | "DOUBLE_DECKER" | "SLEEPER_COACH" | "MINI";
  layoutVariant: string;
  hasKaKha: boolean;
  totalColumns: number;
  floors: Array<{
    floorIndex: number;
    rows: Array<{
      rowIndex: number;
      rowType: "DRIVER_CABIN" | "DOOR_ROW" | "SPACER" | "SEAT_ROW" | "BACK_ROW";
      rowLabel?: string | null;
      cells: SeatLayoutCell[];
    }>;
  }>;
}

export interface SeatTemplateRecord {
  _id: string;
  templateName: string;
  scope: "GLOBAL" | "OPERATOR";
  baseTemplateId?: string | null;
  currentVersionId?: string | null;
  totalSeats: number;
  seatConfig: SeatLayoutConfig;
}

export async function assignSeatLayoutVersion(fleetId: string, seatLayoutVersionId: string) {
  const response = await authFetch(`/busowner/fleets/${fleetId}`, {
    method: "PATCH",
    body: JSON.stringify({ seatLayoutVersionId }),
  });
  await readApiResponse<unknown>(response);
}

export interface FleetDetail {
  fleetId: string;
  fleetCode: string | null;
  vehicle: { busName: string; busNumber: string; busType: string; totalSeats: number };
  approvalStatus: string;
  seatLayout: {
    versionId: string | null;
    nextVersionId: string | null;
    effectiveAt: string | null;
    seatConfig: SeatLayoutConfig | null;
  };
}

export interface SeatLayoutRevision {
  _id: string;
  status: "PENDING_REVIEW" | "APPLYING" | "REJECTED" | "SCHEDULED" | "APPLIED";
  classification: string;
  addedSeatLabels: string[];
  removedSeatLabels: string[];
  effectiveAt: string | null;
  reason?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
}

async function readApiResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        `Request failed with HTTP ${response.status}`
    );
  }
  return payload as T;
}

export async function getFleetDetail(fleetId: string): Promise<FleetDetail> {
  const response = await authFetch(`/busowner/fleets/${fleetId}`);
  const payload = await readApiResponse<{ data: FleetDetail }>(response);
  return payload.data;
}

export async function listSeatTemplates(): Promise<SeatTemplateRecord[]> {
  const response = await authFetch("/busowner/seat-layout-templates");
  const payload = await readApiResponse<{ data: { templates: SeatTemplateRecord[] } }>(response);
  return payload.data.templates;
}

export async function deriveSeatTemplate(baseTemplateId: string, templateName: string) {
  const response = await authFetch("/busowner/seat-layout-templates/derive", {
    method: "POST",
    body: JSON.stringify({ baseTemplateId, templateName }),
  });
  const payload = await readApiResponse<{ data: { template: SeatTemplateRecord } }>(response);
  return payload.data.template;
}

export async function listSeatLayoutRevisions(fleetId: string): Promise<SeatLayoutRevision[]> {
  const response = await authFetch(`/busowner/fleets/${fleetId}/seat-layout-revisions`);
  const payload = await readApiResponse<{ data?: { revisions?: SeatLayoutRevision[] }; revisions?: SeatLayoutRevision[] }>(response);
  return payload.data?.revisions || payload.revisions || [];
}

export async function requestSeatLayoutRevision(
  fleetId: string,
  proposedSeatConfig: SeatLayoutConfig,
  reason: string,
  effectiveAt?: string
): Promise<SeatLayoutRevision> {
  const response = await authFetch(`/busowner/fleets/${fleetId}/seat-layout-revisions`, {
    method: "POST",
    body: JSON.stringify({ seatConfig: proposedSeatConfig, reason, ...(effectiveAt ? { effectiveAt } : {}) }),
  });
  const payload = await readApiResponse<{ data?: { revision?: SeatLayoutRevision }; revision?: SeatLayoutRevision }>(response);
  const revision = payload.data?.revision || payload.revision;
  if (!revision) throw new Error("Seat layout change was saved but no revision was returned.");
  return revision;
}

function resolveCreatedFleetId(payload: unknown): string {
  const record = payload as {
    data?: { fleet?: { _id?: string; id?: string; fleetId?: string } };
  };
  const fleet = record?.data?.fleet;
  const id = fleet?._id || fleet?.id || fleet?.fleetId;
  if (!id) {
    throw new Error("Fleet draft was created, but no fleet ID was returned.");
  }
  return id;
}

export async function createFleetDraft(input: FleetDraftInput): Promise<string> {
  const body: Record<string, unknown> = {
    busName: input.busName,
    busNumber: input.busNumber,
    busType: input.busType,
    vehicleType: input.vehicleType,
    totalSeats: input.totalSeats,
  };

  if (input.registrationYear) body.registrationYear = input.registrationYear;
  if (input.requestOriginCity && input.requestDestinationCity) {
    body.requestOriginCity = input.requestOriginCity;
    body.requestDestinationCity = input.requestDestinationCity;
    if (input.requestViaStops?.length) {
      body.requestViaStops = JSON.stringify(input.requestViaStops);
    }
  }

  const response = await authFetch("/busowner/fleets", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return resolveCreatedFleetId(await readApiResponse<unknown>(response));
}

export async function uploadFleetDocument(
  fleetId: string,
  slot: FleetDocumentSlot,
  files: File[] | File,
  metadata: Record<string, string> = {}
): Promise<void> {
  const formData = new FormData();
  for (const [key, value] of Object.entries(metadata)) {
    if (value) formData.append(key, value);
  }

  if (slot === "fleetImages") {
    for (const file of Array.isArray(files) ? files : [files]) {
      formData.append("fleetImages", file);
    }
  } else {
    const file = Array.isArray(files) ? files[0] : files;
    formData.append(slot, file);
  }

  const response = await authFetch(`/busowner/fleets/${fleetId}/documents/${slot}`, {
    method: "PUT",
    body: formData,
  });
  await readApiResponse<unknown>(response);
}

export async function submitFleetForVerification(fleetId: string): Promise<void> {
  const response = await authFetch(`/busowner/fleets/${fleetId}/submit`, {
    method: "POST",
  });
  await readApiResponse<unknown>(response);
}

export async function registerFleetForVerification(
  input: FleetDraftInput,
  documents: FleetRegistrationDocuments
): Promise<string> {
  const fleetId = await createFleetDraft(input);

  await uploadFleetDocument(fleetId, "fleetImages", documents.fleetImages);
  await uploadFleetDocument(fleetId, "fitnessCert", documents.fitnessCert, {
    validTill: documents.fitnessCertValidTill || "",
  });
  await uploadFleetDocument(fleetId, "insurance", documents.insurance, {
    policyNumber: documents.insurancePolicyNumber || "",
    validTill: documents.insuranceValidTill || "",
  });
  await uploadFleetDocument(fleetId, "bluebook", documents.bluebook);
  await uploadFleetDocument(fleetId, "routePermit", documents.routePermit, {
    validTill: documents.routePermitValidTill || "",
  });
  await submitFleetForVerification(fleetId);

  return fleetId;
}

import { authFetch } from "@/lib/auth";
import { ApiResponseError } from "@/lib/api-error";
import type { CrewVehicleScope, StaffMember, StaffOperationalStatus, StaffRole } from "@/components/dashboard/staff/staff-contract";
import type { OwnerTrip } from "@/features/trip-seat-controls/types";

interface Envelope<T> { success: boolean; data: T; message?: string; }
interface Page<T> extends Envelope<T[]> {
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
export interface CrewAssignmentResult {
  userId: string;
  profileId: string;
  identityId: string;
  staffCode: string;
  phone: string;
  name: string;
  brand: string;
  isUpgrade: boolean;
  alreadyAssigned: boolean;
  securityUpdated: boolean;
  profileStatus: StaffOperationalStatus;
  approvalStatus: string | null;
  activationRequired: boolean;
  acceptanceRequired: boolean;
  accessStatus: StaffMember["accessStatus"];
  invitationDeliveryStatus: StaffMember["invitationDeliveryStatus"];
  notificationStatus: "PENDING" | "QUEUED" | "FAILED" | "NOT_REQUESTED";
  vehicleAssigned?: boolean;
}
export interface CrewInvitationReplayResult {
  userId: string;
  profileId: string;
  phone: string;
  brand: string;
  alreadyAssigned: true;
  activationRequired: boolean;
  acceptanceRequired: boolean;
  accessStatus: "INVITED";
  invitationDeliveryStatus: StaffMember["invitationDeliveryStatus"];
  notificationStatus: "PENDING" | "QUEUED" | "FAILED";
}
export interface CrewIdentityPreview {
  role: StaffRole;
  staffCode: string;
  fullName: string;
  phone?: string;
  gender?: "male" | "female" | "other" | null;
  experienceYears?: number;
  verificationStatus?: "PENDING" | "APPROVED" | "REJECTED";
  license?: { type: "HV" | "LV" | "TRK" | null; expiresOn: string | null };
  connectionEligibility: { canConnect: boolean; reason: string | null };
}
export interface ConductorInput {
  role: "conductor"; brandId: string; name: string; phone: string;
}
export interface DriverInput {
  role: "driver"; brandId: string; name: string; phone: string;
  gender: "male" | "female" | "other"; experienceYears: number;
  licenseNumber: string; licenseType: "HV" | "LV" | "TRK"; licenseExpiry: string;
  licenseDoc?: File;
}
export type CrewInput = ConductorInput | DriverInput;

export interface VehicleCrewOption {
  profileId: string;
  role: StaffRole;
  fullName: string;
  phone: string;
  staffCode: string | null;
  status: StaffOperationalStatus;
  accessStatus: StaffMember["accessStatus"];
  approvalStatus: string | null;
  licenseType: string | null;
  licenseExpiry: string | null;
  eligible: boolean;
  blockingReason: string | null;
  isCurrent: boolean;
  currentVehicles: { id: string; busName: string; busNumber: string }[];
  assignedToOtherBus?: { id: string; busName: string; busNumber: string } | null;
}

export interface VehicleCrewOptions {
  vehicle: { id: string; busName: string; busNumber: string };
  currentProfileId: string | null;
  options: VehicleCrewOption[];
}

async function read<T>(response: Response, fallback: string): Promise<T> {
  const payload = await response.json().catch(() => null) as Envelope<T> | null;
  if (!response.ok) throw new ApiResponseError(response, payload, fallback);
  return payload?.data as T;
}
export async function listCrew(input: {
  role: StaffRole; brandId?: string; status?: StaffOperationalStatus; search?: string; page?: number;
}): Promise<Page<StaffMember>> {
  const params = new URLSearchParams({ role: input.role, page: String(input.page || 1), limit: "20" });
  if (input.brandId) params.set("brandId", input.brandId);
  if (input.status) params.set("status", input.status);
  if (input.search?.trim()) params.set("search", input.search.trim());
  const response = await authFetch(`/busowner/crew?${params.toString()}`);
  const payload = await response.json().catch(() => null) as Page<StaffMember> | null;
  if (!response.ok) throw new ApiResponseError(response, payload, "Unable to load crew");
  return payload || { success: true, data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
}
export async function lookupCrewIdentity(role: StaffRole, identifier: string): Promise<CrewIdentityPreview> {
  const params = new URLSearchParams({ role, identifier: identifier.trim() });
  return read<CrewIdentityPreview>(
    await authFetch(`/busowner/crew/lookup?${params.toString()}`),
    `${role === "driver" ? "Driver" : "Conductor"} not found`,
  );
}
export async function connectCrewIdentity(input: {
  role: StaffRole; staffCode: string; brandId: string;
}): Promise<{ data: CrewAssignmentResult; message: string }> {
  const response = await authFetch("/busowner/crew/connections", {
    method: "POST", body: JSON.stringify(input),
  });
  const payload = await response.json().catch(() => null) as Envelope<CrewAssignmentResult> | null;
  if (!response.ok) throw new ApiResponseError(response, payload, "Unable to connect crew account");
  return { data: payload!.data, message: payload?.message || "Crew account connected." };
}
export async function assignCrew(input: CrewInput): Promise<{ data: CrewAssignmentResult; message: string }> {
  const { role, ...body } = input;
  let requestBody: BodyInit;
  if (role === "driver") {
    const driverBody = body as Omit<DriverInput, "role">;
    const form = new FormData();
    Object.entries(driverBody).forEach(([key, value]) => {
      if (key !== "licenseDoc" && value !== undefined) form.append(key, String(value));
    });
    if (driverBody.licenseDoc instanceof File) form.append("licenseDoc", driverBody.licenseDoc);
    requestBody = form;
  } else requestBody = JSON.stringify(body);
  const response = await authFetch(role === "driver" ? "/busowner/assignDriver" : "/busowner/assignConductor", {
    method: "POST", body: requestBody,
  });
  const payload = await response.json().catch(() => null) as Envelope<CrewAssignmentResult> | null;
  if (!response.ok) throw new ApiResponseError(response, payload, "Unable to assign crew");
  return { data: payload!.data, message: payload?.message || "Crew assigned." };
}
export async function listVehicleCrewOptions(
  fleetId: string,
  role: StaffRole,
  search?: string,
): Promise<VehicleCrewOptions> {
  const params = new URLSearchParams({ role });
  if (search?.trim()) params.set("search", search.trim());
  return read<VehicleCrewOptions>(await authFetch(
    `/busowner/fleets/${encodeURIComponent(fleetId)}/crew-options?${params.toString()}`,
  ), `Unable to load ${role}s for this vehicle`);
}
export async function setVehicleCurrentCrew(
  fleetId: string,
  role: StaffRole,
  profileId: string,
): Promise<VehicleCrewOption> {
  const storageKey = `shuvmarg:crew-change:${fleetId}:${role}:${profileId}`;
  const requestId = typeof window === "undefined" ? crypto.randomUUID()
    : window.localStorage.getItem(storageKey) || crypto.randomUUID();
  if (typeof window !== "undefined") window.localStorage.setItem(storageKey, requestId);
  try {
    const result = await read<VehicleCrewOption>(await authFetch(
      `/busowner/fleets/${encodeURIComponent(fleetId)}/current-crew/${role}`,
      { method: "PUT", body: JSON.stringify({ profileId, requestId }) },
    ), `Unable to update the current ${role}`);
    if (typeof window !== "undefined") window.localStorage.removeItem(storageKey);
    return result;
  } catch (error) {
    if (typeof window !== "undefined" && error instanceof ApiResponseError
      && error.status < 500 && error.code !== "CREW_CHANGE_IN_PROGRESS") {
      window.localStorage.removeItem(storageKey);
    }
    throw error;
  }
}
export async function removeCrew(staff: StaffMember): Promise<void> {
  if (!staff.userId) throw new Error("This registry record has no crew app account to remove.");
  const response = await authFetch(staff.role === "driver" ? "/busowner/removeDriver" : "/busowner/removeConductor", {
    method: "DELETE", body: JSON.stringify(staff.role === "driver"
      ? { profileId: staff.id, driverUserId: staff.userId }
      : { profileId: staff.id, conductorUserId: staff.userId }),
  });
  await read<unknown>(response, "Unable to remove crew");
}
export async function updateCrewVehicleScope(
  staff: StaffMember,
  vehicleScope: CrewVehicleScope,
  allowedVehicleIds: string[],
): Promise<void> {
  await read<unknown>(await authFetch(
    `/busowner/crew/${staff.role}/${encodeURIComponent(staff.id)}/vehicle-scope`,
    { method: "PATCH", body: JSON.stringify({ vehicleScope, allowedVehicleIds }) },
  ), "Unable to update vehicle access");
}
export async function updateCrewStatus(staff: StaffMember, status: "AVAILABLE" | "OFF_DUTY"): Promise<void> {
  const response = await authFetch(
    `/busowner/crew/${staff.role}/${encodeURIComponent(staff.id)}/status`,
    { method: "PATCH", body: JSON.stringify({ status }) },
  );
  await read<unknown>(response, "Unable to update crew status");
}
export async function resendCrewInvitation(staff: StaffMember): Promise<{ data: CrewInvitationReplayResult; message: string }> {
  const response = await authFetch(
    `/busowner/crew/${staff.role}/${encodeURIComponent(staff.id)}/invitation/resend`,
    { method: "POST" },
  );
  const payload = await response.json().catch(() => null) as Envelope<CrewInvitationReplayResult> | null;
  if (!response.ok) throw new ApiResponseError(response, payload, "Unable to resend invitation SMS");
  return { data: payload!.data, message: payload?.message || "Invitation SMS requested." };
}
export async function listCrewTrips(): Promise<OwnerTrip[]> {
  return read<OwnerTrip[]>(await authFetch("/busowner/getMyTrips"), "Unable to load trips");
}
export async function setConductorTrip(profileId: string, tripId: string, assigned: boolean): Promise<void> {
  await read<unknown>(await authFetch(
    `/busowner/conductors/${encodeURIComponent(profileId)}/trips/${encodeURIComponent(tripId)}`,
    { method: assigned ? "PUT" : "DELETE" },
  ), "Unable to update trip assignment");
}

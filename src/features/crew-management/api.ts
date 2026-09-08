import { authFetch } from "@/lib/auth";
import { ApiResponseError } from "@/lib/api-error";
import type { StaffMember, StaffOperationalStatus, StaffRole } from "@/components/dashboard/staff/staff-contract";
import type { OwnerTrip } from "@/features/trip-seat-controls/types";

interface Envelope<T> { success: boolean; data: T; message?: string; }
interface Page<T> extends Envelope<T[]> {
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
export interface CrewAssignmentResult {
  userId: string;
  profileId: string;
  phone: string;
  name: string;
  brand: string;
  isUpgrade: boolean;
  alreadyAssigned: boolean;
  securityUpdated: boolean;
  profileStatus: StaffOperationalStatus;
  approvalStatus: string | null;
  activationRequired: boolean;
  accessStatus: StaffMember["accessStatus"];
  invitationDeliveryStatus: StaffMember["invitationDeliveryStatus"];
  notificationStatus: "QUEUED" | "FAILED" | "NOT_REQUESTED";
}
export interface ConductorInput {
  role: "conductor"; brandId: string; name: string; phone: string; resendInvite?: boolean;
}
export interface DriverInput {
  role: "driver"; brandId: string; name: string; phone: string;
  gender: "male" | "female" | "other"; experienceYears: number;
  licenseNumber: string; licenseType: "HV" | "LV" | "TRK"; licenseExpiry: string;
  licenseDoc?: File;
  resendInvite?: boolean;
}
export type CrewInput = ConductorInput | DriverInput;

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
export async function removeCrew(staff: StaffMember): Promise<void> {
  if (!staff.userId) throw new Error("This registry record has no crew app account to remove.");
  const response = await authFetch(staff.role === "driver" ? "/busowner/removeDriver" : "/busowner/removeConductor", {
    method: "DELETE", body: JSON.stringify(staff.role === "driver"
      ? { driverUserId: staff.userId } : { conductorUserId: staff.userId }),
  });
  await read<unknown>(response, "Unable to remove crew");
}
export async function updateCrewStatus(staff: StaffMember, status: "AVAILABLE" | "OFF_DUTY"): Promise<void> {
  const response = await authFetch(
    `/busowner/crew/${staff.role}/${encodeURIComponent(staff.id)}/status`,
    { method: "PATCH", body: JSON.stringify({ status }) },
  );
  await read<unknown>(response, "Unable to update crew status");
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

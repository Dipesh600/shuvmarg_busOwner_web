import { authFetch } from "@/lib/auth";
import {
  GetStaffResponse,
  StaffRole,
  StaffOperationalStatus,
  StaffMember,
} from "./staff-contract";

export async function fetchMyStaff(): Promise<GetStaffResponse> {
  const res = await authFetch("/busowner/getMyStaff");
  if (!res.ok) {
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    throw new Error(`Failed to load staff (HTTP ${res.status})`);
  }
  const json = await res.json();
  return json.data || {
    staff: [],
    brands: [],
    summary: { totalStaff: 0, driversCount: 0, conductorsCount: 0, activeCount: 0 },
  };
}

export async function assignStaffMember(payload: {
  role: StaffRole;
  name: string;
  phone: string;
  brandId: string;
  licenseNumber?: string;
  licenseType?: string;
  licenseExpiry?: string;
}): Promise<{ message: string; data?: unknown }> {
  const endpoint =
    payload.role === "driver"
      ? "/busowner/assignDriver"
      : "/busowner/assignConductor";

  const res = await authFetch(endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || `Failed to assign ${payload.role}`);
  }
  return json;
}

export async function updateStaffOperationalStatus(
  staffId: string,
  role: StaffRole,
  status: StaffOperationalStatus
): Promise<void> {
  const res = await authFetch("/busowner/updateStaffStatus", {
    method: "PATCH",
    body: JSON.stringify({ staffId, role, status }),
  });

  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.message || "Failed to update staff status");
  }
}

export async function removeStaffMember(
  userId: string,
  role: StaffRole
): Promise<void> {
  const endpoint =
    role === "driver"
      ? "/busowner/removeDriver"
      : "/busowner/removeConductor";

  const body =
    role === "driver"
      ? { driverUserId: userId }
      : { conductorUserId: userId };

  const res = await authFetch(endpoint, {
    method: "DELETE",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.message || `Failed to remove ${role}`);
  }
}

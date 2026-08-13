export type StaffRole = "driver" | "conductor";

export type StaffOperationalStatus =
  | "AVAILABLE"
  | "ON_DUTY"
  | "OFF_DUTY"
  | "INACTIVE"
  | "SUSPENDED";

export type StaffAccountStatus = "invited" | "active" | "inactive";

export interface StaffMember {
  id: string;
  userId?: string;
  role: StaffRole;
  fullName: string;
  phone: string;
  email?: string | null;
  brand: string;
  brandId: string;
  status: StaffOperationalStatus;
  approvalStatus?: string;
  accountStatus: StaffAccountStatus;
  phoneVerified?: boolean;
  licenseNumber?: string | null;
  licenseType?: string | null;
  licenseExpiry?: string | null;
  createdAt?: string;
}

export interface StaffSummaryStats {
  totalStaff: number;
  driversCount: number;
  conductorsCount: number;
  activeCount: number;
  agentsCount?: number;
}


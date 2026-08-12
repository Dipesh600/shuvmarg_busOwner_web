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

export interface PartnerAgentCounter {
  id: string;
  counterName: string;
  agentName: string;
  phone: string;
  email?: string | null;
  location: string;
  district: string;
  commissionRate: string;
  status: "ACTIVE" | "PENDING" | "INACTIVE";
  ticketsSoldMonth?: number;
  joinedDate?: string;
}

export interface StaffSummaryStats {
  totalStaff: number;
  driversCount: number;
  conductorsCount: number;
  activeCount: number;
  agentsCount?: number;
}

export interface OperatorBrandOption {
  id: string;
  name: string;
}

export interface GetStaffResponse {
  staff: StaffMember[];
  brands: OperatorBrandOption[];
  summary: StaffSummaryStats;
}

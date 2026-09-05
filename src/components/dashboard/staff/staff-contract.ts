export type StaffRole = "driver" | "conductor";

export type StaffOperationalStatus =
  | "AVAILABLE"
  | "ON_DUTY"
  | "OFF_DUTY"
  | "INACTIVE"
  | "SUSPENDED";

export type StaffAccessStatus = "NOT_LINKED" | "INVITED" | "ACTIVE" | "SUSPENDED" | "REMOVED";
export type InvitationDeliveryStatus = "NOT_REQUIRED" | "PENDING" | "QUEUED" | "FAILED";

export interface AssignedCrewTrip {
  id: string;
  tripId?: string;
  tripDate: string;
  departureTime: string;
  arrivalTime?: string;
  status: string;
  bus?: { id: string; name?: string; number?: string } | null;
  route?: { id: string; name?: string; from?: string; to?: string } | null;
}

export interface StaffMember {
  id: string;
  userId?: string;
  role: StaffRole;
  fullName: string;
  phone: string;
  email?: string | null;
  brand?: string;
  brandId: string;
  status: StaffOperationalStatus;
  approvalStatus?: string;
  accessStatus: StaffAccessStatus;
  invitationDeliveryStatus: InvitationDeliveryStatus;
  phoneVerified?: boolean;
  invitedAt?: string | null;
  activatedAt?: string | null;
  invitationLastAttemptAt?: string | null;
  licenseNumber?: string | null;
  licenseType?: string | null;
  licenseExpiry?: string | null;
  gender?: "male" | "female" | "other" | null;
  experienceYears?: number;
  createdAt?: string;
  removedAt?: string | null;
  assignedBusId?: string | null;
  assignedTrips?: AssignedCrewTrip[];
}

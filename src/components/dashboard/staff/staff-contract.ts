export type StaffRole = "driver" | "conductor";

export type StaffOperationalStatus =
  | "AVAILABLE"
  | "ON_DUTY"
  | "OFF_DUTY"
  | "INACTIVE"
  | "SUSPENDED";

export type StaffAccessStatus = "NOT_LINKED" | "INVITED" | "ACTIVE" | "SUSPENDED" | "DECLINED" | "LEFT" | "REMOVED";
export type InvitationDeliveryStatus = "NOT_REQUIRED" | "PENDING" | "QUEUED" | "FAILED";
export type CrewVehicleScope = "ANY_VEHICLE" | "ONE_VEHICLE" | "SELECTED_VEHICLES";

export interface CrewAccessHistoryEvent {
  from?: StaffAccessStatus | null;
  to: StaffAccessStatus;
  at: string;
  actorType: "OWNER" | "CREW" | "SYSTEM";
  reason?: string | null;
}

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
  identityId?: string | null;
  staffCode?: string | null;
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
  accountStatus?: string | null;
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
  assignedBusNumber?: string | null;
  assignedBusName?: string | null;
  emergencyContact?: string | null;
  address?: string | null;
  notes?: string | null;
  assignedTrips?: AssignedCrewTrip[];
  declinedAt?: string | null;
  leftAt?: string | null;
  accessEndedReason?: string | null;
  vehicleScope?: CrewVehicleScope;
  allowedVehicleIds?: string[];
  accessHistory?: CrewAccessHistoryEvent[];
}

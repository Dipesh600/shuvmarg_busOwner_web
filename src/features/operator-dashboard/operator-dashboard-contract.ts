/**
 * src/features/operator-dashboard/operator-dashboard-contract.ts
 *
 * Domain contracts, normalization functions, setup evidence modeling,
 * and capability definitions for the Shuvmarg Operator Dashboard foundation.
 */

export type VerificationStatus =
  | "not_submitted"
  | "pending"
  | "rejected"
  | "approved";

export interface BusOwnerProfile {
  ownerId: string | null;
  ownerCode: string | null;
  userId: string | null;
  profile: {
    name: string;
    email: string;
    phone: string;
    profilePicture: string | null;
    status: string;
  };
  business: {
    companyName: string;
    registeredAddress: {
      tole: string | null;
      wardNumber: string | null;
      municipality: string | null;
      district: string | null;
      province: string | null;
      postalCode: string | null;
      country: string;
    } | null;
  };
  bank: {
    present: boolean;
    bankName: string | null;
    accountNumber: string | null;
    accountHolderName: string | null;
    branchName: string | null;
    swiftCode: string | null;
  };
  verificationStatus: string;
  rejectionReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface KycDocumentDescriptor {
  documentType: string;
  label?: string;
  uploaded: boolean;
  fileCount?: number;
  status?: string;
  rejectionReason?: string | null;
}

export interface KycSubmittedDetails {
  panNumber: string | null;
  registrationNumber: string | null;
}

export interface BusOwnerKycStatus {
  ownerId: string;
  ownerCode: string | null;
  verificationStatus: string;
  rejectionReason: string | null;
  documents?: KycDocumentDescriptor[];
  documentSummary?: {
    totalRequired?: number;
    totalUploaded?: number;
    isComplete?: boolean;
  };
  submittedDetails?: KycSubmittedDetails;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface OperatorFleetListItem {
  fleetId: string;
  fleetCode: string | null;
  busName: string;
  busNumber: string;
  busType?: string;
  totalSeats?: number;
  status?: string;
  approvalStatus: "DRAFT" | "PENDING" | "REJECTED" | "APPROVED" | string;
  rejectionReason: string | null;
  setupComplete: boolean;
  documentSummary?: {
    totalSlots?: number;
    present?: number;
    missing?: number;
    pending?: number;
    approved?: number;
    rejected?: number;
  };
  createdAt: string | null;
  updatedAt: string | null;
}

export interface OperatorFleetOverview {
  items: OperatorFleetListItem[];
  totalItems: number;
}

export interface SetupEvidence {
  accountCreated: true;
  businessProfileComplete: boolean;
  businessVerificationStatus: VerificationStatus;
  settlementAccountPresent: boolean;
  firstVehicleStatus: "unknown";
  fleetVerificationStatus: "unknown";
  operationalActivationStatus: "unknown";
}

export interface OperatorCapabilities {
  canManageBusiness: boolean;
  canPrepareFleet: boolean;
  canManageRoutes: boolean;
  canManageTrips: boolean;
  canViewBookings: boolean;
  canViewFinance: boolean;
  canViewReports: boolean;
}

export interface OperatorDashboardState {
  isLoading: boolean;
  error: string | null;
  profile: BusOwnerProfile | null;
  kycStatus: BusOwnerKycStatus | null;
  fleet: OperatorFleetOverview;
  verificationStatus: VerificationStatus;
  evidence: SetupEvidence;
  capabilities: OperatorCapabilities;
}

export function isFirstLoginOverview(
  state: Pick<OperatorDashboardState, "fleet">
): boolean {
  return !state.fleet.items.some(
    (vehicle) => String(vehicle.approvalStatus || "").trim().toUpperCase() === "APPROVED"
  );
}

export function hasKycSubmissionEvidence(
  kycStatus: BusOwnerKycStatus | null
): boolean {
  if (!kycStatus) return false;
  if ((kycStatus.documentSummary?.totalUploaded || 0) > 0) return true;
  return Boolean(kycStatus.documents?.some((document) => document.uploaded));
}

/**
 * Checks if a string value is present and not equal to "N/A" (case-insensitive).
 */
export function hasUsableValue(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed === "") return false;
  if (trimmed.toUpperCase() === "N/A") return false;
  return true;
}

/**
 * Normalizes backend verification status values.
 * Uses /busowner/kyc-status response as canonical source of truth.
 */
export function normalizeVerificationStatus(
  kycHttpStatus: number | null,
  rawStatus?: string | null
): VerificationStatus {
  if (kycHttpStatus === 404 || !rawStatus) {
    return "not_submitted";
  }

  const normalized = rawStatus.trim().toLowerCase();

  switch (normalized) {
    case "pending":
    case "under_review":
      return "pending";
    case "rejected":
    case "changes_required":
      return "rejected";
    case "approved":
    case "verified":
      return "approved";
    default:
      return "not_submitted";
  }
}

/**
 * Maps verification status to user-facing status label.
 */
export function getVerificationStatusLabel(status: VerificationStatus): string {
  switch (status) {
    case "pending":
      return "Under review";
    case "rejected":
      return "Changes required";
    case "approved":
      return "Approved";
    case "not_submitted":
    default:
      return "Not submitted";
  }
}

/**
 * Derives operational capabilities based on evidence.
 */
export function deriveCapabilities(
  verificationStatus: VerificationStatus
): OperatorCapabilities {
  const isApproved = verificationStatus === "approved";
  return {
    canManageBusiness: true,
    canPrepareFleet: true,
    canManageRoutes: isApproved,
    canManageTrips: false,
    canViewBookings: false,
    canViewFinance: false,
    canViewReports: false,
  };
}

/**
 * Derives evidence state from profile and kyc-status.
 */
export function deriveSetupEvidence(
  profile: BusOwnerProfile | null,
  kycStatus: BusOwnerKycStatus | null,
  verificationStatus: VerificationStatus
): SetupEvidence {
  const hasName = hasUsableValue(profile?.profile?.name);
  const hasPhone = hasUsableValue(profile?.profile?.phone);
  const hasCompany = hasUsableValue(profile?.business?.companyName);

  const businessProfileComplete = hasName && hasPhone && hasCompany;

  const bankPresent = Boolean(
    profile?.bank?.present ||
      (hasUsableValue(profile?.bank?.accountNumber) &&
        hasUsableValue(profile?.bank?.bankName))
  );

  return {
    accountCreated: true,
    businessProfileComplete,
    businessVerificationStatus: verificationStatus,
    settlementAccountPresent: bankPresent,
    firstVehicleStatus: "unknown",
    fleetVerificationStatus: "unknown",
    operationalActivationStatus: "unknown",
  };
}

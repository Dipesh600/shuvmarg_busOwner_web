/**
 * src/features/operator-dashboard/setup-progress.ts
 *
 * Pure setup progress calculation and checklist item builder for the Shuvmarg Operator Dashboard.
 * Strictly calculates percentage based on the 4 evidence-backed business setup items.
 */

import type { SetupEvidence } from "./operator-dashboard-contract.ts";

export type StepStatus = "complete" | "in_progress" | "not_started" | "locked";

export interface SetupChecklistItem {
  id: string;
  label: string;
  description: string;
  status: StepStatus;
  isEvidenceBacked: boolean;
}

export interface SetupProgressResult {
  percentage: number;
  completedItemsCount: number;
  totalEvidenceItemsCount: number;
  items: SetupChecklistItem[];
}

/**
 * Computes business setup progress from evidence state.
 */
export function calculateSetupProgress(
  evidence: SetupEvidence
): SetupProgressResult {
  const accountItem: SetupChecklistItem = {
    id: "account_created",
    label: "Account created",
    description: "Operator user account successfully registered",
    status: "complete",
    isEvidenceBacked: true,
  };

  const profileStatus: StepStatus = evidence.businessProfileComplete
    ? "complete"
    : "in_progress";

  const profileItem: SetupChecklistItem = {
    id: "business_profile",
    label: "Business profile",
    description: "Company name, primary contact name and phone number",
    status: profileStatus,
    isEvidenceBacked: true,
  };

  let kycStatus: StepStatus = "not_started";
  if (evidence.businessVerificationStatus === "approved") {
    kycStatus = "complete";
  } else if (
    evidence.businessVerificationStatus === "pending" ||
    evidence.businessVerificationStatus === "rejected"
  ) {
    kycStatus = "in_progress";
  }

  const kycItem: SetupChecklistItem = {
    id: "business_verification",
    label: "Business verification",
    description: "Company registration, tax documents, and identity KYC",
    status: kycStatus,
    isEvidenceBacked: true,
  };

  const settlementStatus: StepStatus = evidence.settlementAccountPresent
    ? "complete"
    : "not_started";

  const settlementItem: SetupChecklistItem = {
    id: "settlement_account",
    label: "Settlement account",
    description: "Bank details for ticket revenue payout",
    status: settlementStatus,
    isEvidenceBacked: true,
  };

  // 3 future operational items (display only, not in percentage)
  const vehicleItem: SetupChecklistItem = {
    id: "first_vehicle",
    label: "First vehicle",
    description: "Bus details, bluebook, and route assignment",
    status: "not_started",
    isEvidenceBacked: false,
  };

  const fleetVerificationItem: SetupChecklistItem = {
    id: "fleet_verification",
    label: "Fleet verification",
    description: "Vehicle inspection and document approval",
    status: "locked",
    isEvidenceBacked: false,
  };

  const operationalActivationItem: SetupChecklistItem = {
    id: "operational_activation",
    label: "Operational activation",
    description: "Schedule publishing and live ticket sales capability",
    status: "locked",
    isEvidenceBacked: false,
  };

  const evidenceItems = [accountItem, profileItem, kycItem, settlementItem];
  const completedCount = evidenceItems.filter(
    (item) => item.status === "complete"
  ).length;

  const percentage = Math.round((completedCount / evidenceItems.length) * 100);

  return {
    percentage,
    completedItemsCount: completedCount,
    totalEvidenceItemsCount: evidenceItems.length,
    items: [
      accountItem,
      profileItem,
      kycItem,
      settlementItem,
      vehicleItem,
      fleetVerificationItem,
      operationalActivationItem,
    ],
  };
}

export interface FleetProgressSource {
  approvalStatus: string;
  setupComplete?: boolean;
  documentSummary?: {
    totalSlots?: number;
    present?: number;
    missing?: number;
  };
}

export interface FleetSetupProgress {
  percentage: number;
  label: string;
  actionLabel: string;
  isDraft: boolean;
}

export function getFleetSetupProgress(
  fleet: FleetProgressSource,
  businessApproved: boolean
): FleetSetupProgress {
  const status = String(fleet.approvalStatus || "DRAFT").toUpperCase();
  if (status === "APPROVED") {
    return { percentage: 100, label: "Approved and ready", actionLabel: "View vehicle", isDraft: false };
  }
  if (status === "PENDING") {
    return { percentage: 100, label: "Submitted for review", actionLabel: "View review status", isDraft: false };
  }
  if (status === "REJECTED") {
    return { percentage: 90, label: "Changes requested", actionLabel: "Review required changes", isDraft: false };
  }

  const total = Math.max(0, fleet.documentSummary?.totalSlots || 0);
  const present = Math.min(total, Math.max(0, fleet.documentSummary?.present || 0));
  const documentProgress = total > 0 ? Math.round((present / total) * 40) : 0;
  const completeDraft = total > 0 && present === total;

  return {
    percentage: Math.min(80, 40 + documentProgress),
    label: completeDraft
      ? businessApproved ? "Ready to submit" : "Prepared — waiting for business approval"
      : "Vehicle setup in progress",
    actionLabel: completeDraft && businessApproved ? "Submit for review" : "Continue setup",
    isDraft: true,
  };
}

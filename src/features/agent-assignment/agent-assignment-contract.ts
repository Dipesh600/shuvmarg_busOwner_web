export type AssignmentStatus = "INVITED" | "ACTIVE" | "SUSPENDED" | "REVOKED" | "DECLINED" | "EXPIRED";
export type AccessScope = "ALL_BUSES" | "ROUTES" | "SCHEDULES";
export type CommissionMode = "PERCENT" | "FLAT_PER_SEAT" | "FLAT_PER_BOOKING";

export interface AgentPreview {
  agentCode: string;
  name: string | null;
  outletType: string | null;
  businessName: string | null;
  district?: string | null;
  municipality?: string | null;
  kycStatus: string;
  isVerified: boolean;
  canBeAssigned?: boolean;
}

export interface AssignmentTerms {
  access: { accessScope: AccessScope; allowedRouteIds: string[]; allowedScheduleIds: string[] };
  permissions: {
    canSellCash: boolean;
    canSellOnline: boolean;
    canCancel: boolean;
    cancelWindowMins: number;
    maxSeatsPerBooking: number | null;
    maxDiscountPct: number;
  };
  commission: { mode: CommissionMode; value: number };
}

export interface AgentAssignment extends AssignmentTerms {
  assignmentId: string;
  status: AssignmentStatus;
  invitedAt: string | null;
  expiresAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  salesCount?: number;
  statusReason?: string | null;
  operatorNote?: string | null;
  agent: AgentPreview;
  brand: { id: string; name: string | null };
}

export interface AssignmentOptions {
  brand: { id: string; name: string | null };
  routes: { id: string; code: string | null; name: string; direction: string | null }[];
  schedules: {
    id: string;
    routeId: string | null;
    routeName: string | null;
    bus: { id: string; name: string | null; number: string | null };
    departureTime: string;
    arrivalTime: string;
    recurrence: string;
    daysOfWeek: number[];
  }[];
}

export interface AssignmentDraft {
  agentCode: string;
  brandId: string;
  accessScope: AccessScope;
  allowedRouteIds: string[];
  allowedScheduleIds: string[];
  canSellCash: boolean;
  canSellOnline: boolean;
  canCancel: boolean;
  cancelWindowMins: string;
  maxSeatsPerBooking: string;
  maxDiscountPct: string;
  commissionMode: CommissionMode;
  commissionValue: string;
}

export const EMPTY_ASSIGNMENT_DRAFT: AssignmentDraft = {
  agentCode: "", brandId: "", accessScope: "ALL_BUSES",
  allowedRouteIds: [], allowedScheduleIds: [],
  canSellCash: true, canSellOnline: false, canCancel: false,
  cancelWindowMins: "0", maxSeatsPerBooking: "", maxDiscountPct: "0",
  commissionMode: "PERCENT", commissionValue: "0",
};

// These switches describe real agent actions available in the backend today.
// Keep unavailable terms fail-closed even if stale client state contains them.
export const AGENT_PERMISSION_AVAILABILITY = {
  cashSales: true,
  onlineSales: false,
  cancellation: false,
  discount: false,
} as const;

const numberOr = (value: string, fallback: number) => value.trim() === "" ? fallback : Number(value);

export function assignmentPayload(draft: AssignmentDraft) {
  return {
    agentCode: draft.agentCode.trim(),
    brandId: draft.brandId,
    accessScope: draft.accessScope,
    allowedRouteIds: draft.accessScope === "ROUTES" ? draft.allowedRouteIds : [],
    allowedScheduleIds: draft.accessScope === "SCHEDULES" ? draft.allowedScheduleIds : [],
    permissions: {
      canSellCash: AGENT_PERMISSION_AVAILABILITY.cashSales && draft.canSellCash,
      canSellOnline: AGENT_PERMISSION_AVAILABILITY.onlineSales && draft.canSellOnline,
      canCancel: AGENT_PERMISSION_AVAILABILITY.cancellation && draft.canCancel,
      cancelWindowMins: AGENT_PERMISSION_AVAILABILITY.cancellation && draft.canCancel
        ? numberOr(draft.cancelWindowMins, 0) : 0,
      maxSeatsPerBooking: draft.maxSeatsPerBooking.trim() ? Number(draft.maxSeatsPerBooking) : null,
      maxDiscountPct: AGENT_PERMISSION_AVAILABILITY.discount ? numberOr(draft.maxDiscountPct, 0) : 0,
    },
    commission: { mode: draft.commissionMode, value: numberOr(draft.commissionValue, 0) },
  };
}

export function validateAssignmentDraft(draft: AssignmentDraft): string | null {
  if (!draft.agentCode.trim()) return "Look up or create an agent first.";
  if (!draft.brandId) return "Choose an operator brand.";
  if (draft.accessScope === "ROUTES" && draft.allowedRouteIds.length === 0) return "Choose at least one route.";
  if (draft.accessScope === "SCHEDULES" && draft.allowedScheduleIds.length === 0) return "Choose at least one schedule.";
  const payload = assignmentPayload(draft);
  const values = [payload.permissions.cancelWindowMins, payload.permissions.maxDiscountPct, payload.commission.value];
  if (values.some((value) => !Number.isFinite(value) || value < 0)) return "Permission and commission values must be valid positive numbers.";
  if (payload.permissions.maxSeatsPerBooking !== null
    && (!Number.isInteger(payload.permissions.maxSeatsPerBooking) || payload.permissions.maxSeatsPerBooking < 1)) {
    return "Maximum seats must be a whole number greater than zero.";
  }
  if (draft.commissionMode === "PERCENT" && payload.commission.value > 100) return "Percentage commission cannot exceed 100%.";
  return null;
}

export function assignmentDraftsForBrands(draft: AssignmentDraft, brandIds: string[]): AssignmentDraft[] {
  const ids = [...new Set(brandIds.filter(Boolean))];
  const isMultiBrand = ids.length > 1;
  return ids.map((brandId) => ({
    ...draft,
    brandId,
    accessScope: isMultiBrand ? "ALL_BUSES" : draft.accessScope,
    allowedRouteIds: isMultiBrand ? [] : draft.allowedRouteIds,
    allowedScheduleIds: isMultiBrand ? [] : draft.allowedScheduleIds,
  }));
}

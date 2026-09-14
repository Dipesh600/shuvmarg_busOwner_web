import { authFetch } from "@/lib/auth";

export type SchedulePlanPayload = {
  requestId: string;
  replaceServicePlanId?: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  recurrence: "DAILY" | "CUSTOM";
  daysOfWeek?: number[];
  returnMode: "SAME_DAY" | "NEXT_DAY";
  advanceBookingDays: number;
  bookingCutoffHours: number;
  outbound: {
    variantId: string;
    operatorRouteConfigId: string;
    departureTime: string;
    arrivalTime: string;
    arrivalDayOffset: number;
  };
  returnTrip: {
    variantId: string;
    operatorRouteConfigId: string;
    departureTime: string;
    arrivalTime: string;
    arrivalDayOffset: number;
  };
};

export interface RecoverableSchedule {
  _id: string;
  servicePlanId?: string | null;
  status: string;
  variantId?: string | { _id?: string };
  operatorRouteConfigId?: string | { _id?: string };
  departureTime: string;
  arrivalTime: string;
  arrivalDayOffset?: number;
  recurrence: "DAILY" | "WEEKLY" | "CUSTOM";
  daysOfWeek?: number[];
  effectiveFrom: string;
  effectiveUntil?: string | null;
  operationalModel?: "TURNAROUND" | "RELAY";
  returnMode?: "SAME_DAY" | "NEXT_DAY" | null;
  advanceBookingDays?: number;
  bookingCutoffHours?: number;
}

export interface RecoverableSchedulePlan {
  servicePlanId: string;
  status: string;
  canReplace: boolean;
  pairComplete: boolean;
  pairIssue: { code: string; message: string } | null;
  primary: RecoverableSchedule;
  returnSchedule: RecoverableSchedule | null;
}

export class ScheduleConflictError extends Error {
  code: string;
  conflictingStatus: string | null;
  conflictingScheduleId: string | null;
  isInternalCandidateConflict: boolean;
  recoveryPlan: RecoverableSchedulePlan | null;
  constructor(message: string, status: string | null, scheduleId: string | null, isInternal = false, recoveryPlan: RecoverableSchedulePlan | null = null, code = "SCHEDULE_TIME_CONFLICT") {
    super(message);
    this.code = code;
    this.conflictingStatus = status;
    this.conflictingScheduleId = scheduleId;
    this.isInternalCandidateConflict = isInternal;
    this.recoveryPlan = recoveryPlan;
  }
}

async function read<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const message = (body.message as string) || `Request failed (HTTP ${response.status})`;
    if (body.code === "SCHEDULE_TIME_CONFLICT" || body.recoveryPlan) {
      throw new ScheduleConflictError(
        message,
        (body.conflictingStatus as string) || null,
        (body.conflictingScheduleId as string) || null,
        Boolean(body.isInternalCandidateConflict),
        (body.recoveryPlan as RecoverableSchedulePlan) || null,
        String(body.code || "SCHEDULE_TIME_CONFLICT"),
      );
    }
    throw new Error(message);
  }
  return body as T;
}

export async function recoverFleetSchedulePlan(fleetId: string) {
  return read<{ success: boolean; data: { draft: RecoverableSchedulePlan | null } }>(
    await authFetch(`/busowner/fleets/${encodeURIComponent(fleetId)}/schedule-plan/recovery`)
  );
}

const requestKey = (fleetId: string) => `shuvmarg:schedule-plan-request:${fleetId}`;

export function persistentScheduleRequestId(fleetId: string) {
  const fallback = () => globalThis.crypto?.randomUUID?.()
    || `schedule-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  if (typeof window === "undefined") return fallback();
  const key = requestKey(fleetId);
  const saved = window.localStorage.getItem(key);
  if (saved) return saved;
  const created = fallback();
  window.localStorage.setItem(key, created);
  return created;
}

export function clearScheduleRequestId(fleetId: string) {
  if (typeof window !== "undefined") window.localStorage.removeItem(requestKey(fleetId));
}

export async function saveFleetSchedulePlan(fleetId: string, payload: SchedulePlanPayload) {
  return read(await authFetch(`/busowner/fleets/${encodeURIComponent(fleetId)}/schedule-plan`, {
    method: "POST",
    body: JSON.stringify(payload),
  }));
}

export interface PublishPlanOptions {
  requestId: string;
  availableElementIds?: string[];
  pricing?: {
    defaultFare: number;
    overrides?: Array<{ elementId: string; fare: number }>;
  };
}

export type PublicationState = "DRAFT" | "PREPARING" | "ACTIVE" | "FAILED" | "REQUIRES_ATTENTION";

export interface PublicationRecovery {
  state: PublicationState;
  requestId: string | null;
  fingerprint: string | null;
  lastError: string | null;
  updatedAt: string | null;
  configuration: {
    availableElementIds: string[];
    pricing: {
      defaultFare: number;
      overrides: Array<{ elementId: string; fare: number }>;
    };
  } | null;
}

export class PublicationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly publication: PublicationRecovery | null,
  ) {
    super(message);
  }
}

const publicationRequestKey = (fleetId: string) => `shuvmarg:publication-request:${fleetId}`;

export function persistentPublicationRequestId(fleetId: string, serverRequestId?: string | null) {
  const create = () => globalThis.crypto?.randomUUID?.()
    || `publish-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  if (typeof window === "undefined") return serverRequestId || create();
  const key = publicationRequestKey(fleetId);
  if (serverRequestId) {
    window.localStorage.setItem(key, serverRequestId);
    return serverRequestId;
  }
  const saved = window.localStorage.getItem(key);
  if (saved) return saved;
  const requestId = create();
  window.localStorage.setItem(key, requestId);
  return requestId;
}

export async function publishFleetSchedulePlan(
  fleetId: string,
  scheduleId?: string | null,
  options?: PublishPlanOptions
) {
  const response = await authFetch(`/busowner/fleets/${encodeURIComponent(fleetId)}/schedule-plan/publish`, {
    method: "POST",
    body: JSON.stringify({
      ...(scheduleId ? { scheduleId } : {}),
      requestId: options?.requestId,
      ...(options?.availableElementIds ? { availableElementIds: options.availableElementIds } : {}),
      ...(options?.pricing ? { pricing: options.pricing } : {}),
    }),
  });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    throw new PublicationError(
      (body.message as string) || `Request failed (HTTP ${response.status})`,
      String(body.code || "PUBLICATION_FAILED"),
      (body.publication as PublicationRecovery) || null,
    );
  }
  return body;
}

export type RouteChangeScope = "TEMPORARY" | "PERMANENT" | "SELECTED_DATES";

export interface RouteChangePayload {
  requestId: string;
  scheduleId?: string;
  scope: RouteChangeScope;
  primaryVariantId: string;
  returnVariantId?: string;
  primaryOperatorRouteConfigId: string;
  returnOperatorRouteConfigId?: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
  selectedDates?: string[];
  reason: string;
}

export interface RouteAssignment {
  _id: string;
  servicePlanId: string;
  scope: "BASELINE" | RouteChangeScope | "ONE_TRIP";
  effectiveFrom: string;
  effectiveUntil?: string | null;
  selectedDates?: string[];
  reason: string;
  status: "ACTIVE" | "REVOKED";
  primaryVariantId: string | { _id: string; name?: string; code?: string; revisionNumber?: number };
  returnVariantId?: string | { _id: string; name?: string; code?: string; revisionNumber?: number } | null;
}

const newRouteChangeRequestId = (fleetId: string) => globalThis.crypto?.randomUUID?.()
  || `route-${fleetId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function persistentRouteChangeRequestId(fleetId: string, target: string, signature: string) {
  if (typeof window === "undefined") return newRouteChangeRequestId(fleetId);
  const key = `shuvmarg:route-change:${fleetId}:${target}`;
  try {
    const saved = JSON.parse(window.localStorage.getItem(key) || "null") as {
      signature?: string;
      requestId?: string;
    } | null;
    if (saved?.signature === signature && saved.requestId) return saved.requestId;
  } catch {
    // A damaged browser value should not block an operational route change.
  }
  const requestId = newRouteChangeRequestId(fleetId);
  window.localStorage.setItem(key, JSON.stringify({ signature, requestId }));
  return requestId;
}

export function clearPersistentRouteChangeRequestId(fleetId: string, target: string) {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(`shuvmarg:route-change:${fleetId}:${target}`);
  }
}

export async function listFleetRouteAssignments(fleetId: string, scheduleId?: string) {
  const query = scheduleId ? `?scheduleId=${encodeURIComponent(scheduleId)}` : "";
  return read<{ success: boolean; data: { servicePlanId: string; assignments: RouteAssignment[] } }>(
    await authFetch(`/busowner/fleets/${encodeURIComponent(fleetId)}/schedule-plan/routes${query}`)
  );
}

export async function changeFleetServiceRoute(fleetId: string, payload: RouteChangePayload) {
  return read(await authFetch(`/busowner/fleets/${encodeURIComponent(fleetId)}/schedule-plan/routes`, {
    method: "POST",
    body: JSON.stringify(payload),
  }));
}

export async function overrideFleetTripRoute(
  fleetId: string,
  tripId: string,
  payload: Omit<RouteChangePayload, "scope" | "scheduleId" | "effectiveFrom" | "effectiveUntil" | "selectedDates">,
) {
  return read(await authFetch(
    `/busowner/fleets/${encodeURIComponent(fleetId)}/trips/${encodeURIComponent(tripId)}/route-override`,
    { method: "POST", body: JSON.stringify(payload) },
  ));
}

export type OperationalChangeType =
  | "CHANGE_ROUTE" | "CHANGE_STOPS"
  | "CHANGE_OUTBOUND_TIMING" | "CHANGE_RETURN_TIMING"
  | "CHANGE_FARE" | "CHANGE_AVAILABLE_SEATS"
  | "CHANGE_DRIVER" | "CHANGE_CONDUCTOR"
  | "CHANGE_OPERATING_DAYS" | "CHANGE_BOOKING_CUTOFF"
  | "SUSPEND_SERVICE" | "CANCEL_SERVICE";
export type OperationalChangeScope = "ONE_TRIP" | "SELECTED_DATES" | "ALL_FUTURE";

export interface OperationalChangeInput {
  changeType: OperationalChangeType;
  scope: OperationalChangeScope;
  tripId?: string;
  selectedDates?: string[];
  effectiveFrom?: string;
  values: Record<string, unknown>;
  reason: string;
}

export interface OperationalImpact {
  affectedTrips: { count: number; items: Array<{ tripId: string; publicTripId?: string | null; date: string; departureTime: string; direction?: string | null; status: string }> };
  bookings: { count: number; passengerCount: number; affectedTripCount: number; references: Array<{ bookingId: string; ticketId?: string; tripId: string }> };
  activeHolds: number;
  manualCrewOverridesPreserved?: number;
  protectedConflicts: Array<{ code: string; message: string; count: number; tripIds: string[] }>;
  notifications: { required: boolean; audience: string; bookingCount: number; reasons?: string[]; message: string };
  bookingProtection: {
    hasExistingBookings: boolean;
    bookingCount: number;
    passengerCount: number;
    bookedSeatCount: number;
    departure: { changes: boolean; from?: string | null; to?: string | null; deltaMinutes?: number | null; minimumDeltaMinutes: number; maximumDeltaMinutes: number; arrivalChanges: boolean; arrivalFrom?: string | null; arrivalTo?: string | null; arrivalDeltaMinutes?: number | null; anyTimingChanges: boolean; major: boolean };
    boarding: { changes: boolean; affectedBookingCount: number; removedStopBookingCount: number };
    route: { changes: boolean; significant: boolean; variantChanges: boolean; stopsChange: boolean; boardingLocationChanges: boolean; affectedBoardingBookingCount: number; removedBookedStopCount: number };
    fare: { changes: boolean; from?: number | null; to?: number | null; difference: number; existingBookingsKeepPaidFare: boolean };
  };
  passengerResolution: { required: boolean; refundOrRebookingRequired: boolean; reasons: string[]; affectedBookingIds: string[]; message?: string | null };
  canApply: boolean;
  currentValues: Record<string, unknown> | null;
  requestedValues: Record<string, unknown>;
  crew?: { profileId: string; fullName?: string } | null;
}

export interface OperationalChangePreview {
  changeId: string;
  impactToken: string;
  expiresAt: string;
  changeType: OperationalChangeType;
  scope: OperationalChangeScope;
  impact: OperationalImpact;
}

export async function previewFleetOperationalChange(fleetId: string, input: OperationalChangeInput) {
  return read<{ success: boolean; data: OperationalChangePreview }>(await authFetch(
    `/busowner/fleets/${encodeURIComponent(fleetId)}/schedule-plan/operational-changes/preview`,
    { method: "POST", body: JSON.stringify(input) },
  )).then((response) => response.data);
}

export async function applyFleetOperationalChange(fleetId: string, input: {
  impactToken: string;
  requestId: string;
  confirmImpact: boolean;
  confirmNotifications: boolean;
  confirmPassengerResolution: boolean;
}) {
  return read<{ success: boolean; data: Record<string, unknown> }>(await authFetch(
    `/busowner/fleets/${encodeURIComponent(fleetId)}/schedule-plan/operational-changes/apply`,
    { method: "POST", body: JSON.stringify(input) },
  )).then((response) => response.data);
}

export async function listFleetOperationalChanges(fleetId: string) {
  return read<{ success: boolean; data: Array<Record<string, unknown>> }>(await authFetch(
    `/busowner/fleets/${encodeURIComponent(fleetId)}/schedule-plan/operational-changes`,
  )).then((response) => response.data);
}

export function persistentOperationalChangeRequestId(fleetId: string, changeId: string) {
  const key = `shuvmarg:operational-change:${fleetId}:${changeId}`;
  if (typeof window === "undefined") return crypto.randomUUID();
  const saved = window.localStorage.getItem(key);
  if (saved) return saved;
  const requestId = crypto.randomUUID();
  window.localStorage.setItem(key, requestId);
  return requestId;
}

export function clearOperationalChangeRequestId(fleetId: string, changeId: string) {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(`shuvmarg:operational-change:${fleetId}:${changeId}`);
  }
}

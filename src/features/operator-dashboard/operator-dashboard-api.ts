/**
 * src/features/operator-dashboard/operator-dashboard-api.ts
 *
 * API integration for the Operator Dashboard foundation.
 * Uses authFetch() to fetch profile and KYC status in parallel with explicit 404 handling.
 */

import { authFetch } from "@/lib/auth";
import {
  BusOwnerProfile,
  BusOwnerKycStatus,
  FleetOperationsStepKey,
  OperatorFleetListItem,
  OperatorFleetSetupStatus,
  OperatorDashboardState,
  normalizeVerificationStatus,
  deriveCapabilities,
  deriveSetupEvidence,
  hasKycSubmissionEvidence,
  findFirstApprovedFleetAwaitingOperations,
  hasOperationalApprovedFleet,
  isApprovedFleet,
  applyFleetSetupStatusToFleetItems,
  normalizeAssignedRouteSummary,
} from "./operator-dashboard-contract";
import { normalizeKycStatusPayload } from "./operator-dashboard-kyc-normalizer";
import { collectFleetSetupResults } from "./fleet-setup-results";

/**
 * Fetches profile and KYC status to construct the unified OperatorDashboardState.
 * Explicitly treats /busowner/kyc-status 404 as "not_submitted".
 */
let dashboardRequest: Promise<OperatorDashboardState> | null = null;
let dashboardSnapshot: { value: OperatorDashboardState; loadedAt: number } | null = null;
const DASHBOARD_CACHE_MS = 5_000;
const OPERATIONS_STEP_KEYS: FleetOperationsStepKey[] = [
  "routeAssigned",
  "routeConfigured",
  "driverAssigned",
  "scheduleCreated",
  "activated",
];
const OPERATIONS_STEP_LABELS: Record<FleetOperationsStepKey, string> = {
  routeAssigned: "Route approved",
  routeConfigured: "Stops & timings",
  driverAssigned: "Driver",
  scheduleCreated: "Trip schedule",
  activated: "Start selling tickets",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function safeString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function safeNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeFleetSetupStatusPayload(
  raw: unknown,
  expectedFleetId: string,
): OperatorFleetSetupStatus {
  const envelope = isRecord(raw) && "data" in raw ? raw.data : raw;
  if (!isRecord(envelope)) {
    throw new Error("Invalid fleet setup status response");
  }

  const fleetId = safeString(envelope.fleetId);
  if (!fleetId || fleetId !== expectedFleetId) {
    throw new Error("Fleet setup status response did not match the requested vehicle");
  }

  const rawSteps = isRecord(envelope.steps) ? envelope.steps : {};
  const steps = OPERATIONS_STEP_KEYS.reduce<Partial<Record<FleetOperationsStepKey, boolean>>>(
    (acc, key) => {
      acc[key] = rawSteps[key] === true;
      return acc;
    },
    {},
  );
  const rawStepDetails = Array.isArray(envelope.stepDetails) ? envelope.stepDetails : [];
  const stepDetails = OPERATIONS_STEP_KEYS.map((key) => {
    const matching = rawStepDetails.find(
      (step) => isRecord(step) && step.key === key,
    );
    return {
      key,
      label: OPERATIONS_STEP_LABELS[key],
      complete: isRecord(matching) ? matching.complete === true : steps[key] === true,
    };
  });
  const completedSteps = stepDetails.filter((step) => step.complete).length;
  const progress = isRecord(envelope.progress) ? envelope.progress : {};
  const nextStep = OPERATIONS_STEP_KEYS.includes(envelope.nextStep as FleetOperationsStepKey)
    ? envelope.nextStep as FleetOperationsStepKey
    : "complete";

  return {
    fleetId,
    brandId: safeString(envelope.brandId),
    busName: safeString(envelope.busName),
    busNumber: safeString(envelope.busNumber),
    approvalStatus: safeString(envelope.approvalStatus),
    setupComplete: envelope.setupComplete === true,
    nextStep,
    isFullyOperational: envelope.isFullyOperational === true,
    steps,
    stepDetails,
    progress: {
      completedSteps: safeNumber(progress.completedSteps, completedSteps),
      totalSteps: safeNumber(progress.totalSteps, stepDetails.length),
      percentage: Math.max(0, Math.min(100, Math.round(safeNumber(progress.percentage, Math.round((completedSteps / stepDetails.length) * 100))))),
    },
    blockingReasons: Array.isArray(envelope.blockingReasons)
      ? envelope.blockingReasons
          .filter((reason): reason is string => typeof reason === "string")
          .map((reason) => reason.slice(0, 120))
      : [],
    scheduleId: safeString(envelope.scheduleId),
    returnScheduleId: safeString(envelope.returnScheduleId),
    assignedRoute: normalizeAssignedRouteSummary(envelope.assignedRoute, envelope.assignedCorridor),
    assignedCorridor: envelope.assignedCorridor,
    assignedRouteConfigs: Array.isArray(envelope.assignedRouteConfigs) ? envelope.assignedRouteConfigs : [],
    assignedDriver: envelope.assignedDriver,
    outboundScheduleData: envelope.outboundScheduleData,
    returnScheduleData: envelope.returnScheduleData,
  };
}

async function fetchFleetSetupStatus(fleetId: string): Promise<OperatorFleetSetupStatus> {
  const setupRes = await authFetch(`/busowner/fleets/${encodeURIComponent(fleetId)}/setup-status`);
  if (!setupRes.ok) {
    if (setupRes.status === 401) throw new Error("UNAUTHORIZED");
    throw new Error(`Failed to load bus readiness setup (HTTP ${setupRes.status})`);
  }
  return normalizeFleetSetupStatusPayload(await setupRes.json(), fleetId);
}

async function loadOperatorDashboardState(): Promise<OperatorDashboardState> {
  const [profileRes, kycRes] = await Promise.all([
    authFetch("/busowner/profile"),
    authFetch("/busowner/kyc-status"),
  ]);

  if (!profileRes.ok) {
    if (profileRes.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    throw new Error(
      `Failed to load operator profile (HTTP ${profileRes.status})`
    );
  }

  const profileJson = await profileRes.json();
  const profile: BusOwnerProfile | null = profileJson.data || profileJson;

  let kycStatus: BusOwnerKycStatus | null = null;
  let rawKycStatus: string | null = null;

  if (kycRes.ok) {
    const kycJson = await kycRes.json();
    kycStatus = normalizeKycStatusPayload(kycJson.data || kycJson);
    rawKycStatus = kycStatus?.verificationStatus || null;
  } else if (kycRes.status === 404) {
    // 404 is the expected response when no KYC submission exists yet
    kycStatus = null;
    rawKycStatus = null;
  } else if (kycRes.status === 401) {
    throw new Error("UNAUTHORIZED");
  } else {
    throw new Error(`Failed to load KYC status (HTTP ${kycRes.status})`);
  }

  const reportedVerificationStatus = normalizeVerificationStatus(
    kycRes.status,
    rawKycStatus
  );
  const verificationStatus =
    reportedVerificationStatus === "pending" &&
    !hasKycSubmissionEvidence(kycStatus)
      ? "not_submitted"
      : reportedVerificationStatus;

  // Draft fleet preparation is available before business approval. Only the
  // submit transition is approval-gated by the backend.
  const fleetRes = await authFetch("/busowner/fleets?limit=50");
  if (!fleetRes.ok) {
    if (fleetRes.status === 401) throw new Error("UNAUTHORIZED");
    throw new Error(`Failed to load fleet status (HTTP ${fleetRes.status})`);
  }
  const fleetJson = await fleetRes.json();
  const fleetData = fleetJson.data || fleetJson;
  const rawFleetItems: OperatorFleetListItem[] = Array.isArray(fleetData?.items) ? fleetData.items : [];
  const fleetTotalItems = typeof fleetData?.pagination?.totalItems === "number"
    ? fleetData.pagination.totalItems : rawFleetItems.length;
  const setupResults = await Promise.allSettled(
    rawFleetItems
      .filter(isApprovedFleet)
      .map((fleet) => fetchFleetSetupStatus(fleet.fleetId)),
  );
  const approvedFleetSetupStatuses = collectFleetSetupResults(setupResults);
  const setupStatusByFleetId = new Map(
    approvedFleetSetupStatuses.map((setup) => [setup.fleetId, setup]),
  );
  const fleetSetupStatusesByFleetId = Object.fromEntries(
    approvedFleetSetupStatuses.map((setup) => [setup.fleetId, setup]),
  );
  const fleetItems = applyFleetSetupStatusToFleetItems(
    rawFleetItems,
    approvedFleetSetupStatuses,
  );
  const fleetOverview = {
    items: fleetItems,
    totalItems: fleetTotalItems,
  };
  const firstFleetSetup = !hasOperationalApprovedFleet({ fleet: fleetOverview })
    ? setupStatusByFleetId.get(
        findFirstApprovedFleetAwaitingOperations({ fleet: fleetOverview })?.fleetId || "",
      ) || null
    : null;

  const evidence = deriveSetupEvidence(profile, kycStatus, verificationStatus);
  const capabilities = deriveCapabilities(verificationStatus);

  return {
    isLoading: false,
    error: null,
    profile,
    kycStatus,
    fleet: fleetOverview,
    firstFleetSetup,
    fleetSetupStatusesByFleetId,
    verificationStatus,
    evidence,
    capabilities,
  };
}

export function fetchOperatorDashboardState(
  options: { force?: boolean } = {},
): Promise<OperatorDashboardState> {
  if (!options.force && dashboardSnapshot && Date.now() - dashboardSnapshot.loadedAt < DASHBOARD_CACHE_MS) {
    return Promise.resolve(dashboardSnapshot.value);
  }
  if (!options.force && dashboardRequest) return dashboardRequest;

  const request = loadOperatorDashboardState()
    .then((value) => {
      dashboardSnapshot = { value, loadedAt: Date.now() };
      return value;
    })
    .finally(() => {
      if (dashboardRequest === request) dashboardRequest = null;
    });
  dashboardRequest = request;
  return request;
}

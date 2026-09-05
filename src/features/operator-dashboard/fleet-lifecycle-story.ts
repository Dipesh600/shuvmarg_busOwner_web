import type {
  AssignedRouteSummary,
  FleetOperationsStepKey,
  OperatorFleetSetupStatus,
} from "./operator-dashboard-contract";

type FleetStoryStatus = "DRAFT" | "PENDING" | "REJECTED" | "APPROVED" | string;

export interface FleetStoryFleet {
  fleetId: string;
  busName: string;
  busNumber: string;
  busType?: string;
  totalSeats?: number;
  approvalStatus?: FleetStoryStatus;
  rejectionReason?: string | null;
  setupComplete?: boolean;
  createdBy?: "ADMIN" | "BUS_OWNER" | string;
}

export type FleetLifecycleTone = "neutral" | "warning" | "danger" | "success";

export interface FleetLifecycleStory {
  status: string;
  label: string;
  badgeTone: FleetLifecycleTone;
  description: string;
  primaryActionLabel: string | null;
  secondaryActionLabel: string | null;
  previewLocked: boolean;
  isApproved: boolean;
  isOperational: boolean;
  needsOperationsSetup: boolean;
  preparedByShuvmarg: boolean;
  routeText: string | null;
  routeCode: string | null;
  progressPercentage: number | null;
  progressText: string | null;
  nextStepLabel: string | null;
  nextStepDetail: string | null;
}

export const FLEET_OPERATIONS_NEXT_STEP_COPY: Record<
  FleetOperationsStepKey | "complete",
  { title: string; detail: string; short: string }
> = {
  routeAssigned: {
    title: "Route approved",
    short: "Route approved",
    detail: "Shuvmarg has approved where this bus can run.",
  },
  routeConfigured: {
    title: "Choose stops & timings",
    short: "Stops & timings",
    detail: "Pick the stops this bus will serve and add the arrival/departure times passengers will see.",
  },
  driverAssigned: {
    title: "Assign driver",
    short: "Assign driver",
    detail: "Choose the approved driver or crew member who will operate this bus.",
  },
  scheduleCreated: {
    title: "Add trip schedule",
    short: "Trip schedule",
    detail: "Choose the days and departure times this bus will run.",
  },
  activated: {
    title: "Start selling tickets",
    short: "Start selling",
    detail: "Final check. Once this is on, passengers can book this bus.",
  },
  complete: {
    title: "Ready for passengers",
    short: "Live",
    detail: "Passengers can book this bus now.",
  },
};

export function getFleetRouteText(route?: AssignedRouteSummary | null): string | null {
  if (!route) return null;
  if (route.origin && route.destination) return `${route.origin} \u2192 ${route.destination}`;
  return route.label || route.code || null;
}

export function getFleetNextStepCopy(
  nextStep?: FleetOperationsStepKey | "complete" | null,
): { title: string; detail: string; short: string } {
  if (!nextStep) return FLEET_OPERATIONS_NEXT_STEP_COPY.routeAssigned;
  return FLEET_OPERATIONS_NEXT_STEP_COPY[nextStep] || FLEET_OPERATIONS_NEXT_STEP_COPY.routeAssigned;
}

function cleanText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function clampPercentage(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function buildFleetLifecycleStory(
  fleet: FleetStoryFleet,
  setup?: OperatorFleetSetupStatus | null,
  options: { businessApproved?: boolean; localDraftId?: string | null } = {},
): FleetLifecycleStory {
  const status = String(fleet.approvalStatus || "DRAFT").trim().toUpperCase();
  const preparedByShuvmarg = status === "DRAFT" && fleet.createdBy === "ADMIN";
  const routeText = getFleetRouteText(setup?.assignedRoute);
  const routeCode = setup?.assignedRoute?.code || null;
  const setupComplete = Boolean(
    status === "APPROVED" && (setup?.setupComplete || setup?.isFullyOperational || fleet.setupComplete),
  );
  const progressPercentage = status === "APPROVED"
    ? setupComplete
      ? 100
      : clampPercentage(setup?.progress?.percentage)
    : null;
  const progressText = status === "APPROVED"
    ? setupComplete
      ? "Ready for passengers"
      : setup?.progress
        ? `${setup.progress.completedSteps} of ${setup.progress.totalSteps} setup steps done`
        : null
    : null;
  const nextCopy = getFleetNextStepCopy(setupComplete ? "complete" : setup?.nextStep);

  if (status === "PENDING") {
    return {
      status,
      label: "In review",
      badgeTone: "warning",
      description: "Submitted for Shuvmarg review. Editing is locked unless changes are requested.",
      primaryActionLabel: "Preview submission",
      secondaryActionLabel: null,
      previewLocked: true,
      isApproved: false,
      isOperational: false,
      needsOperationsSetup: false,
      preparedByShuvmarg,
      routeText,
      routeCode,
      progressPercentage: null,
      progressText: null,
      nextStepLabel: null,
      nextStepDetail: null,
    };
  }

  if (status === "REJECTED") {
    return {
      status,
      label: "Needs changes",
      badgeTone: "danger",
      description: cleanText(fleet.rejectionReason) || "Shuvmarg requested corrections before this bus can be approved.",
      primaryActionLabel: "Correct",
      secondaryActionLabel: "Preview",
      previewLocked: false,
      isApproved: false,
      isOperational: false,
      needsOperationsSetup: false,
      preparedByShuvmarg,
      routeText,
      routeCode,
      progressPercentage: null,
      progressText: null,
      nextStepLabel: null,
      nextStepDetail: null,
    };
  }

  if (status === "APPROVED") {
    return {
      status,
      label: setupComplete ? "Live" : "Approved",
      badgeTone: setupComplete ? "success" : "neutral",
      description: setupComplete
        ? "Passengers can book this bus now."
        : "Approved by Shuvmarg. Finish the remaining steps before passengers can book this bus.",
      primaryActionLabel: setupComplete ? "View bus" : "Get bus ready",
      secondaryActionLabel: setupComplete ? null : "Preview",
      previewLocked: false,
      isApproved: true,
      isOperational: setupComplete,
      needsOperationsSetup: !setupComplete,
      preparedByShuvmarg,
      routeText,
      routeCode,
      progressPercentage,
      progressText,
      nextStepLabel: setupComplete ? "Ready for passengers" : nextCopy.title,
      nextStepDetail: setupComplete ? nextCopy.detail : nextCopy.short,
    };
  }

  return {
    status,
    label: "Draft",
    badgeTone: "neutral",
    description: preparedByShuvmarg
      ? "Prepared by Shuvmarg. Review the details and finish the journey setup before submitting."
      : options.businessApproved
        ? "Saved draft. Complete the setup and submit this bus for review."
        : "Saved. You can finish this bus while business verification continues.",
    primaryActionLabel: options.businessApproved
      ? preparedByShuvmarg
        ? "Review and finish setup"
        : options.localDraftId
          ? "Continue setup"
          : "Open setup"
      : null,
    secondaryActionLabel: null,
    previewLocked: false,
    isApproved: false,
    isOperational: false,
    needsOperationsSetup: false,
    preparedByShuvmarg,
    routeText,
    routeCode,
    progressPercentage: null,
    progressText: null,
    nextStepLabel: null,
    nextStepDetail: null,
  };
}

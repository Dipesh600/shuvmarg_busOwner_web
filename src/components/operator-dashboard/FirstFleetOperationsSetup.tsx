"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CircleDashed,
  LockKeyhole,
  MapPinned,
  Radio,
  Route,
  UserCheck,
  UsersRound,
} from "lucide-react";
import type {
  FleetOperationsStepKey,
  OperatorFleetListItem,
  OperatorFleetSetupStatus,
} from "@/features/operator-dashboard/operator-dashboard-contract";
import { getFleetRouteText } from "@/features/operator-dashboard/fleet-lifecycle-story";
import RouteServiceSetupModal from "./RouteServiceSetupModal";
import VehicleCrewAssignmentModal from "./VehicleCrewAssignmentModal";
import type { StaffRole } from "@/components/dashboard/staff/staff-contract";
import CrewAssignmentDialog from "@/components/dashboard/staff/CrewAssignmentDialog";
import { listMyBrands, type OperatorBrand } from "@/features/fleet-registration/api-brands";
import TripScheduleModal from "./TripScheduleModal";
import StartSellingTicketsModal from "./StartSellingTicketsModal";
import {
  fetchCopyablePeers,
  type CopyablePeerBus,
} from "@/features/operator-dashboard/fleet-copy-api";
import CopyFleetConfigurationModal from "./CopyFleetConfigurationModal";
import { fetchFleetSetupStatus } from "@/features/operator-dashboard/operator-dashboard-api";

interface FirstFleetOperationsSetupProps {
  fleet: OperatorFleetListItem;
  setup: OperatorFleetSetupStatus;
  eyebrow?: string;
  onBackToBuses?: () => void;
}

const STEP_ICONS: Record<FleetOperationsStepKey, typeof Route> = {
  routeAssigned: Route,
  routeConfigured: MapPinned,
  driverAssigned: UserCheck,
  conductorAssigned: UsersRound,
  scheduleCreated: CalendarDays,
  activated: Radio,
};

const STEP_LABELS: Record<FleetOperationsStepKey, string> = {
  routeAssigned: "Route approved",
  routeConfigured: "Stops & timings",
  driverAssigned: "Driver",
  conductorAssigned: "Conductor",
  scheduleCreated: "Trip schedule",
  activated: "Start selling tickets",
};

function getRowState(
  complete: boolean,
  index: number,
  firstIncompleteIndex: number,
): "complete" | "next" | "waiting" {
  if (complete) return "complete";
  return index === firstIncompleteIndex ? "next" : "waiting";
}

function getStepDetail(
  stepKey: FleetOperationsStepKey,
  rowState: "complete" | "next" | "waiting",
  assignedRouteText: string | null,
  assignedCrewName?: string | null,
): string {
  if (stepKey === "routeAssigned") {
    if (assignedRouteText) return assignedRouteText;
    if (rowState === "complete") return "Route approved";
  }
  if ((stepKey === "driverAssigned" || stepKey === "conductorAssigned")
    && rowState === "complete" && assignedCrewName) {
    return `${assignedCrewName} · current assignment — rotate anytime`;
  }
  const copy: Record<FleetOperationsStepKey, { complete: string; next: string; waiting: string }> = {
    routeAssigned: {
      complete: "Approved route saved",
      next: "Waiting for route approval",
      waiting: "Waiting for route approval",
    },
    routeConfigured: {
      complete: "Passenger stops and daily timings saved",
      next: "Choose passenger stops and daily timings",
      waiting: "Available after route approval",
    },
    driverAssigned: {
      complete: "Current driver selected — rotate anytime",
      next: "Choose the current driver for this bus",
      waiting: "Available after stops and timings",
    },
    conductorAssigned: {
      complete: "Current conductor selected — rotate anytime",
      next: "Choose the current conductor for this bus",
      waiting: "Available after a driver is selected",
    },
    scheduleCreated: {
      complete: "Trip schedule created",
      next: "Choose when this bus will run",
      waiting: "Available after driver and conductor are selected",
    },
    activated: {
      complete: "Passengers can book this bus",
      next: "Publish this bus for passengers",
      waiting: "Available after the trip schedule",
    },
  };
  return copy[stepKey][rowState];
}

function assignedName(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("fullName" in value)) return null;
  return typeof value.fullName === "string" && value.fullName.trim() ? value.fullName : null;
}

function scheduleSummary(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const schedule = value as Record<string, unknown>;
  const departure = typeof schedule.departureTime === "string" ? schedule.departureTime.trim() : "";
  const arrival = typeof schedule.arrivalTime === "string" ? schedule.arrivalTime.trim() : "";
  if (departure && arrival) return `${departure} – ${arrival}`;
  if (departure) return `Departs ${departure}`;
  return null;
}

export default function FirstFleetOperationsSetup({
  fleet,
  setup: initialSetup,
  eyebrow = "First approved bus",
  onBackToBuses,
}: FirstFleetOperationsSetupProps) {
  const [setup, setSetup] = useState<OperatorFleetSetupStatus>(initialSetup);

  const refreshSetup = useCallback(async () => {
    try {
      const fresh = await fetchFleetSetupStatus(fleet.fleetId);
      setSetup(fresh);
      return fresh;
    } catch {
      return null;
    }
  }, [fleet.fleetId]);

  const fallbackReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const [routeSetupOpen, setRouteSetupOpen] = useState(false);
  const [crewModalRole, setCrewModalRole] = useState<StaffRole | null>(null);
  const [crewCreateRole, setCrewCreateRole] = useState<StaffRole | null>(null);
  const [crewBrands, setCrewBrands] = useState<OperatorBrand[]>([]);
  const [crewNotice, setCrewNotice] = useState<{ message: string; warning: boolean } | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [highlightedStep, setHighlightedStep] = useState<FleetOperationsStepKey | null>(null);
  const [copyablePeers, setCopyablePeers] = useState<CopyablePeerBus[]>([]);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const firstIncompleteIndex = setup.stepDetails.findIndex((step) => !step.complete);
  const displayBusName = setup.busName || fleet.busName;
  const displayBusNumber = setup.busNumber || fleet.busNumber;
  const assignedRouteText = getFleetRouteText(setup.assignedRoute);
  const canReviewRouteSetup = Boolean(
    setup.steps.routeAssigned || setup.assignedRoute || assignedRouteText,
  );
  const driverName = assignedName(setup.assignedDriver);
  const conductorName = assignedName(setup.assignedConductor);
  const completedSteps = setup.stepDetails.filter((step) => step.complete).length;
  const totalSteps = setup.stepDetails.length;
  const progressPercentage = totalSteps > 0
    ? Math.round((completedSteps / totalSteps) * 100)
    : 0;
  const isTakingBookings = Boolean(
    setup.steps.activated || setup.isFullyOperational || setup.setupComplete,
  );
  const publicationState = setup.publication?.state || (isTakingBookings ? "ACTIVE" : "DRAFT");
  const nextAction = publicationState === "PREPARING"
    ? "Preparing ticket sales"
    : publicationState === "FAILED" || publicationState === "REQUIRES_ATTENTION"
      ? "Review and retry ticket sales"
      : setup.nextStep === "complete"
    ? "Ready for passengers"
    : STEP_LABELS[setup.nextStep];
  const setupSummary: Array<{
    key: FleetOperationsStepKey;
    label: string;
    value: string;
    complete: boolean;
  }> = [
    {
      key: "routeAssigned",
      label: "Route",
      value: assignedRouteText || "Not assigned",
      complete: Boolean(setup.steps.routeAssigned),
    },
    {
      key: "routeConfigured",
      label: "Stops & timings",
      value: setup.steps.routeConfigured ? "Saved" : "Not set",
      complete: Boolean(setup.steps.routeConfigured),
    },
    {
      key: "driverAssigned",
      label: "Driver",
      value: driverName || "Not selected",
      complete: Boolean(setup.steps.driverAssigned),
    },
    {
      key: "conductorAssigned",
      label: "Conductor",
      value: conductorName || "Not selected",
      complete: Boolean(setup.steps.conductorAssigned),
    },
    {
      key: "scheduleCreated",
      label: "Trip schedule",
      value: scheduleSummary(setup.outboundScheduleData)
        || (setup.steps.scheduleCreated ? "Created" : "Not created"),
      complete: Boolean(setup.steps.scheduleCreated),
    },
    {
      key: "activated",
      label: "Ticket sales",
      value: isTakingBookings
        ? "Open for booking"
        : publicationState === "PREPARING"
          ? "Preparing — not live yet"
          : publicationState === "FAILED"
            ? "Attempt failed — safe to retry"
            : publicationState === "REQUIRES_ATTENTION"
              ? "Needs review — not live"
              : "Not live yet",
      complete: isTakingBookings,
    },
  ];
  const assignmentBrands = crewBrands.length > 0 ? crewBrands : setup.brandId ? [{
    id: setup.brandId,
    brandName: "Current vehicle brand",
    isDefault: true,
    status: "ACTIVE" as const,
  }] : [];
  const continuationKey = `shuvmarg:operations-next:${fleet.fleetId}`;

  useEffect(() => {
    let active = true;
    listMyBrands().then(brands => { if (active) setCrewBrands(brands); }).catch(() => {});
    fetchCopyablePeers(fleet.fleetId).then(peers => { if (active) setCopyablePeers(peers); }).catch(() => {});
    if (typeof window !== "undefined") {
      const stored = window.sessionStorage.getItem("shuvmarg:copy-notice");
      if (stored) {
        window.sessionStorage.removeItem("shuvmarg:copy-notice");
        window.requestAnimationFrame(() => {
          if (active) setCopyNotice(stored);
        });
      }
    }
    return () => { active = false; };
  }, [fleet.fleetId]);

  useEffect(() => {
    const next = window.sessionStorage.getItem(continuationKey) as FleetOperationsStepKey | null;
    if (!next) return;
    window.sessionStorage.removeItem(continuationKey);
    const frame = window.requestAnimationFrame(() => {
      if (next === "driverAssigned" && setup.steps.routeConfigured && !setup.steps.driverAssigned) {
        setCrewModalRole("driver");
        return;
      }
      if (next === "conductorAssigned" && setup.steps.driverAssigned && !setup.steps.conductorAssigned) {
        setCrewModalRole("conductor");
        return;
      }
      if (next === "scheduleCreated" && setup.steps.driverAssigned && setup.steps.conductorAssigned && !setup.steps.scheduleCreated) {
        setScheduleOpen(true);
        return;
      }
      if (next === "activated" && setup.steps.scheduleCreated && !setup.steps.activated) {
        setPublishOpen(true);
        return;
      }
      setHighlightedStep(next);
      document.getElementById(`setup-step-${next}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [
    continuationKey,
    setup.steps.activated,
    setup.steps.conductorAssigned,
    setup.steps.driverAssigned,
    setup.steps.routeConfigured,
    setup.steps.scheduleCreated,
  ]);

  return (
    <div className="p-5 sm:p-7">
      <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
        <section className="self-start rounded-2xl border border-[#E8E1DB] bg-white p-5 shadow-2xs">
          {onBackToBuses && (
            <button
              type="button"
              onClick={onBackToBuses}
              className="mb-4 inline-flex items-center gap-1.5 rounded-xl border border-[#DCD4CD] bg-white px-3 py-2 text-[10px] font-bold text-[#655E58] transition hover:bg-[#FAF8F5]"
            >
              <ArrowLeft className="size-3.5" />
              Back to buses
            </button>
          )}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A1D1B]">
                {eyebrow}
              </p>
              <h3 className="mt-2 text-xl font-black text-[#211D1A]">
                {displayBusName}
              </h3>
              <p className="mt-1 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[#817A74]">
                {displayBusNumber}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700">
                <BadgeCheck className="size-3.5" />
                Approved
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black ${
                isTakingBookings
                  ? "bg-[#F5E8E6] text-[#7A1D1B]"
                  : "bg-[#FAF4F1] text-[#7A1D1B]"
              }`}>
                {isTakingBookings ? <Radio className="size-3.5" /> : <CircleDashed className="size-3.5" />}
                {isTakingBookings ? "Taking bookings" : `${completedSteps} of ${totalSteps} ready`}
              </span>
            </div>
          </div>

          <div className="mt-5 border-t border-[#EEE8E2] pt-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#655E58]">
                Setup progress
              </p>
              <span className="font-mono text-[10px] font-bold text-[#7A1D1B]">
                {progressPercentage}%
              </span>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EEE8E2]"
              role="progressbar"
              aria-label="Vehicle setup progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercentage}
            >
              <div
                className="h-full rounded-full bg-[#7A1D1B] transition-[width] duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-[#EEE8E2] bg-[#FFFCFA]">
            {setupSummary.map((item, index) => {
              const Icon = STEP_ICONS[item.key];
              return (
                <div
                  key={item.key}
                  className={`flex items-center gap-3 px-3.5 py-3 ${
                    index > 0 ? "border-t border-[#EEE8E2]" : ""
                  }`}
                >
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                    item.complete
                      ? "bg-[#F5E8E6] text-[#7A1D1B]"
                      : "bg-[#F2EEEA] text-[#9B948E]"
                  }`}>
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#918A84]">
                      {item.label}
                    </p>
                    <p className={`mt-0.5 truncate text-xs font-bold ${
                      item.complete ? "text-[#342E2A]" : "text-[#8B847E]"
                    }`} title={item.value}>
                      {item.value}
                    </p>
                  </div>
                  <span className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
                    item.complete
                      ? "bg-[#7A1D1B] text-white"
                      : "border border-[#D8D0C9] text-transparent"
                  }`} aria-label={item.complete ? "Complete" : "Incomplete"}>
                    <Check className="size-3" />
                  </span>
                </div>
              );
            })}
          </div>

          <div className={`mt-4 rounded-xl border px-4 py-3 ${
            isTakingBookings
              ? "border-[#D7C1BC] bg-[#F9EFED]"
              : "border-[#E4C7C2] bg-[#FFF7F5]"
          }`}>
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#7A1D1B]">
              {isTakingBookings ? "Status" : "Next action"}
            </p>
            <p className="mt-1 text-xs font-black text-[#342E2A]">{nextAction}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-[#E8E1DB] bg-[#FFFCFA] p-5 shadow-2xs">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#817A74]">
              Get bus ready
            </p>
            <h3 className="mt-1 text-lg font-black text-[#211D1A]">
              Before passengers can book
            </h3>
            <p className="mt-1 text-xs text-[#746E69]">
              Select an available card to continue or review completed work.
            </p>
          </div>

          {copyNotice && (
            <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
              <Check className="size-4 shrink-0 text-emerald-600" />
              <span>{copyNotice}</span>
            </div>
          )}

          <div className="mt-5 space-y-2.5">
            {setup.stepDetails.map((step, index) => {
              const rowState = getRowState(step.complete, index, firstIncompleteIndex);
              const Icon = rowState === "complete"
                ? Check
                : rowState === "waiting"
                  ? LockKeyhole
                  : STEP_ICONS[step.key];
              const opensRouteSetup = step.key === "routeConfigured" && canReviewRouteSetup && rowState !== "waiting";
              const opensApprovedBus = step.key === "routeAssigned" && step.complete;
              const crewRole: StaffRole | null = step.key === "driverAssigned"
                ? "driver"
                : step.key === "conductorAssigned" ? "conductor" : null;
              const opensCrew = Boolean(crewRole && rowState !== "waiting" && setup.brandId);
              const opensSchedule = step.key === "scheduleCreated"
                && rowState !== "waiting" && !setup.steps.activated && Boolean(setup.brandId);
              const opensPublish = step.key === "activated" && rowState === "next" && Boolean(setup.scheduleId);
              const interactive = opensRouteSetup || opensApprovedBus || opensCrew || opensSchedule || opensPublish;
              const crewName = step.key === "driverAssigned"
                ? assignedName(setup.assignedDriver)
                : step.key === "conductorAssigned" ? assignedName(setup.assignedConductor) : null;
              const stepDetail = step.key === "activated" && publicationState !== "DRAFT"
                ? publicationState === "PREPARING"
                  ? "Trips are being prepared — bookings are still closed"
                  : publicationState === "FAILED"
                    ? "The saved publication can be retried safely"
                    : publicationState === "REQUIRES_ATTENTION"
                      ? "Review the saved seats and fares before retrying"
                      : "Passengers can book this bus"
                : getStepDetail(step.key, rowState, assignedRouteText, crewName);
              const cardClassName = `group flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
                rowState === "complete"
                  ? "border-[#E8E0D8] bg-white"
                  : rowState === "next"
                    ? "border-[#C98E87] bg-[#FFF8F6] shadow-[0_8px_24px_rgba(122,29,27,0.08)]"
                    : "border-[#EEE8E2] bg-white/60"
              } ${highlightedStep === step.key ? "ring-2 ring-[#7A1D1B] ring-offset-2" : ""} ${interactive ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1D1B] focus-visible:ring-offset-2" : "cursor-default"}`;
              const cardContents = (
                <>
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                      rowState === "complete"
                        ? "bg-[#F3E7E3] text-[#7A1D1B]"
                        : rowState === "next"
                          ? "bg-[#7A1D1B] text-white"
                          : "bg-[#EEE8E2] text-[#817A74]"
                    }`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-[#211D1A]">
                        {STEP_LABELS[step.key]}
                      </span>
                      {rowState === "next" && (
                        <span className="rounded-full bg-[#7A1D1B] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-white">
                          Do this next
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[10px] font-bold text-[#817A74]">
                      {stepDetail}
                    </div>
                  </div>
                  {interactive && (
                    <ArrowRight className="size-4 shrink-0 text-[#7A1D1B] transition group-hover:translate-x-0.5" />
                  )}
                </>
              );
              if (opensApprovedBus) {
                return (
                  <Link
                    key={step.key}
                    id={`setup-step-${step.key}`}
                    href={`/dashboard/fleet?vehicle=${encodeURIComponent(fleet.fleetId)}#fleet-${fleet.fleetId}`}
                    className={cardClassName}
                    aria-label="Review approved bus and route"
                  >
                    {cardContents}
                  </Link>
                );
              }
              if (opensRouteSetup) {
                return (
                  <button
                    key={step.key}
                    id={`setup-step-${step.key}`}
                    type="button"
                    onClick={() => setRouteSetupOpen(true)}
                    className={cardClassName}
                    aria-label={step.complete ? "Review stops and timings" : "Choose stops and timings"}
                  >
                    {cardContents}
                  </button>
                );
              }
              if (opensCrew && crewRole) {
                return (
                  <button
                    key={step.key}
                    id={`setup-step-${step.key}`}
                    type="button"
                    onClick={() => { setCrewNotice(null); setCrewModalRole(crewRole); }}
                    className={cardClassName}
                    aria-label={`${step.complete ? "Change" : "Choose"} current ${crewRole}`}
                  >
                    {cardContents}
                  </button>
                );
              }
              if (opensSchedule) {
                return (
                  <button key={step.key} id={`setup-step-${step.key}`} type="button" onClick={() => setScheduleOpen(true)} className={cardClassName} aria-label="Choose when this bus will run">
                    {cardContents}
                  </button>
                );
              }
              if (opensPublish) {
                return (
                  <button key={step.key} id={`setup-step-${step.key}`} type="button" onClick={() => setPublishOpen(true)} className={cardClassName} aria-label="Review setup and start selling tickets">
                    {cardContents}
                  </button>
                );
              }
              return <div key={step.key} id={`setup-step-${step.key}`} className={cardClassName}>{cardContents}</div>;
            })}
          </div>
        </section>
      </div>
      {routeSetupOpen && (
        <RouteServiceSetupModal
          fleet={fleet}
          setup={setup}
          copyablePeers={copyablePeers}
          onClose={() => {
            setRouteSetupOpen(false);
            void refreshSetup();
          }}
          onSaved={async () => {
            const fresh = await refreshSetup();
            setRouteSetupOpen(false);
            if (!fresh?.steps?.driverAssigned) {
              setCrewModalRole("driver");
            } else if (!fresh?.steps?.conductorAssigned) {
              setCrewModalRole("conductor");
            } else if (!fresh?.steps?.scheduleCreated) {
              setScheduleOpen(true);
            } else {
              fallbackReload();
            }
          }}
        />
      )}
      {crewModalRole && setup.brandId && (
        <VehicleCrewAssignmentModal
          fleetId={fleet.fleetId}
          busName={displayBusName || "Approved vehicle"}
          busNumber={displayBusNumber || ""}
          role={crewModalRole}
          advanceToConductor={crewModalRole === "driver"}
          notice={crewNotice}
          onAddCrew={(role) => {
            setCrewCreateRole(role);
            setCrewModalRole(null);
          }}
          onClose={() => {
            setCrewModalRole(null);
            void refreshSetup();
          }}
          onSaved={() => {
            void refreshSetup();
          }}
          onAdvanceToNext={async (fromRole) => {
            const fresh = await refreshSetup();
            if (fromRole === "driver") {
              setCrewModalRole("conductor");
            } else if (fromRole === "conductor") {
              setCrewModalRole(null);
              if (!fresh?.steps?.scheduleCreated) {
                setScheduleOpen(true);
              } else if (!fresh?.steps?.activated) {
                setPublishOpen(true);
              }
            }
          }}
        />
      )}
      {crewCreateRole && (
        <CrewAssignmentDialog
          brands={assignmentBrands}
          initialRole={crewCreateRole}
          initialMode="new"
          initialBrandId={setup.brandId || undefined}
          onClose={() => {
            const role = crewCreateRole;
            setCrewCreateRole(null);
            setCrewModalRole(role);
          }}
          onSaved={(message, warning) => {
            const role = crewCreateRole;
            setCrewCreateRole(null);
            setCrewNotice({ message, warning });
            setCrewModalRole(role);
            void refreshSetup();
          }}
        />
      )}
      {scheduleOpen && (
        <TripScheduleModal
          fleetId={fleet.fleetId}
          busName={displayBusName || "Approved vehicle"}
          busNumber={displayBusNumber || ""}
          setup={setup}
          onClose={() => {
            setScheduleOpen(false);
            void refreshSetup();
          }}
          onSaved={async () => {
            const fresh = await refreshSetup();
            setScheduleOpen(false);
            if (!fresh?.steps?.activated) {
              setPublishOpen(true);
            } else {
              fallbackReload();
            }
          }}
        />
      )}
      {publishOpen && (
        <StartSellingTicketsModal
          fleetId={fleet.fleetId}
          busName={displayBusName || "Approved vehicle"}
          busNumber={displayBusNumber || ""}
          setup={setup}
          onClose={() => {
            setPublishOpen(false);
            void refreshSetup();
          }}
          onPublished={async () => {
            await refreshSetup();
            setPublishOpen(false);
          }}
        />
      )}
      {copyModalOpen && (
        <CopyFleetConfigurationModal
          targetFleetId={fleet.fleetId}
          targetBusName={displayBusName || "Approved vehicle"}
          targetBusNumber={displayBusNumber || ""}
          initialPeers={copyablePeers}
          onClose={() => setCopyModalOpen(false)}
          onCopied={(msg) => {
            setCopyModalOpen(false);
            if (typeof window !== "undefined") {
              window.sessionStorage.setItem("shuvmarg:copy-notice", msg || "Fleet configuration successfully copied.");
            }
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

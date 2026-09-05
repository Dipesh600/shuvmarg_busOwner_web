"use client";

import { useState } from "react";
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
} from "lucide-react";
import type {
  FleetOperationsStepKey,
  OperatorFleetListItem,
  OperatorFleetSetupStatus,
} from "@/features/operator-dashboard/operator-dashboard-contract";
import { getFleetRouteText } from "@/features/operator-dashboard/fleet-lifecycle-story";
import RouteServiceSetupModal from "./RouteServiceSetupModal";

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
  scheduleCreated: CalendarDays,
  activated: Radio,
};

const STEP_LABELS: Record<FleetOperationsStepKey, string> = {
  routeAssigned: "Route approved",
  routeConfigured: "Stops & timings",
  driverAssigned: "Driver",
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
): string {
  if (stepKey === "routeAssigned") {
    if (assignedRouteText) return assignedRouteText;
    if (rowState === "complete") return "Route approved";
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
      complete: "Driver assigned to this bus",
      next: "Choose the driver for this bus",
      waiting: "Available after stops and timings",
    },
    scheduleCreated: {
      complete: "Trip schedule created",
      next: "Choose when this bus will run",
      waiting: "Available after a driver is assigned",
    },
    activated: {
      complete: "Passengers can book this bus",
      next: "Publish this bus for passengers",
      waiting: "Available after the trip schedule",
    },
  };
  return copy[stepKey][rowState];
}

export default function FirstFleetOperationsSetup({
  fleet,
  setup,
  eyebrow = "First approved bus",
  onBackToBuses,
}: FirstFleetOperationsSetupProps) {
  const [routeSetupOpen, setRouteSetupOpen] = useState(false);
  const firstIncompleteIndex = setup.stepDetails.findIndex((step) => !step.complete);
  const displayBusName = setup.busName || fleet.busName;
  const displayBusNumber = setup.busNumber || fleet.busNumber;
  const assignedRouteText = getFleetRouteText(setup.assignedRoute);
  const canReviewRouteSetup = Boolean(
    setup.steps.routeAssigned || setup.assignedRoute || assignedRouteText,
  );

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
              {assignedRouteText && (
                <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-xl border border-[#E8E1DB] bg-[#FAF8F5] px-3 py-2 text-xs font-bold text-[#655E58]">
                  <Route className="size-3.5 shrink-0 text-[#7A1D1B]" />
                  <span className="truncate">{assignedRouteText}</span>
                  {setup.assignedRoute?.code && (
                    <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-[#817A74]">
                      {setup.assignedRoute.code}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700">
                <BadgeCheck className="size-3.5" />
                Approved
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1EE] px-3 py-1.5 text-[10px] font-black text-[#7A1D1B]">
                <CircleDashed className="size-3.5" />
                Not taking bookings yet
              </span>
            </div>
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
              const interactive = opensRouteSetup || opensApprovedBus;
              const cardClassName = `group flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
                rowState === "complete"
                  ? "border-emerald-200 bg-white"
                  : rowState === "next"
                    ? "border-[#C98E87] bg-[#FFF8F6] shadow-[0_8px_24px_rgba(122,29,27,0.08)]"
                    : "border-[#EEE8E2] bg-white/60"
              } ${interactive ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1D1B] focus-visible:ring-offset-2" : "cursor-default"}`;
              const cardContents = (
                <>
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                      rowState === "complete"
                        ? "bg-emerald-600 text-white"
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
                      {getStepDetail(step.key, rowState, assignedRouteText)}
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
                    type="button"
                    onClick={() => setRouteSetupOpen(true)}
                    className={cardClassName}
                    aria-label={step.complete ? "Review stops and timings" : "Choose stops and timings"}
                  >
                    {cardContents}
                  </button>
                );
              }
              return <div key={step.key} className={cardClassName}>{cardContents}</div>;
            })}
          </div>
        </section>
      </div>
      {routeSetupOpen && (
        <RouteServiceSetupModal
          fleet={fleet}
          setup={setup}
          onClose={() => setRouteSetupOpen(false)}
          onSaved={() => {
            setRouteSetupOpen(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

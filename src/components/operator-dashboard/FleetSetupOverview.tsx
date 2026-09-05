"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BusFront, Plus, Route, Trash2 } from "lucide-react";
import type {
  OperatorFleetListItem,
  OperatorFleetSetupStatus,
} from "@/features/operator-dashboard/operator-dashboard-contract";
import { buildFleetLifecycleStory, type FleetLifecycleTone } from "@/features/operator-dashboard/fleet-lifecycle-story";
import {
  deleteFleetRegistrationDraft,
  listFleetDrafts,
  setActiveDraftId,
  subscribeToFleetDraftChanges,
  type DraftMetadata,
} from "@/features/fleet-registration/fleet-registration-draft-storage";

export default function FleetSetupOverview({
  fleets,
  onAddVehicle,
  setupStatusesByFleetId = {},
  onOpenOperations,
}: {
  fleets: OperatorFleetListItem[];
  onAddVehicle: (draftId?: string) => void;
  setupStatusesByFleetId?: Record<string, OperatorFleetSetupStatus>;
  onOpenOperations?: (fleetId: string) => void;
}) {
  const [drafts, setDrafts] = useState<DraftMetadata[]>(() => listFleetDrafts());

  useEffect(() => {
    const onStorage = () => setDrafts(listFleetDrafts());
    return subscribeToFleetDraftChanges(onStorage);
  }, []);

  const serverFleetIds = new Set(fleets.map((fleet) => fleet.fleetId));
  const serverFleetNumbers = new Set(
    fleets
      .map((fleet) => fleet.busNumber?.trim().toUpperCase())
      .filter((num) => Boolean(num))
  );

  const visibleDrafts = drafts.filter(
    (draft) =>
      !(draft.serverFleetId && serverFleetIds.has(draft.serverFleetId)) &&
      !(draft.busNumber && serverFleetNumbers.has(draft.busNumber.trim().toUpperCase()))
  );
  const totalItems = visibleDrafts.length + fleets.length;
  const badgeClasses: Record<FleetLifecycleTone, string> = {
    neutral: "bg-[#FAF8F5] text-[#655E58]",
    warning: "bg-amber-50 text-amber-800",
    danger: "bg-red-50 text-red-700",
    success: "bg-emerald-50 text-emerald-700",
  };

  return (
    <div className="p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#817A74]">
            Your buses
          </p>
          <h3 className="mt-1 text-lg font-bold text-[#211D1A]">
            {totalItems
              ? `${totalItems} bus${totalItems === 1 ? "" : "es"}${visibleDrafts.length ? ` (${visibleDrafts.length} unfinished)` : ""}`
              : "No buses yet"}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {visibleDrafts.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setActiveDraftId(null);
                onAddVehicle();
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#DCD4CD] bg-white px-3.5 text-xs font-bold text-[#655E58] hover:border-[#7A1D1B] hover:text-[#7A1D1B] transition shadow-2xs"
            >
              <Plus className="size-3.5" />
              New bus
            </button>
          )}

          <button
            type="button"
            onClick={() => onAddVehicle()}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#7A1D1B] px-4 text-xs font-bold text-white shadow-2xs hover:bg-[#641715] transition"
          >
            <Plus className="size-4" />
            {visibleDrafts.length > 0 ? "Continue setup" : "Add bus"}
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {/* Unfinished Local Drafts */}
        {visibleDrafts.map((draft) => (
          <article
            key={draft.id}
            className="flex flex-col gap-3 rounded-2xl border border-[#F0CACA] bg-[#FFF8F7] p-4 sm:flex-row sm:items-center sm:justify-between shadow-2xs"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#7A1D1B] border border-[#F8C9C7]">
                <BusFront className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-[#FDE7E6] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#7A1D1B]">
                    Unfinished bus
                  </span>
                  <h4 className="truncate text-sm font-black text-[#191512]">{draft.name}</h4>
                </div>
                <p className="mt-0.5 text-xs text-[#746E69]">
                  Saved locally · {draft.totalPlaces ? `${draft.totalPlaces} seats` : "In progress"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm(`Are you sure you want to discard "${draft.name}"?`)) {
                    await deleteFleetRegistrationDraft(draft.id);
                    setDrafts(listFleetDrafts());
                  }
                }}
                title="Discard this unfinished draft"
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-transparent px-2.5 text-xs font-bold text-[#938A82] hover:bg-red-50 hover:text-red-700 transition"
              >
                <Trash2 className="size-3.5" />
                <span className="hidden sm:inline">Discard</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveDraftId(draft.id);
                  onAddVehicle(draft.id);
                }}
                className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#7A1D1B] px-3.5 text-xs font-bold text-white shadow-2xs hover:bg-[#641715] transition"
              >
                Continue
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </article>
        ))}

        {/* Server-saved buses */}
        {fleets.map((fleet) => {
          const story = buildFleetLifecycleStory(
            fleet,
            setupStatusesByFleetId[fleet.fleetId] || null,
            { businessApproved: true },
          );
          return (
            <article
              key={fleet.fleetId}
              className="flex flex-col gap-3 rounded-2xl border border-[#E8E1DB] bg-white p-4 sm:flex-row sm:items-center sm:justify-between shadow-2xs"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FAF8F5] text-[#746E69] border border-[#E8E1DB]">
                  <BusFront className="size-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-bold text-[#211D1A]">{fleet.busName}</h4>
                  <p className="mt-0.5 font-mono text-[10px] font-bold text-[#817A74]">
                    {fleet.busNumber}
                  </p>
                  <p className={`mt-1 text-[10px] font-bold ${
                    story.badgeTone === "danger"
                      ? "text-red-700"
                      : story.badgeTone === "warning"
                        ? "text-amber-700"
                        : story.preparedByShuvmarg || story.needsOperationsSetup
                          ? "text-[#7A1D1B]"
                          : "text-[#817A74]"
                  }`}>
                    {story.description}
                  </p>
                  {(story.routeText || story.nextStepLabel || story.progressPercentage !== null) && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold text-[#746E69]">
                      {story.routeText && (
                        <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[#EEE8E2] bg-[#FAF8F5] px-2 py-1">
                          <Route className="size-3 text-[#7A1D1B]" />
                          <span className="truncate">{story.routeText}</span>
                          {story.routeCode && (
                            <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-[#938A82]">
                              {story.routeCode}
                            </span>
                          )}
                        </span>
                      )}
                      {story.nextStepLabel && (
                        <span>{story.isOperational ? "Status" : "Do next"}: {story.nextStepLabel}</span>
                      )}
                      {story.progressText && (
                        <span>{story.progressText}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`w-fit rounded-full px-3 py-1 text-[10px] font-bold ${badgeClasses[story.badgeTone]}`}>
                  {story.label}
                </span>
                {story.needsOperationsSetup && onOpenOperations ? (
                  <button
                    type="button"
                    onClick={() => onOpenOperations(fleet.fleetId)}
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-xl border border-[#DCCFC8] px-3 text-xs font-bold text-[#7A1D1B] hover:bg-[#FFF7F4] transition"
                  >
                    {story.primaryActionLabel || "Continue setup"}
                    <ArrowRight className="size-3.5" />
                  </button>
                ) : (
                  <Link
                    href={`/dashboard/fleet?vehicle=${fleet.fleetId}#fleet-${fleet.fleetId}`}
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-xl border border-[#DCCFC8] px-3 text-xs font-bold text-[#7A1D1B] hover:bg-[#FFF7F4] transition"
                  >
                    Open
                    <ArrowRight className="size-3.5" />
                  </Link>
                )}
              </div>
            </article>
          );
        })}

        {/* Completely Empty State */}
        {visibleDrafts.length === 0 && fleets.length === 0 && (
          <button
            type="button"
            onClick={() => onAddVehicle()}
            className="flex w-full items-center justify-between rounded-2xl border border-dashed border-[#DCCFC8] bg-[#FFFCFA] p-5 text-left hover:border-[#7A1D1B] transition"
          >
            <span>
              <strong className="block text-sm text-[#211D1A]">Add your first bus</strong>
              <span className="mt-1 block text-xs text-[#746E69]">
                You can add more buses anytime.
              </span>
            </span>
            <ArrowRight className="size-4 text-[#7A1D1B]" />
          </button>
        )}
      </div>
    </div>
  );
}

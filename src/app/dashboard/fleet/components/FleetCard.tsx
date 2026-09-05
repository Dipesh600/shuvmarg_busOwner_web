import React from "react";
import { ArrowRight, BusFront, Eye, Route } from "lucide-react";
import type { FleetListItem } from "@/features/fleet-registration/api";
import type { OperatorFleetSetupStatus } from "@/features/operator-dashboard/operator-dashboard-contract";
import { buildFleetLifecycleStory, type FleetLifecycleTone } from "@/features/operator-dashboard/fleet-lifecycle-story";

interface FleetCardProps {
  fleet: FleetListItem;
  businessApproved: boolean;
  localDraftId: string | null;
  setupStatus?: OperatorFleetSetupStatus | null;
  onOpenFleet: (draftId: string, readOnly: boolean) => void;
  onPreviewFleet: (fleetId: string) => void;
  onOpenServerDraft: (fleetId: string) => void;
  onCorrectRejectedFleet: (fleetId: string) => void;
  onOpenOperations: (fleetId: string) => void;
}

const badgeClasses: Record<FleetLifecycleTone, string> = {
  neutral: "bg-[#FAF8F5] text-[#655E58]",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-red-50 text-red-700",
  success: "bg-emerald-50 text-emerald-700",
};

export function FleetCard({
  fleet,
  businessApproved,
  localDraftId,
  setupStatus,
  onOpenFleet,
  onPreviewFleet,
  onOpenServerDraft,
  onCorrectRejectedFleet,
  onOpenOperations,
}: FleetCardProps) {
  const story = buildFleetLifecycleStory(fleet, setupStatus, {
    businessApproved,
    localDraftId,
  });
  const status = story.status;
  const isDraft = status === "DRAFT";
  const preparedByShuvmarg = story.preparedByShuvmarg;

  return (
    <article
      id={`fleet-${fleet.fleetId}`}
      onClick={() => {
        if (status === "PENDING" || status === "APPROVED") {
          onPreviewFleet(fleet.fleetId);
        } else if (status === "REJECTED") {
          onPreviewFleet(fleet.fleetId);
        } else if (localDraftId) {
          onOpenFleet(localDraftId, false);
        } else if (isDraft) {
          onOpenServerDraft(fleet.fleetId);
        }
      }}
      className={`scroll-mt-6 rounded-3xl border border-[#E8E1DB] bg-white p-5 shadow-sm target:border-[#7A1D1B] target:ring-2 target:ring-[#7A1D1B]/10 cursor-pointer hover:border-[#7A1D1B] transition hover:shadow-md`}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#7A1D1B]">
          <BusFront className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-black text-[#191512]">
            {fleet.busName}
          </h2>
          <p className="mt-0.5 font-mono text-[10px] font-bold text-[#746E69]">
            {fleet.busNumber}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[9px] font-black ${badgeClasses[story.badgeTone]}`}>
          {story.label}
        </span>
      </div>
      <p className={`mt-3 rounded-xl px-3 py-2.5 text-[10px] font-bold ${
        story.badgeTone === "danger"
          ? "border border-red-100 bg-red-50 text-red-800"
          : story.badgeTone === "warning"
            ? "bg-amber-50 text-amber-800"
            : preparedByShuvmarg
              ? "bg-[#FFF7F4] text-[#7A1D1B]"
              : "bg-[#FAF8F5] text-[#746E69]"
      }`}>
        {story.description}
      </p>
      {(story.routeText || story.nextStepLabel || story.progressPercentage !== null) && (
        <div className="mt-3 rounded-2xl border border-[#EEE8E2] bg-[#FFFCFA] p-3">
          {story.routeText && (
            <div className="flex min-w-0 items-center gap-2 text-[10px] font-black text-[#655E58]">
              <Route className="size-3.5 shrink-0 text-[#7A1D1B]" />
              <span className="truncate">{story.routeText}</span>
              {story.routeCode && (
                <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-[#817A74]">
                  {story.routeCode}
                </span>
              )}
            </div>
          )}
          {story.nextStepLabel && (
            <div className={`${story.routeText ? "mt-2" : ""} flex items-center justify-between gap-3 text-[10px]`}>
              <span className="font-bold text-[#817A74]">
                {story.isOperational ? "Status" : "Do next"}
              </span>
              <span className="text-right font-black text-[#211D1A]">
                {story.nextStepLabel}
              </span>
            </div>
          )}
          {story.progressPercentage !== null && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[9px] font-bold text-[#817A74]">
                <span>{story.progressText || "Setup steps"}</span>
                <span>{story.progressPercentage}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#EEE8E2]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#7A1D1B,#D96861)]"
                  style={{ width: `${story.progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
      <div className="mt-4 flex justify-between border-t border-[#EEE8E2] pt-3 text-[10px] text-[#746E69]">
        <span>{fleet.busType}</span>
        <span className="font-bold">{fleet.totalSeats} places</span>
      </div>
      {status === "PENDING" ? (
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onPreviewFleet(fleet.fleetId);
            }}
            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#DCD4CD] text-xs font-black text-[#655E58]"
          >
            <Eye className="size-3.5" />
            Preview submission
          </button>
        </div>
      ) : status === "REJECTED" ? (
        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={(event) => { event.stopPropagation(); onPreviewFleet(fleet.fleetId); }} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#DCD4CD] text-xs font-black text-[#655E58]">
              <Eye className="size-3.5" />
              Preview
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onCorrectRejectedFleet(fleet.fleetId);
              }}
              className="flex h-10 items-center justify-center rounded-xl bg-[#7A1D1B] text-xs font-black text-white"
            >
              Correct
            </button>
          </div>
        </div>
      ) : status === "APPROVED" ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {!story.isOperational && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onPreviewFleet(fleet.fleetId);
              }}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#DCD4CD] text-xs font-black text-[#655E58]"
            >
              <Eye className="size-3.5" />
              Preview
            </button>
          )}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (story.needsOperationsSetup) onOpenOperations(fleet.fleetId);
              else onPreviewFleet(fleet.fleetId);
            }}
            className={`${story.isOperational ? "col-span-2" : ""} flex h-10 items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] text-xs font-black text-white`}
          >
            {story.primaryActionLabel}
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      ) : isDraft && businessApproved ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (localDraftId) onOpenFleet(localDraftId, false);
            else onOpenServerDraft(fleet.fleetId);
          }}
          className="mt-4 flex h-10 w-full items-center justify-center rounded-xl bg-[#7A1D1B] text-xs font-black text-white"
        >
          {story.primaryActionLabel}
        </button>
      ) : null}
    </article>
  );
}

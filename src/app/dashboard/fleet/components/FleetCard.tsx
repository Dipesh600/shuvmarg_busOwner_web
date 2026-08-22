import React from "react";
import { BusFront, Loader2 } from "lucide-react";
import type { FleetListItem } from "@/features/fleet-registration/api";

interface FleetCardProps {
  fleet: FleetListItem;
  businessApproved: boolean;
  localDraftId: string | null;
  submittingId: string | null;
  onOpenFleet: (draftId: string, readOnly: boolean) => void;
  onPreviewFleet: (fleetId: string) => void;
  onOpenServerDraft: (fleetId: string) => void;
  onSubmitPreparedFleet: (fleetId: string) => void;
  onCorrectRejectedFleet: (fleetId: string) => void;
}

export function FleetCard({
  fleet,
  businessApproved,
  localDraftId,
  submittingId,
  onOpenFleet,
  onPreviewFleet,
  onOpenServerDraft,
  onSubmitPreparedFleet,
  onCorrectRejectedFleet,
}: FleetCardProps) {
  const status = String(fleet.approvalStatus || "DRAFT").toUpperCase();
  const statusLabel =
    status === "APPROVED"
      ? fleet.setupComplete ? "Live" : "Approved"
      : status === "PENDING"
      ? "In review"
      : status === "REJECTED"
      ? "Needs changes"
      : "Draft";
  const isDraft = status === "DRAFT";
  const documentsReady = Boolean(
    fleet.documentSummary?.totalSlots &&
      fleet.documentSummary.present === fleet.documentSummary.totalSlots
  );

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
        <span className="rounded-full bg-[#FAF8F5] px-2.5 py-1 text-[9px] font-black text-[#655E58]">
          {statusLabel}
        </span>
      </div>
      <div className="mt-4 flex justify-between border-t border-[#EEE8E2] pt-3 text-[10px] text-[#746E69]">
        <span>{fleet.busType}</span>
        <span className="font-bold">{fleet.totalSeats} places</span>
      </div>
      {status === "PENDING" ? (
        <div className="mt-4 flex flex-col gap-2">
          <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-center text-[10px] font-bold text-amber-800">
            Submitted for review. Editing is locked until Shuvmarg requests
            changes.
          </p>
        </div>
      ) : status === "REJECTED" ? (
        <div className="mt-4 space-y-2">
          <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-[10px] font-bold text-red-800">
            {fleet.rejectionReason || "Shuvmarg requested corrections before this bus can be approved."}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={(event) => { event.stopPropagation(); onPreviewFleet(fleet.fleetId); }} className="flex h-10 items-center justify-center rounded-xl border border-[#DCD4CD] text-xs font-black text-[#655E58]">
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
        <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2.5 text-center text-[10px] font-bold text-emerald-800">
          {fleet.setupComplete
            ? "Live and operational. Open to review the submitted record."
            : "Approved. Shuvmarg is completing driver, schedule, and activation setup."}
        </p>
      ) : isDraft && businessApproved && documentsReady ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (localDraftId) onOpenFleet(localDraftId, false);
              else onOpenServerDraft(fleet.fleetId);
            }}
            className="flex h-10 items-center justify-center rounded-xl border border-[#DCD4CD] text-xs font-black text-[#655E58]"
          >
            Continue setup
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSubmitPreparedFleet(fleet.fleetId);
            }}
            disabled={submittingId === fleet.fleetId}
            className="flex h-10 items-center justify-center rounded-xl bg-[#7A1D1B] text-xs font-black text-white disabled:opacity-50"
          >
            {submittingId === fleet.fleetId ? (
              <>
                <Loader2 className="mr-2 size-3.5 animate-spin" />
                Submitting…
              </>
            ) : (
              "Submit for review"
            )}
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
          Continue setup
        </button>
      ) : isDraft && !businessApproved ? (
        <p className="mt-4 rounded-xl bg-[#FAF8F5] px-3 py-2.5 text-center text-[10px] font-bold text-[#746E69]">
          Saved. You can finish this bus while verification continues.
        </p>
      ) : null}
    </article>
  );
}

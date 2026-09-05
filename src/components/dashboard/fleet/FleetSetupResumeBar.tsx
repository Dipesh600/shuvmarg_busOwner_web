"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BusFront, FolderOpen, Plus, Trash2 } from "lucide-react";
import type { FleetListItem } from "@/features/fleet-registration/api";
import {
  deleteFleetRegistrationDraft,
  listFleetDrafts,
  subscribeToFleetDraftChanges,
  type DraftMetadata,
} from "@/features/fleet-registration/fleet-registration-draft-storage";

export default function FleetSetupResumeBar({
  fleets,
  businessApproved,
  hasLocalDraft,
  onAdd,
  onManageDrafts,
  onStartFresh,
}: {
  fleets: FleetListItem[];
  businessApproved: boolean;
  hasLocalDraft: boolean;
  onAdd: () => void;
  onManageDrafts?: () => void;
  onStartFresh?: () => void;
}) {
  const [drafts, setDrafts] = useState<DraftMetadata[]>(() => listFleetDrafts());
  const next = fleets.find((fleet) => String(fleet.approvalStatus).toUpperCase() === "DRAFT");
  const lockedFleetIds = new Set(
    fleets
      .filter((fleet) => {
        const status = String(fleet.approvalStatus || "").toUpperCase();
        return status === "PENDING" || status === "APPROVED";
      })
      .map((fleet) => fleet.fleetId)
  );
  const lockedFleetNumbers = new Set(
    fleets
      .filter((fleet) => {
        const status = String(fleet.approvalStatus || "").toUpperCase();
        return status === "PENDING" || status === "APPROVED";
      })
      .map((fleet) => fleet.busNumber?.trim().toUpperCase())
      .filter(Boolean)
  );
  const visibleDrafts = drafts.filter(
    (draft) => {
      if (draft.serverFleetId && lockedFleetIds.has(draft.serverFleetId)) return false;
      if (draft.busNumber && lockedFleetNumbers.has(draft.busNumber.trim().toUpperCase())) return false;
      return true;
    }
  );

  useEffect(() => {
    const onStorage = () => setDrafts(listFleetDrafts());
    return subscribeToFleetDraftChanges(onStorage);
  }, []);

  const activeDraft = visibleDrafts[0] || null;

  if (hasLocalDraft && visibleDrafts.length > 0) {
    if (visibleDrafts.length === 1 && activeDraft) {
      return (
        <section className="flex flex-col gap-3 rounded-2xl border border-[#F0CACA] bg-[#FFF8F7] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#7A1D1B] border border-[#F8C9C7]">
              <BusFront className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-[#FDE7E6] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#7A1D1B]">
                  Unfinished bus
                </span>
                <p className="truncate text-sm font-black text-[#191512]">{activeDraft.name}</p>
              </div>
              <p className="mt-0.5 text-xs text-[#746E69]">
                Saved locally · {activeDraft.totalPlaces ? `${activeDraft.totalPlaces} seats` : "In progress"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                if (window.confirm("Are you sure you want to discard this unfinished bus draft?")) {
                  await deleteFleetRegistrationDraft(activeDraft.id);
                  setDrafts(listFleetDrafts());
                }
              }}
              title="Discard unfinished bus"
              className="inline-flex h-9 items-center gap-1 rounded-xl border border-transparent px-2.5 text-xs font-bold text-[#938A82] hover:bg-red-50 hover:text-red-700 transition"
            >
              <Trash2 className="size-3.5" />
              Discard
            </button>

            {onStartFresh && (
              <button
                type="button"
                onClick={onStartFresh}
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-[#DCD4CD] bg-white px-3 text-xs font-bold text-[#655E58] hover:border-[#7A1D1B] hover:text-[#7A1D1B] transition"
              >
                <Plus className="size-3.5" />
                Start another bus
              </button>
            )}

            <button
              type="button"
              onClick={onAdd}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#7A1D1B] px-4 text-xs font-bold text-white shadow-2xs transition hover:bg-[#641715]"
            >
              Continue setup
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </section>
      );
    }

    // Multiple drafts in progress
    return (
      <section className="flex flex-col gap-3 rounded-2xl border border-[#F0CACA] bg-[#FFF8F7] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#7A1D1B] border border-[#F8C9C7]">
            <FolderOpen className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-[#FDE7E6] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#7A1D1B]">
                In Progress
              </span>
              <p className="text-sm font-black text-[#191512]">
                {visibleDrafts.length} unfinished buses
              </p>
            </div>
            <p className="mt-0.5 text-xs text-[#746E69]">
              Continue an unfinished bus or add another one.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onStartFresh && (
            <button
              type="button"
              onClick={onStartFresh}
              className="inline-flex h-9 items-center gap-1 rounded-xl border border-[#DCD4CD] bg-white px-3 text-xs font-bold text-[#655E58] hover:border-[#7A1D1B] hover:text-[#7A1D1B] transition"
            >
              <Plus className="size-3.5" />
              New bus
            </button>
          )}

          <button
            type="button"
            onClick={onManageDrafts || onAdd}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#7A1D1B] px-4 text-xs font-bold text-white shadow-2xs transition hover:bg-[#641715]"
          >
            Manage drafts ({visibleDrafts.length})
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </section>
    );
  }

  if (!next) return null;
  const documents = next.documentSummary?.present || 0;

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-[#E8E1DB] bg-[#FAF8F5] px-4 py-3.5 sm:flex-row sm:items-center shadow-2xs">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#7A1D1B] border border-[#F8C9C7]">
        <BusFront className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-[#EDE5D8] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#655E58]">
            {businessApproved ? "Ready for review" : "Prepared on server"}
          </span>
          <p className="truncate text-sm font-bold text-[#191512]">
            {next.busName} · {next.busNumber}
          </p>
        </div>
        <p className="mt-0.5 text-xs text-[#746E69]">
          {businessApproved
            ? "Business verified · ready to submit for review"
            : `Saved on server${documents ? ` · ${documents} documents attached` : ""} · waiting for business approval`}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#DCD4CD] bg-white px-3 text-xs font-bold text-[#655E58] hover:border-[#7A1D1B] hover:text-[#7A1D1B] transition"
        >
          <Plus className="size-3" />
          Add another bus
        </button>
        <a
          href={`#fleet-${next.fleetId}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#191512] px-4 text-xs font-bold text-white shadow-2xs transition hover:bg-black"
        >
          View bus
          <ArrowRight className="size-3" />
        </a>
      </div>
    </section>
  );
}

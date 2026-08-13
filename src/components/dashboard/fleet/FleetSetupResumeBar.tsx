"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BusFront, FolderOpen, Plus, Trash2 } from "lucide-react";
import type { FleetListItem } from "@/features/fleet-registration/api";
import {
  deleteFleetRegistrationDraft,
  listFleetDrafts,
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

  useEffect(() => {
    const onStorage = () => setDrafts(listFleetDrafts());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const activeDraft = drafts[0] || null;

  if (hasLocalDraft && drafts.length > 0) {
    if (drafts.length === 1 && activeDraft) {
      return (
        <section className="flex flex-col gap-3 rounded-2xl border border-[#F0CACA] bg-[#FFF8F7] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#7A1D1B] border border-[#F8C9C7]">
              <BusFront className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-[#FDE7E6] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#7A1D1B]">
                  Unfinished Setup
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
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("storage"));
                  }
                }
              }}
              title="Discard unfinished local setup"
              className="inline-flex h-9 items-center gap-1 rounded-xl border border-transparent px-2.5 text-xs font-bold text-[#938A82] hover:bg-red-50 hover:text-red-700 transition"
            >
              <Trash2 className="size-3.5" />
              Discard setup
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
                {drafts.length} Bus Setups In Progress
              </p>
            </div>
            <p className="mt-0.5 text-xs text-[#746E69]">
              Continue previous bus or start registering another vehicle.
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
            Manage drafts ({drafts.length})
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
          View vehicle
          <ArrowRight className="size-3" />
        </a>
      </div>
    </section>
  );
}

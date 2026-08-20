"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, Plus } from "lucide-react";
import { VerificationStatus } from "@/features/operator-dashboard/operator-dashboard-contract";
import FleetRegistrationFlow from "@/features/fleet-registration/FleetRegistrationFlow";
import {
  deleteFleetRegistrationDraft,
  listFleetDrafts,
  setActiveDraftId,
  subscribeToFleetDraftChanges,
  type DraftMetadata,
} from "@/features/fleet-registration/fleet-registration-draft-storage";

interface FleetEmptyStateProps {
  verificationStatus: VerificationStatus;
}

export default function FleetEmptyState({
  verificationStatus,
}: FleetEmptyStateProps) {
  const isApproved = verificationStatus === "approved";
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [drafts, setDrafts] = useState<DraftMetadata[]>(() => listFleetDrafts());

  useEffect(() => {
    const onStorage = () => setDrafts(listFleetDrafts());
    return subscribeToFleetDraftChanges(onStorage);
  }, []);

  const activeDraft = drafts[0] || null;

  return (
    <div className="bg-white rounded-3xl border border-[#EEE8E2] p-6 sm:p-7 shadow-2xs space-y-4 flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-[#746E69] uppercase tracking-wider mb-1">
              Fleet Readiness
            </div>
            <h3
              className="text-lg font-bold text-[#161311]"
              style={{ fontFamily: '"Neue Machina", system-ui, sans-serif' }}
            >
              Vehicle Inventory
            </h3>
          </div>
          <Image
            src="/operator-dashboard/illustrations/empty-fleet.svg"
            alt="Empty Fleet"
            width={48}
            height={48}
            className="flex-shrink-0"
          />
        </div>

        {activeDraft ? (
          <div className="bg-[#FFF8F7] rounded-2xl p-4 border border-[#F0CACA] space-y-2">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-[#FDE7E6] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#7A1D1B]">
                Unfinished setup
              </span>
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm(`Discard "${activeDraft.name}"?`)) {
                    await deleteFleetRegistrationDraft(activeDraft.id);
                    setDrafts(listFleetDrafts());
                  }
                }}
                className="text-[10px] font-bold text-[#938A82] hover:text-red-700 transition"
              >
                Discard
              </button>
            </div>
            <h4 className="text-sm font-bold text-[#161311] truncate">
              {activeDraft.name}
            </h4>
            <p className="text-xs text-[#746E69] leading-relaxed">
              Saved locally · {activeDraft.totalPlaces ? `${activeDraft.totalPlaces} seats` : "In progress"}
            </p>
          </div>
        ) : (
          <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#EEE8E2] space-y-1">
            <h4 className="text-sm font-bold text-[#161311]">
              No vehicles added yet
            </h4>
            <p className="text-xs text-[#746E69] leading-relaxed">
              Prepare vehicles now. Business approval is required only when you submit a completed vehicle for review.
            </p>
          </div>
        )}
      </div>

      <div className="pt-2 flex gap-2">
        {activeDraft ? (
          <button
            onClick={() => {
              setActiveDraftId(activeDraft.id);
              setRegistrationOpen(true);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-[#7A1D1B] text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#641715] transition shadow-2xs"
          >
            <span>Continue vehicle setup</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={() => setRegistrationOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-[#FAF8F5] text-[#746E69] font-semibold text-xs border border-[#EEE8E2] flex items-center justify-center gap-2 hover:border-[#CDBDB5]"
          >
            <Plus className="w-4 h-4 text-neutral-400" />
            <span>Prepare a vehicle</span>
          </button>
        )}
      </div>
      <FleetRegistrationFlow
        open={registrationOpen}
        canSubmitForReview={isApproved}
        onClose={() => setRegistrationOpen(false)}
        onRegistered={() => {
          setRegistrationOpen(false);
          if (typeof window !== "undefined") {
          }
          window.location.reload();
        }}
      />
    </div>
  );
}

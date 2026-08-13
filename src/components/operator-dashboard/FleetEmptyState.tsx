"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Lock, Plus } from "lucide-react";
import { VerificationStatus } from "@/features/operator-dashboard/operator-dashboard-contract";
import FleetRegistrationFlow from "@/features/fleet-registration/FleetRegistrationFlow";

interface FleetEmptyStateProps {
  verificationStatus: VerificationStatus;
}

export default function FleetEmptyState({
  verificationStatus,
}: FleetEmptyStateProps) {
  const isApproved = verificationStatus === "approved";
  const [registrationOpen, setRegistrationOpen] = useState(false);

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

        <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#EEE8E2] space-y-1">
          <h4 className="text-sm font-bold text-[#161311]">
            No vehicles added yet
          </h4>
          <p className="text-xs text-[#746E69] leading-relaxed">
            Prepare your first vehicle when fleet registration becomes available in the next setup step.
          </p>
        </div>
      </div>

      <div className="pt-2">
        <button
          disabled={!isApproved}
          onClick={() => isApproved && setRegistrationOpen(true)}
          className="w-full py-2.5 px-4 rounded-xl bg-[#FAF8F5] text-[#746E69] font-semibold text-xs border border-[#EEE8E2] disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:border-[#CDBDB5]"
        >
          {isApproved ? (
            <>
              <Plus className="w-4 h-4 text-neutral-400" />
              <span>Register your first vehicle</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Fleet preparation locked</span>
              <span className="text-[10px] text-neutral-400 font-normal">
                (Requires verification)
              </span>
            </>
          )}
        </button>
      </div>
      <FleetRegistrationFlow open={registrationOpen} onClose={() => setRegistrationOpen(false)} onRegistered={() => window.location.reload()} />
    </div>
  );
}

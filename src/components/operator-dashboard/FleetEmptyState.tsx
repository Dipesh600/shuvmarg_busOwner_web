"use client";

import React from "react";
import { Bus, Plus, Lock } from "lucide-react";
import { VerificationStatus } from "@/features/operator-dashboard/operator-dashboard-contract";

interface FleetEmptyStateProps {
  verificationStatus: VerificationStatus;
}

export default function FleetEmptyState({
  verificationStatus,
}: FleetEmptyStateProps) {
  const isApproved = verificationStatus === "approved";

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8 text-center shadow-2xs space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-[#FDFAF6] border border-[#E8DDCC] flex items-center justify-center text-[#7A1D1B] mx-auto">
        <Bus className="w-6 h-6" />
      </div>

      <div className="max-w-md mx-auto space-y-1">
        <h3 className="text-base font-bold text-neutral-900">
          No vehicles added yet
        </h3>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Register your first bus and prepare its verification documents. Each vehicle will be verified individually before being assigned to live routes.
        </p>
      </div>

      <div className="pt-2">
        <button
          disabled
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-100 text-neutral-400 font-semibold text-xs border border-neutral-200 cursor-not-allowed mx-auto"
        >
          {isApproved ? (
            <>
              <Plus className="w-4 h-4" />
              <span>Prepare your first vehicle</span>
              <span className="text-[10px] text-neutral-400 font-normal ml-1">
                (Upcoming step)
              </span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>Fleet creation locked</span>
              <span className="text-[10px] text-neutral-400 font-normal ml-1">
                (Requires business verification)
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { Store, ShieldCheck } from "lucide-react";
import type { AgentAssignment } from "@/features/agent-assignment/agent-assignment-contract";

interface AgentCounterTermsCardProps {
  assignment: AgentAssignment;
  onEditTerms?: () => void;
}

export function AgentCounterTermsCard({
  assignment,
  onEditTerms,
}: AgentCounterTermsCardProps) {
  const scopeLabel =
    assignment.access.accessScope === "ALL_BUSES"
      ? "All scheduled trips across brand"
      : assignment.access.accessScope === "ROUTES"
      ? "Specific assigned corridors"
      : "Designated departures only";

  const isAuthorized = assignment.status === "ACTIVE";

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#EDE7E0] bg-white p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header Strip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#554E48]">
          <Store className="size-4 text-[#7A1D1B]" />
          <span>Counter &amp; Access Terms</span>
        </div>

        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
            isAuthorized
              ? "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]"
              : "bg-[#FFF8ED] text-[#976B18] border-[#F8DEAE]"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${
              isAuthorized ? "bg-[#059669]" : "bg-[#D97706]"
            }`}
          />
          <span>{isAuthorized ? "Authorized to sell" : "Pending activation"}</span>
        </span>
      </div>

      {/* Body Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl bg-[#FAF8F5]/80 border border-[#EDE7E0]/70">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-2xl bg-[#FFF5F4] text-[#7A1D1B] flex items-center justify-center shrink-0 border border-[#F8C9C7]/50">
            <Store className="size-5 text-[#7A1D1B]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#111111]">
              {assignment.agent.businessName || "Independent ticketing counter"}
            </h3>
            <p className="text-xs text-[#746E69] mt-0.5">
              Trip Scope: <span className="font-semibold text-[#111111]">{scopeLabel}</span>
            </p>
          </div>
        </div>

        {onEditTerms && (
          <button
            type="button"
            onClick={onEditTerms}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#7A1D1B] px-5 text-xs font-bold text-white shadow-xs transition hover:bg-[#641715] active:scale-[0.98] shrink-0"
          >
            <ShieldCheck className="size-3.5" />
            <span>Manage permissions</span>
          </button>
        )}
      </div>
    </div>
  );
}

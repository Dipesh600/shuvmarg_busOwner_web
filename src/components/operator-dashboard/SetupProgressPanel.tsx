"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Clock, ShieldAlert, ArrowRight } from "lucide-react";
import {
  SetupEvidence,
  VerificationStatus,
} from "@/features/operator-dashboard/operator-dashboard-contract";
import { calculateSetupProgress } from "@/features/operator-dashboard/setup-progress";
import { determineNextAction } from "@/features/operator-dashboard/next-action";

interface SetupProgressPanelProps {
  evidence: SetupEvidence;
  verificationStatus: VerificationStatus;
}

export default function SetupProgressPanel({
  evidence,
  verificationStatus,
}: SetupProgressPanelProps) {
  const { percentage, completedItemsCount, totalEvidenceItemsCount, items } =
    calculateSetupProgress(evidence);

  const nextAction = determineNextAction({ verificationStatus });

  return (
    <div className="bg-white rounded-3xl border border-[#EEE8E2] p-6 sm:p-7 shadow-2xs space-y-6 flex flex-col justify-between">
      {/* Header & Percentage */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold text-[#7A1D1B] uppercase tracking-wider mb-1">
              Business Setup
            </div>
            <h3
              className="text-lg font-bold text-[#161311]"
              style={{ fontFamily: '"Neue Machina", system-ui, sans-serif' }}
            >
              Account Readiness Progress
            </h3>
          </div>
          <div className="text-right flex-shrink-0">
            <span
              className="text-3xl font-bold text-[#7A1D1B]"
              style={{ fontFamily: '"Neue Machina", system-ui, sans-serif' }}
            >
              {percentage}%
            </span>
            <div className="text-[10px] font-semibold text-[#746E69] uppercase tracking-wider">
              {completedItemsCount} of {totalEvidenceItemsCount} complete
            </div>
          </div>
        </div>

        {/* Compact Progress Bar */}
        <div className="w-full bg-[#FAF8F5] rounded-full h-2.5 overflow-hidden border border-[#EEE8E2]">
          <div
            className="bg-[#7A1D1B] h-full transition-all duration-500 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Next Action Box */}
      <div className="bg-[#FFF8F4] rounded-2xl p-4.5 border border-[#EEE8E2] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#7A1D1B]/10 text-[#7A1D1B]">
            {nextAction.badge}
          </span>
          <span className="text-[11px] font-medium text-[#746E69]">
            Primary next step
          </span>
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#161311]">
            {nextAction.label}
          </h4>
          <p className="text-xs text-[#746E69] leading-relaxed mt-0.5">
            {nextAction.description}
          </p>
        </div>

        <div>
          {nextAction.disabled || !nextAction.href ? (
            <button
              disabled
              className="w-full py-2.5 px-4 rounded-xl bg-[#FAF8F5] text-[#746E69] font-semibold text-xs border border-[#EEE8E2] cursor-not-allowed text-center"
            >
              {nextAction.label}
            </button>
          ) : (
            <Link
              href={nextAction.href}
              className="w-full py-2.5 px-4 rounded-xl bg-[#7A1D1B] hover:bg-[#5C1414] text-white font-semibold text-xs shadow-2xs transition-all flex items-center justify-center gap-2 group"
            >
              <span>{nextAction.label}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      </div>

      {/* 4 Evidence-backed Items as Clean Rows */}
      <div className="space-y-2 pt-1 border-t border-[#EEE8E2]/60">
        {items.slice(0, 4).map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between py-2 px-1 text-xs"
          >
            <div className="flex items-center gap-2.5">
              {item.status === "complete" ? (
                <CheckCircle2 className="w-4 h-4 text-[#2E7D32] flex-shrink-0" />
              ) : item.status === "in_progress" ? (
                <Clock className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              )}
              <span className="font-semibold text-[#161311]">
                {item.label}
              </span>
            </div>
            <span
              className={`text-[11px] font-medium ${
                item.status === "complete"
                  ? "text-[#2E7D32]"
                  : item.status === "in_progress"
                  ? "text-[#F59E0B]"
                  : "text-[#746E69]"
              }`}
            >
              {item.status === "complete"
                ? "Complete"
                : item.status === "in_progress"
                ? "In progress"
                : "Not started"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

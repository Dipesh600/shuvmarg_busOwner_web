"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Lock, ArrowRight, ShieldAlert } from "lucide-react";
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
    <section className="bg-[#F8F1E3] rounded-2xl border border-[#E8DDCC] p-6 sm:p-8 shadow-xs relative overflow-hidden">
      {/* Subtle Background Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#7A1D1B]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#E2D6C6]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7A1D1B] uppercase tracking-wider mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#7A1D1B]" />
            Business Setup Overview
          </div>
          <h2
            className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight"
            style={{ fontFamily: '"Neue Machina", system-ui, sans-serif' }}
          >
            Let’s get your operation ready.
          </h2>
          <p className="text-sm text-neutral-700 mt-1 max-w-2xl leading-relaxed">
            Complete your business verification, prepare your fleet and unlock live operations.
          </p>
        </div>

        {/* Progress Circular / Numeric Display */}
        <div className="flex items-center gap-4 bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-[#E5DECE] flex-shrink-0">
          <div className="text-center">
            <div
              className="text-3xl sm:text-4xl font-bold text-[#7A1D1B] leading-none"
              style={{ fontFamily: '"Neue Machina", system-ui, sans-serif' }}
            >
              {percentage}%
            </div>
            <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mt-1">
              Business Setup
            </div>
          </div>
          <div className="h-10 w-px bg-[#E2D6C6]" />
          <div className="text-xs text-neutral-600 space-y-0.5">
            <div className="font-semibold text-neutral-900">
              {completedItemsCount} of {totalEvidenceItemsCount} items verified
            </div>
            <div className="text-[11px] text-neutral-500">
              Evidence-backed progress
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Next-Action Banner */}
      <div className="mt-6 bg-white rounded-xl p-5 border border-[#E5DECE] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#7A1D1B]/10 text-[#7A1D1B]">
              {nextAction.badge}
            </span>
            <span className="text-xs font-semibold text-neutral-500">
              Dominant next step
            </span>
          </div>
          <h3 className="text-base font-bold text-neutral-900">
            {nextAction.label}
          </h3>
          <p className="text-xs text-neutral-600 max-w-xl">
            {nextAction.description}
          </p>
        </div>

        <div>
          {nextAction.disabled || !nextAction.href ? (
            <button
              disabled
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-neutral-100 text-neutral-400 font-semibold text-xs border border-neutral-200 cursor-not-allowed flex items-center justify-center gap-2"
            >
              {nextAction.label}
            </button>
          ) : (
            <Link
              href={nextAction.href}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#7A1D1B] hover:bg-[#5C1414] text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 group"
            >
              <span>{nextAction.label}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      </div>

      {/* Checklist items row */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {items.slice(0, 4).map((item) => (
          <div
            key={item.id}
            className="bg-white/90 rounded-xl p-3.5 border border-[#E5DECE] flex items-start gap-3"
          >
            <div className="mt-0.5">
              {item.status === "complete" ? (
                <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
              ) : item.status === "in_progress" ? (
                <Clock className="w-4 h-4 text-[#F59E0B]" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-neutral-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-neutral-900 truncate">
                {item.label}
              </div>
              <div className="text-[11px] text-neutral-500 line-clamp-1">
                {item.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

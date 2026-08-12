import React from "react";
import { ShieldCheck, Zap, Clock, FileCheck } from "lucide-react";

export default function OperatorSlaCard() {
  return (
    <div className="bg-white rounded-[24px] border border-neutral-100 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-100">
        <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[#7A1D1B] shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-[17px] font-bold text-neutral-900 leading-tight">
            Operator Service Level Commitments (SLA)
          </h2>
          <p className="text-[13px] text-neutral-500">
            Guaranteed turnaround timelines for fleet operators across Nepal.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tier 1: P1 Critical */}
        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
          <div className="flex items-center gap-2 mb-2 text-red-700 font-bold text-[13px]">
            <Zap className="w-4 h-4 text-red-600" />
            <span>P1 · Emergency Dispatch</span>
          </div>
          <p className="text-[20px] font-bold text-neutral-900 mb-1">&lt; 1 Hour Response</p>
          <p className="text-[12px] text-neutral-500 leading-relaxed">
            Bus breakdowns, severe weather disruptions, and urgent passenger transfers.
          </p>
        </div>

        {/* Tier 2: P2 High */}
        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
          <div className="flex items-center gap-2 mb-2 text-amber-700 font-bold text-[13px]">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>P2 · Financial Disputes</span>
          </div>
          <p className="text-[20px] font-bold text-neutral-900 mb-1">&lt; 4 Hours Resolution</p>
          <p className="text-[12px] text-neutral-500 leading-relaxed">
            Settlement delays, chargebacks, and refund discrepancy investigations.
          </p>
        </div>

        {/* Tier 3: P3 Standard */}
        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
          <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold text-[13px]">
            <FileCheck className="w-4 h-4 text-blue-600" />
            <span>P3 · Fleet &amp; Compliance</span>
          </div>
          <p className="text-[20px] font-bold text-neutral-900 mb-1">&lt; 24 Hours Review</p>
          <p className="text-[12px] text-neutral-500 leading-relaxed">
            New vehicle approvals, route modifications, and document renewals.
          </p>
        </div>
      </div>
    </div>
  );
}

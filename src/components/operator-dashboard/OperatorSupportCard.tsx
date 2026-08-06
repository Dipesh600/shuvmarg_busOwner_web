"use client";

import React from "react";
import { LifeBuoy, ShieldCheck } from "lucide-react";

export default function OperatorSupportCard() {
  return (
    <div className="bg-[#FDFAF6] rounded-xl border border-[#E8DDCC] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-[#7A1D1B]/10 border border-[#7A1D1B]/20 flex items-center justify-center text-[#7A1D1B] flex-shrink-0">
          <LifeBuoy className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-neutral-900">
            Need help setting up?
          </h4>
          <p className="text-xs text-neutral-600 leading-relaxed max-w-xl">
            Our operator support team can guide you through business verification and fleet registration.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E5DECE] text-xs font-semibold text-neutral-700 flex-shrink-0 self-start sm:self-auto">
        <ShieldCheck className="w-4 h-4 text-[#7A1D1B]" />
        <span>Assisted Setup Available</span>
      </div>
    </div>
  );
}

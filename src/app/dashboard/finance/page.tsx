"use client";

import React from "react";
import { Wallet, Lock } from "lucide-react";

export default function FinancePage() {
  return (
    <div className="w-full min-h-full p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-neutral-900"
            style={{ fontFamily: '"Neue Machina", system-ui, sans-serif' }}
          >
            Finance & Settlements
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Revenue payouts, bank settlements, and transaction history
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
          <Lock className="w-3.5 h-3.5 text-neutral-400" />
          Locked
        </span>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center shadow-2xs space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#FDFAF6] border border-[#E8DDCC] flex items-center justify-center text-[#7A1D1B] mx-auto">
          <Wallet className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-base font-bold text-neutral-900">
            No settlement activity yet
          </h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Settlement reporting and automated bank payouts will appear after your business verification is complete and passenger ticket sales begin.
          </p>
        </div>
      </div>
    </div>
  );
}

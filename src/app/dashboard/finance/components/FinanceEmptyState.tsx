import React from "react";
import { Plus } from "lucide-react";

interface FinanceEmptyStateProps {
  onRequestSettlement: () => void;
  isFiltered?: boolean;
}

export function FinanceEmptyState({
  onRequestSettlement,
  isFiltered,
}: FinanceEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16 text-center">
      {/* Empty State Illustration Asset */}
      <div className="relative w-48 sm:w-60 md:w-64 max-w-full mb-3 pointer-events-none select-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/finance_empty state.webp"
          alt="No settlements"
          className="w-full h-auto object-contain mx-auto"
        />
      </div>

      <div className="space-y-1.5 max-w-sm mx-auto">
        <h3 className="text-base sm:text-lg font-bold text-[#111111] tracking-tight">
          {isFiltered ? "No settlements match your filters" : "No settlement requests recorded."}
        </h3>
        <p className="text-xs sm:text-sm text-[#746E69] leading-relaxed">
          {isFiltered
            ? "Try selecting a broader date range or clearing the active filters."
            : "Settlements will appear here once you request a payout."}
        </p>
      </div>

      <button
        type="button"
        onClick={onRequestSettlement}
        className="mt-5 inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#7A1D1B] px-6 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-[#641715] active:scale-[0.98]"
      >
        <Plus className="size-4" />
        <span>Request settlement</span>
      </button>
    </div>
  );
}

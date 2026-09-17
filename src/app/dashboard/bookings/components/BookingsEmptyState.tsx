import React from "react";
import { Calendar } from "lucide-react";

interface BookingsEmptyStateProps {
  onClearFilters: () => void;
  isFiltered?: boolean;
}

export function BookingsEmptyState({
  onClearFilters,
  isFiltered = true,
}: BookingsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16 text-center">
      {/* Empty State Illustration Asset */}
      <div className="relative w-48 sm:w-60 md:w-64 max-w-full mb-3 pointer-events-none select-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/bookings_empty.webp"
          alt="No bookings found"
          className="w-full h-auto object-contain mx-auto"
        />
      </div>

      <div className="space-y-1.5 max-w-sm mx-auto">
        <h3 className="text-base sm:text-lg font-bold text-[#111111] tracking-tight">
          {isFiltered ? "No bookings match these filters." : "No passenger bookings recorded."}
        </h3>
        <p className="text-xs sm:text-sm text-[#746E69] leading-relaxed">
          {isFiltered
            ? "Try adjusting the date range or status filter."
            : "Passenger reservations for your trips will appear here."}
        </p>
      </div>

      <button
        type="button"
        onClick={onClearFilters}
        className="mt-5 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#EDE7E0] bg-[#FFF5F4] px-4 text-xs font-semibold text-[#7A1D1B] shadow-2xs transition hover:bg-[#FDE7E6] active:scale-[0.98]"
      >
        <Calendar className="size-3.5" />
        <span>Clear filters</span>
      </button>
    </div>
  );
}

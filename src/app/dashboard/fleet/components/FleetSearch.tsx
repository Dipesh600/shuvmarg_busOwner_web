import React from "react";
import { Search, SlidersHorizontal } from "lucide-react";

export type FleetStatusFilter = "ALL" | "DRAFT" | "PENDING" | "REJECTED" | "APPROVED";

interface FleetSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  activeView: FleetStatusFilter;
  onViewChange: (view: FleetStatusFilter) => void;
  viewCounts: Record<string, number>;
  totalCount: number;
}

export function FleetSearch({
  query,
  onQueryChange,
  activeView,
  onViewChange,
  viewCounts,
  totalCount,
}: FleetSearchProps) {
  const tabs = [
    ["ALL", "All", totalCount],
    ["DRAFT", "Drafts", viewCounts.DRAFT || 0],
    ["PENDING", "In review", viewCounts.PENDING || 0],
    ["REJECTED", "Needs changes", viewCounts.REJECTED || 0],
    ["APPROVED", "Approved", viewCounts.APPROVED || 0],
  ] as const;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Status Filter Pills (Order 2 on mobile to appear below search, Order 1 on desktop to appear on left) */}
      <div
        className="order-2 flex items-center gap-2 overflow-x-auto pb-1 sm:order-1 sm:pb-0 scrollbar-none"
        aria-label="Bus status"
      >
        {tabs.map(([value, label, count]) => {
          const isActive = activeView === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onViewChange(value as FleetStatusFilter)}
              aria-pressed={isActive}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition active:scale-[0.98] ${
                isActive
                  ? "border-[#7A1D1B] bg-[#7A1D1B] font-bold text-white shadow-xs"
                  : "border-[#E5E0DA] bg-white text-[#554E48] hover:border-[#BDAFA6] hover:bg-[#FAF7F2]"
              }`}
            >
              <span>{label}</span>
              <span
                className={`font-medium ${
                  isActive ? "text-white/80" : "text-[#746E69]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}

        {/* Mobile Filter Action Icon */}
        <button
          type="button"
          aria-label="More filters"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-[#E5E0DA] bg-white text-[#554E48] shadow-2xs hover:bg-[#FAF7F2] active:scale-[0.98] sm:hidden"
        >
          <SlidersHorizontal className="size-3.5" />
        </button>
      </div>

      {/* Search Input (Order 1 on mobile to appear on top, Order 2 on desktop to appear on right) */}
      <div className="relative order-1 w-full shrink-0 sm:order-2 sm:w-72 md:w-80">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search buses by name, number, or class"
          className="h-10 w-full rounded-full border border-[#E5E0DA] bg-white pl-10 pr-4 text-xs text-[#191512] shadow-2xs outline-none transition placeholder:text-[#9CA3AF] focus:border-[#7A1D1B] focus:ring-1 focus:ring-[#7A1D1B]/20"
        />
      </div>
    </div>
  );
}

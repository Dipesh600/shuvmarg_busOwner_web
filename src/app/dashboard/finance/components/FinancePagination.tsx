import React from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

interface FinancePaginationProps {
  page: number;
  totalPages: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export function FinancePagination({
  page,
  totalPages,
  limit,
  onPageChange,
  onLimitChange,
}: FinancePaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      {/* Items per page */}
      <div className="flex items-center gap-2 text-xs text-[#746E69]">
        <span>Show</span>
        <div className="relative flex items-center">
          <select
            value={limit}
            onChange={(e) => onLimitChange?.(Number(e.target.value))}
            className="appearance-none rounded-xl border border-[#EDE7E0] bg-white pl-2.5 pr-7 py-1.5 text-xs font-semibold text-[#191512] shadow-2xs outline-none cursor-pointer hover:border-[#DCD5CD] transition"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 size-3 text-[#746E69]" />
        </div>
        <span>per page</span>
      </div>

      {/* Page controls */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          className="size-8 inline-flex items-center justify-center rounded-xl border border-[#EDE7E0] bg-white text-[#191512] shadow-2xs transition hover:bg-[#FAF8F5] disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft className="size-4" />
        </button>

        <span className="min-w-8 h-8 px-2.5 inline-flex items-center justify-center rounded-xl bg-[#FFF5F4] border border-[#F0CACA] text-xs font-bold text-[#7A1D1B]">
          {page}
        </span>

        {safeTotalPages > 1 && (
          <span className="text-xs text-[#746E69] px-1">
            of {safeTotalPages}
          </span>
        )}

        <button
          type="button"
          disabled={page >= safeTotalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          className="size-8 inline-flex items-center justify-center rounded-xl border border-[#EDE7E0] bg-white text-[#191512] shadow-2xs transition hover:bg-[#FAF8F5] disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

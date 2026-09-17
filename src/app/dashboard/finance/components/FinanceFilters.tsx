import React from "react";
import { RotateCw, Calendar, ChevronDown } from "lucide-react";
import type { OperatorBrand } from "@/features/fleet-registration/api-brands";

interface FinanceFiltersProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (val: string) => void;
  onToDateChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  brandFilter: string;
  onBrandFilterChange: (val: string) => void;
  brands: OperatorBrand[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function FinanceFilters({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  statusFilter,
  onStatusFilterChange,
  brandFilter,
  onBrandFilterChange,
  brands,
  onRefresh,
  isRefreshing,
}: FinanceFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
      {/* Left Filters Group */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* From Date */}
        <div className="flex items-center gap-2 rounded-xl border border-[#EDE7E0] bg-white px-3 py-2 text-xs shadow-2xs">
          <span className="text-[#746E69] font-medium">From</span>
          <div className="relative flex items-center">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
              className="bg-transparent font-semibold text-[#191512] outline-none cursor-pointer text-xs"
            />
          </div>
        </div>

        {/* To Date */}
        <div className="flex items-center gap-2 rounded-xl border border-[#EDE7E0] bg-white px-3 py-2 text-xs shadow-2xs">
          <span className="text-[#746E69] font-medium">To</span>
          <div className="relative flex items-center">
            <input
              type="date"
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
              className="bg-transparent font-semibold text-[#191512] outline-none cursor-pointer text-xs"
            />
          </div>
        </div>

        {/* Status Dropdown */}
        <div className="relative flex items-center">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="appearance-none rounded-xl border border-[#EDE7E0] bg-white pl-3.5 pr-8 py-2 text-xs font-semibold text-[#191512] shadow-2xs outline-none cursor-pointer hover:border-[#DCD5CD] transition"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="paid">Paid</option>
            <option value="received">Received</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 size-3.5 text-[#746E69]" />
        </div>

        {/* Operator Dropdown */}
        <div className="relative flex items-center">
          <select
            value={brandFilter}
            onChange={(e) => onBrandFilterChange(e.target.value)}
            className="appearance-none rounded-xl border border-[#EDE7E0] bg-white pl-3.5 pr-8 py-2 text-xs font-semibold text-[#191512] shadow-2xs outline-none cursor-pointer hover:border-[#DCD5CD] transition max-w-[180px] truncate"
          >
            <option value="all">All operators</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.brandName}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 size-3.5 text-[#746E69]" />
        </div>
      </div>

      {/* Right Actions: Refresh */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#EDE7E0] bg-white px-4 text-xs font-semibold text-[#191512] shadow-2xs transition hover:bg-[#FAF8F5] active:scale-[0.98] disabled:opacity-50"
        >
          <RotateCw className={`size-3.5 text-[#554E48] ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}

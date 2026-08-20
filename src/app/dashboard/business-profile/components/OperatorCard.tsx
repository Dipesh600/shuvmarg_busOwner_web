import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface OperatorCardProps {
  companyName: string;
}

export function OperatorCard({ companyName }: OperatorCardProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center p-5 bg-white border border-[#E8E1DB] rounded-[16px] shadow-sm gap-6 transition hover:shadow-md">
      {/* Square Logo */}
      <div className="h-24 w-24 shrink-0 rounded-2xl bg-[#FAF8F5] border border-[#E8E1DB] overflow-hidden flex items-center justify-center">
        <span className="text-2xl font-black uppercase text-[#7A1D1B]" aria-hidden="true">
          {companyName.trim().slice(0, 2) || "SM"}
        </span>
        <span className="sr-only">{companyName} operator profile</span>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 gap-3 w-full">
        <div className="flex items-center justify-between">
          <h3
            className="text-lg font-bold text-neutral-900 uppercase tracking-tight"
            style={{ fontFamily: '"Neue Machina", system-ui, sans-serif' }}
          >
            {companyName}
          </h3>
          <span className="inline-flex items-center rounded-full bg-[#E8F5E9] px-2.5 py-0.5 text-xs font-semibold text-[#2E7D32]">
            Active
          </span>
        </div>

        {/* Text CTAs */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-1">
          <Link
            href="/dashboard/fleet"
            className="text-sm font-semibold text-neutral-600 hover:text-[#7A1D1B] transition-colors flex items-center gap-1 group"
          >
            Fleets{" "}
            <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-2 transition-all group-hover:opacity-100 group-hover:ml-0" />
          </Link>
          <Link
            href="/dashboard/fleet"
            className="text-sm font-semibold text-neutral-600 hover:text-[#7A1D1B] transition-colors flex items-center gap-1 group"
          >
            Route setup{" "}
            <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-2 transition-all group-hover:opacity-100 group-hover:ml-0" />
          </Link>
          <Link
            href="/dashboard/trips"
            className="text-sm font-semibold text-neutral-600 hover:text-[#7A1D1B] transition-colors flex items-center gap-1 group"
          >
            Trips & schedules{" "}
            <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-2 transition-all group-hover:opacity-100 group-hover:ml-0" />
          </Link>
          <Link
            href="/dashboard/staff"
            className="text-sm font-semibold text-neutral-600 hover:text-[#7A1D1B] transition-colors flex items-center gap-1 group"
          >
            Staff{" "}
            <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-2 transition-all group-hover:opacity-100 group-hover:ml-0" />
          </Link>
          <Link
            href="/dashboard/financials"
            className="text-sm font-semibold text-neutral-600 hover:text-[#7A1D1B] transition-colors flex items-center gap-1 group"
          >
            Financials{" "}
            <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-2 transition-all group-hover:opacity-100 group-hover:ml-0" />
          </Link>
        </div>
      </div>
    </div>
  );
}

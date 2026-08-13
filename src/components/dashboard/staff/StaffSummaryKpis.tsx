import React from "react";
import { Users, UserCheck, ShieldCheck, Store } from "lucide-react";
import { StaffSummaryStats } from "./staff-contract";

interface StaffSummaryKpisProps {
  summary: StaffSummaryStats;
  partnerAgentsCount?: number;
}

export default function StaffSummaryKpis({
  summary,
  partnerAgentsCount = 0,
}: StaffSummaryKpisProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Total Crew */}
      <div className="bg-white rounded-[24px] border border-neutral-100 p-6 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
            Total Staff Crew
          </p>
          <h3 className="text-[28px] font-bold text-neutral-900 leading-tight">
            {summary.totalStaff}
          </h3>
          <p className="text-[12px] text-green-700 font-semibold mt-1">
            {summary.activeCount} active on duty
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[#7A1D1B] shrink-0">
          <Users className="w-6 h-6" />
        </div>
      </div>

      {/* Drivers */}
      <div className="bg-white rounded-[24px] border border-neutral-100 p-6 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
            Assigned Drivers
          </p>
          <h3 className="text-[28px] font-bold text-neutral-900 leading-tight">
            {summary.driversCount}
          </h3>
          <p className="text-[12px] text-neutral-500 font-medium mt-1">
            Heavy vehicle licensed
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
          <UserCheck className="w-6 h-6" />
        </div>
      </div>

      {/* Conductors */}
      <div className="bg-white rounded-[24px] border border-neutral-100 p-6 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
            Bus Conductors
          </p>
          <h3 className="text-[28px] font-bold text-neutral-900 leading-tight">
            {summary.conductorsCount}
          </h3>
          <p className="text-[12px] text-neutral-500 font-medium mt-1">
            Boarding QR scanners
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-800 shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
      </div>

      {/* Partner Agents */}
      <div className="bg-white rounded-[24px] border border-neutral-100 p-6 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
            Partner Agents
          </p>
          <h3 className="text-[28px] font-bold text-neutral-900 leading-tight">
            {summary.agentsCount ?? partnerAgentsCount}
          </h3>
          <p className="text-[12px] text-neutral-500 font-medium mt-1">
            Authorized counters
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
          <Store className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { Ticket } from "lucide-react";
import type { AgentAssignment } from "@/features/agent-assignment/agent-assignment-contract";

interface AgentSalesActivityCardProps {
  assignment: AgentAssignment;
}

export function AgentSalesActivityCard({
  assignment,
}: AgentSalesActivityCardProps) {
  const salesCount = assignment.salesCount ?? 0;

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#EDE7E0] bg-white p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header Strip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#554E48]">
          <Ticket className="size-4 text-[#7A1D1B]" />
          <span>Recent Ticket Sales</span>
        </div>

        <span className="text-xs text-[#746E69] font-medium">
          {salesCount} tickets sold
        </span>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-[#EDE7E0] overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#EDE7E0] bg-[#FAF8F5] text-[10px] font-bold uppercase tracking-wider text-[#746E69]">
              <th className="px-4 py-2.5">Ticket ID</th>
              <th className="px-4 py-2.5">Departure</th>
              <th className="px-3 py-2.5">Seats</th>
              <th className="px-4 py-2.5">Gross</th>
              <th className="px-4 py-2.5 text-right">Commission</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="py-12 px-4 text-center">
                <p className="text-xs sm:text-sm font-bold text-[#111111]">
                  No tickets sold yet
                </p>
                <p className="text-xs text-[#746E69] mt-0.5">
                  When passengers book through this counter agent, transaction records will appear here.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

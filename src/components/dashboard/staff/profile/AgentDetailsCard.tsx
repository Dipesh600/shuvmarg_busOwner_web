"use client";

import React from "react";
import { IdCard, Edit2, FileText } from "lucide-react";
import type { AgentAssignment } from "@/features/agent-assignment/agent-assignment-contract";

interface AgentDetailsCardProps {
  assignment: AgentAssignment;
  onEditDetails?: () => void;
  onViewDocuments?: () => void;
}

export function AgentDetailsCard({
  assignment,
  onEditDetails,
  onViewDocuments,
}: AgentDetailsCardProps) {
  const commissionText =
    assignment.commission.value === 0
      ? "No commission"
      : assignment.commission.mode === "PERCENT"
      ? `${assignment.commission.value}% per ticket`
      : `Rs. ${assignment.commission.value} ${
          assignment.commission.mode === "FLAT_PER_SEAT" ? "per seat" : "per booking"
        }`;

  const territory =
    [assignment.agent.municipality, assignment.agent.district].filter(Boolean).join(", ") ||
    "All operational districts";

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#EDE7E0] bg-white p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header Strip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#554E48]">
          <IdCard className="size-4 text-[#7A1D1B]" />
          <span>Agent Details</span>
        </div>

        {onEditDetails && (
          <button
            type="button"
            onClick={onEditDetails}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-[#EDE7E0] bg-white px-3.5 text-xs font-semibold text-[#191512] shadow-2xs hover:bg-[#FAF8F5] transition cursor-pointer"
          >
            <Edit2 className="size-3 text-[#554E48]" />
            <span>Edit details</span>
          </button>
        )}
      </div>

      {/* 2-Column Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-xs">
        {/* Left Column */}
        <div className="space-y-3.5">
          <div className="flex items-baseline justify-between sm:justify-start sm:gap-8">
            <span className="text-[#746E69] w-32 shrink-0">Commission rate</span>
            <span className="font-semibold text-[#111111]">{commissionText}</span>
          </div>

          <div className="flex items-baseline justify-between sm:justify-start sm:gap-8">
            <span className="text-[#746E69] w-32 shrink-0">Cash bookings</span>
            <span className="font-semibold text-[#111111]">
              {assignment.permissions.canSellCash ? "Allowed" : "Restricted"}
            </span>
          </div>

          <div className="flex items-baseline justify-between sm:justify-start sm:gap-8">
            <span className="text-[#746E69] w-32 shrink-0">Cancellations</span>
            <span className="font-semibold text-[#111111]">
              {assignment.permissions.canCancel
                ? `Allowed up to ${assignment.permissions.cancelWindowMins || 60}m prior`
                : "Not permitted"}
            </span>
          </div>

          <div className="flex items-baseline justify-between sm:justify-start sm:gap-8">
            <span className="text-[#746E69] w-32 shrink-0">Phone</span>
            <span className="font-semibold text-[#111111] font-mono">
              {assignment.agent.phone}
            </span>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3.5">
          <div className="flex items-baseline justify-between sm:justify-start sm:gap-8">
            <span className="text-[#746E69] w-32 shrink-0">Counter agency</span>
            <span className="font-semibold text-[#111111]">
              {assignment.agent.businessName || "Independent counter"}
            </span>
          </div>

          <div className="flex items-baseline justify-between sm:justify-start sm:gap-8">
            <span className="text-[#746E69] w-32 shrink-0">Territory</span>
            <span className="font-semibold text-[#111111]">{territory}</span>
          </div>

          <div className="flex items-baseline justify-between sm:justify-start sm:gap-8">
            <span className="text-[#746E69] w-32 shrink-0">Operator</span>
            <span className="font-semibold text-[#111111]">{assignment.brand.name}</span>
          </div>

          <div className="flex items-baseline justify-between sm:justify-start sm:gap-8">
            <span className="text-[#746E69] w-32 shrink-0">App status</span>
            <span className="font-semibold text-[#111111] inline-flex items-center gap-1.5">
              <span
                className={`size-1.5 rounded-full ${
                  assignment.status === "ACTIVE" ? "bg-[#059669]" : "bg-[#D97706]"
                }`}
              />
              <span>{assignment.status === "ACTIVE" ? "Connected" : "Pending activation"}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Actions Row */}
      {onViewDocuments && (
        <div className="flex justify-end pt-2 border-t border-[#EDE7E0]">
          <button
            type="button"
            onClick={onViewDocuments}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-[#EDE7E0] bg-white px-3.5 text-xs font-semibold text-[#7A1D1B] shadow-2xs hover:bg-[#FFF5F4] transition cursor-pointer"
          >
            <FileText className="size-3.5 text-[#7A1D1B]" />
            <span>View documents</span>
          </button>
        </div>
      )}
    </div>
  );
}

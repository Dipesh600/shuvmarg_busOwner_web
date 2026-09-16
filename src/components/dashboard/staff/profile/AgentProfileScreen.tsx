"use client";

import React from "react";
import { Ticket, Plus } from "lucide-react";
import type { AgentAssignment } from "@/features/agent-assignment/agent-assignment-contract";
import ProfileHeader from "./ProfileHeader";
import ProfileEmptySection from "./ProfileEmptySection";

interface AgentProfileScreenProps {
  assignment: AgentAssignment;
  onBack: () => void;
}

export default function AgentProfileScreen({ assignment, onBack }: AgentProfileScreenProps) {
  const initials = (assignment.agent.name || "A")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const commissionText =
    assignment.commission.value === 0
      ? "No commission"
      : assignment.commission.mode === "PERCENT"
      ? `${assignment.commission.value}% per ticket`
      : `Rs. ${assignment.commission.value} ${
          assignment.commission.mode === "FLAT_PER_SEAT" ? "per seat" : "per booking"
        }`;

  const scopeLabel =
    assignment.access.accessScope === "ALL_BUSES"
      ? "All scheduled trips across brand"
      : assignment.access.accessScope === "ROUTES"
      ? "Specific assigned corridors"
      : "Designated departures only";

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Profile Header */}
      <ProfileHeader
        name={assignment.agent.name || "Unnamed agent"}
        roleLabel="Ticket agent"
        statusBadge={
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              assignment.status === "ACTIVE"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : assignment.status === "INVITED"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-neutral-100 text-neutral-600 border border-neutral-200"
            }`}
          >
            {assignment.status === "ACTIVE" ? "Active" : assignment.status === "INVITED" ? "Pending" : assignment.status}
          </span>
        }
        code={assignment.agent.agentCode}
        codeLabel="Agent Code"
        brandName={assignment.brand.name}
        backLabel="Back to Ticket agents"
        onBack={onBack}
        avatarContent={<span>{initials}</span>}
      />

      {/* Quick Metrics — what this agent actually provides */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Tickets Sold</span>
          <span className="mt-1.5 text-3xl font-bold text-neutral-900 block">{assignment.salesCount ?? 0}</span>
        </div>
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Commission Rate</span>
          <span className="mt-1.5 text-base font-bold text-neutral-900 block truncate">{commissionText}</span>
        </div>
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Cash Bookings</span>
          <span className="mt-1.5 text-base font-bold text-neutral-900 block">
            {assignment.permissions.canSellCash ? "Allowed" : "Restricted"}
          </span>
        </div>
      </div>

      {/* Counter & Access Terms */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Counter &amp; Access Terms</h3>
        </div>
        <dl className="grid sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-neutral-100">
          <div className="px-6 py-4">
            <dt className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Trip Scope</dt>
            <dd className="mt-1 text-sm font-semibold text-neutral-800">{scopeLabel}</dd>
          </div>
          <div className="px-6 py-4">
            <dt className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Cancellations</dt>
            <dd className="mt-1 text-sm font-semibold text-neutral-800">
              {assignment.permissions.canCancel
                ? `Allowed up to ${assignment.permissions.cancelWindowMins || 60} min before departure`
                : "Not permitted"}
            </dd>
          </div>
          <div className="px-6 py-4">
            <dt className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Counter / Agency</dt>
            <dd className="mt-1 text-sm font-semibold text-neutral-800">
              {assignment.agent.businessName || "Independent counter"}
            </dd>
          </div>
          <div className="px-6 py-4">
            <dt className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Territory</dt>
            <dd className="mt-1 text-sm font-semibold text-neutral-800">
              {[assignment.agent.municipality, assignment.agent.district].filter(Boolean).join(", ") ||
                "All operational districts"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Recent Sales Activity */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Recent Ticket Sales</h3>
          {(assignment.salesCount ?? 0) > 0 && (
            <span className="rounded-full bg-[#FAF0ED] px-2.5 py-0.5 text-xs font-bold text-[#7A1D1B]">
              {assignment.salesCount} total
            </span>
          )}
        </div>
        <ProfileEmptySection
          icon={Ticket}
          title="No tickets sold yet"
          description="When passengers book through this counter agent, transaction records and seat receipts will appear here."
          action={
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[#7A1D1B]/30 px-4 py-2 text-xs font-bold text-[#7A1D1B]">
              <Plus className="h-3 w-3" />
              Invite this agent to start selling
            </span>
          }
        />
      </div>
    </div>
  );
}


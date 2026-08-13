"use client";

import { useState } from "react";
import { Search, ShieldCheck, Store, Truck, Users } from "lucide-react";
import AgentCountersList from "./AgentCountersList";
import CrewMembersList from "./CrewMembersList";
import StaffSummaryKpis from "./StaffSummaryKpis";
import { StaffSummaryStats } from "./staff-contract";

type ActiveTab = "crew" | "agents";

const EMPTY_SUMMARY: StaffSummaryStats = {
  totalStaff: 0,
  driversCount: 0,
  conductorsCount: 0,
  activeCount: 0,
  agentsCount: 0,
};

export default function StaffManagementLayout() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("crew");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-[24px] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100 text-[#7A1D1B]">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Staff &amp; agents</h1>
            <p className="mt-1 max-w-2xl text-sm text-neutral-500">
              The workspace is ready for crew and partner-agent management. Account creation and operational access remain unavailable until the staff service is connected.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-bold">Frontend preview only</p>
            <p className="mt-0.5 text-xs leading-5 text-amber-800">
              This page does not create staff accounts, grant permissions, or show fabricated operational records.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-neutral-100 pt-6 md:flex-row md:items-center md:justify-between">
          <div className="flex w-fit items-center rounded-2xl bg-neutral-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("crew")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${activeTab === "crew" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}
            >
              <Truck className="h-4 w-4" /> Crew
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("agents")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${activeTab === "agents" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}
            >
              <Store className="h-4 w-4" /> Agents
            </button>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={activeTab === "crew" ? "Search crew" : "Search agents"}
              className="h-10 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-10 pr-4 text-sm outline-none focus:border-[#7A1D1B]"
            />
          </div>
        </div>

        {activeTab === "crew" && (
          <div className="mt-4 flex flex-wrap gap-2">
            {["all", "driver", "conductor"].map((role) => (
              <button key={role} type="button" onClick={() => setRoleFilter(role)} className={`rounded-lg border px-3 py-1.5 text-xs font-bold capitalize ${roleFilter === role ? "border-[#7A1D1B] bg-[#7A1D1B] text-white" : "border-neutral-200 text-neutral-600"}`}>
                {role === "all" ? "All roles" : `${role}s`}
              </button>
            ))}
            {["all", "available", "on_duty", "invited", "off_duty"].map((status) => (
              <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`rounded-lg border px-3 py-1.5 text-xs font-bold capitalize ${statusFilter === status ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 text-neutral-600"}`}>
                {status.replace("_", " ")}
              </button>
            ))}
          </div>
        )}
      </section>

      <StaffSummaryKpis summary={EMPTY_SUMMARY} partnerAgentsCount={0} />

      {activeTab === "crew" ? (
        <CrewMembersList
          staff={[]}
          searchQuery={searchQuery}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          onOpenAddModal={() => undefined}
          onStatusChange={() => undefined}
          onRemoveStaff={() => undefined}
          actionsDisabled
        />
      ) : (
        <AgentCountersList searchQuery={searchQuery} />
      )}
    </div>
  );
}

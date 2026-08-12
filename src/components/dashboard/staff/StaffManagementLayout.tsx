"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  PlusCircle,
  RefreshCw,
  Store,
  Truck,
  Filter,
} from "lucide-react";
import {
  StaffMember,
  OperatorBrandOption,
  StaffSummaryStats,
  StaffOperationalStatus,
} from "./staff-contract";
import {
  fetchMyStaff,
  updateStaffOperationalStatus,
  removeStaffMember,
} from "./staff-api";
import StaffSummaryKpis from "./StaffSummaryKpis";
import CrewMembersList from "./CrewMembersList";
import AgentCountersList from "./AgentCountersList";
import AddCrewModal from "./AddCrewModal";

type ActiveTab = "crew" | "agents";

export default function StaffManagementLayout() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("crew");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [brands, setBrands] = useState<OperatorBrandOption[]>([]);
  const [summary, setSummary] = useState<StaffSummaryStats>({
    totalStaff: 0,
    driversCount: 0,
    conductorsCount: 0,
    activeCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMyStaff();
      setStaff(data.staff || []);
      setBrands(data.brands || []);
      setSummary(
        data.summary || {
          totalStaff: data.staff?.length || 0,
          driversCount: data.staff?.filter((s) => s.role === "driver").length || 0,
          conductorsCount: data.staff?.filter((s) => s.role === "conductor").length || 0,
          activeCount:
            data.staff?.filter((s) => s.status === "AVAILABLE" || s.status === "ON_DUTY").length || 0,
        }
      );
    } catch (err: unknown) {
      console.error("Failed to load staff:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleStatusChange = async (
    staffId: string,
    role: "driver" | "conductor",
    status: StaffOperationalStatus
  ) => {
    try {
      await updateStaffOperationalStatus(staffId, role, status);
      setFeedback({ type: "success", message: "Staff status updated successfully." });
      loadStaff();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update staff status.",
      });
    }
  };

  const handleRemoveStaff = async (userId: string, role: "driver" | "conductor") => {
    if (!confirm(`Are you sure you want to remove this ${role} from your fleet?`)) return;

    try {
      await removeStaffMember(userId, role);
      setFeedback({ type: "success", message: `${role === "driver" ? "Driver" : "Conductor"} removed from fleet.` });
      loadStaff();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to remove staff member.",
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8">
      {/* Top Header Card */}
      <div className="bg-white rounded-[24px] border border-neutral-100 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-neutral-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[#7A1D1B] shrink-0 shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-[24px] font-bold text-neutral-900 leading-tight">
                Agent &amp; Staff Management
              </h1>
              <p className="text-[14px] text-neutral-500 mt-1">
                Manage bus drivers, conductors, trip assignments, and partner counter networks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadStaff}
              className="p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 transition-colors"
              title="Refresh staff list"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 h-11 px-5 bg-[#7A1D1B] hover:bg-[#5C1414] text-white text-[13px] font-bold rounded-xl transition-all shadow-sm shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Crew Member</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher & Filters */}
        <div className="pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Segmented Control Tabs */}
          <div className="flex items-center p-1 bg-neutral-100 rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => setActiveTab("crew")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                activeTab === "crew"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Crew Members (Drivers &amp; Conductors)</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] bg-neutral-200/60 text-neutral-700">
                {summary.totalStaff}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("agents")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                activeTab === "agents"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Partner Ticketing Counters</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] bg-neutral-200/60 text-neutral-700">
                6
              </span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, license..."
              className="w-full h-10 pl-10 pr-4 bg-neutral-50 rounded-xl border border-neutral-200 text-[13px] font-medium text-neutral-900 outline-none focus:border-[#7A1D1B] transition-all placeholder:text-neutral-400"
            />
          </div>
        </div>

        {/* Role & Status Filter Chips (For Crew tab) */}
        {activeTab === "crew" && (
          <div className="pt-4 flex flex-wrap items-center gap-2 border-t border-neutral-100 mt-4">
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-neutral-400 uppercase mr-2">
              <Filter className="w-3.5 h-3.5" />
              <span>Role:</span>
            </div>
            {["all", "driver", "conductor"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-lg text-[12px] font-bold transition-all capitalize ${
                  roleFilter === r
                    ? "bg-[#7A1D1B] text-white shadow-xs"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border border-neutral-200"
                }`}
              >
                {r === "all" ? "All Roles" : `${r}s`}
              </button>
            ))}

            <div className="h-4 w-px bg-neutral-200 mx-2" />

            <div className="flex items-center gap-1.5 text-[12px] font-bold text-neutral-400 uppercase mr-2">
              <span>Status:</span>
            </div>
            {[
              { id: "all", label: "All Statuses" },
              { id: "available", label: "Available" },
              { id: "on_duty", label: "On Trip" },
              { id: "invited", label: "Invited" },
              { id: "off_duty", label: "Off Duty" },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatusFilter(s.id)}
                className={`px-3 py-1 rounded-lg text-[12px] font-bold transition-all ${
                  statusFilter === s.id
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border border-neutral-200"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-[13px] font-medium border flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <StaffSummaryKpis summary={summary} />

      {/* Main Tab Content */}
      {activeTab === "crew" ? (
        <CrewMembersList
          staff={staff}
          searchQuery={searchQuery}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onStatusChange={handleStatusChange}
          onRemoveStaff={handleRemoveStaff}
        />
      ) : (
        <AgentCountersList searchQuery={searchQuery} />
      )}

      {/* Add Crew Modal */}
      <AddCrewModal
        isOpen={isAddModalOpen}
        brands={brands}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadStaff}
      />
    </div>
  );
}

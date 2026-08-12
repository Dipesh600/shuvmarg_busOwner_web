"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bus,
  Search,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  FileCheck2,
  Plus,
} from "lucide-react";
import BusesEmptyState from "@/components/dashboard/buses/BusesEmptyState";
import FleetRegistrationModal from "@/components/dashboard/buses/FleetRegistrationModal";
import { fetchOperatorDashboardState } from "@/features/operator-dashboard/operator-dashboard-api";
import {
  OperatorDashboardState,
  OperatorFleetListItem,
} from "@/features/operator-dashboard/operator-dashboard-contract";

export default function FleetBusesPage() {
  const [dashboardState, setDashboardState] = useState<OperatorDashboardState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  const loadFleetState = async () => {
    setIsLoading(true);
    try {
      const data = await fetchOperatorDashboardState();
      setDashboardState(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchOperatorDashboardState()
      .then((data) => {
        if (isMounted) setDashboardState(data);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const fleetItems: OperatorFleetListItem[] = dashboardState?.fleet?.items || [];
  const verificationStatus = dashboardState?.verificationStatus || "not_submitted";

  const filteredBuses = fleetItems.filter(
    (b) =>
      b.busNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.busName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.fleetCode && b.fleetCode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const approvedCount = fleetItems.filter(
    (b) => String(b.approvalStatus || "").toUpperCase() === "APPROVED"
  ).length;

  const pendingCount = fleetItems.filter(
    (b) => String(b.approvalStatus || "").toUpperCase() === "PENDING"
  ).length;

  const canRegisterFleet = verificationStatus === "approved";

  return (
    <div className="max-w-6xl mx-auto w-full">
      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-72 bg-white rounded-[28px] border border-[#E8E1DB]" />
        </div>
      ) : fleetItems.length === 0 ? (
        /* Empty State: Single Cohesive Dominant Visual Screen */
        <BusesEmptyState
          verificationStatus={verificationStatus}
          onRegisterFleet={() => setIsRegistrationOpen(true)}
        />
      ) : (
        /* If buses exist: Real Fleet Inventory */
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-3xl border border-[#E8E1DB] p-6 sm:p-8 shadow-2xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF1EE] text-[#7A1D1B] flex items-center justify-center shrink-0">
                  <Bus className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#191512] font-display">
                    My Buses
                  </h1>
                  <p className="text-xs sm:text-sm text-[#746E69] mt-0.5 font-medium">
                    {fleetItems.length} {fleetItems.length === 1 ? "bus" : "buses"} registered · {approvedCount} approved on road
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRegistrationOpen(true)}
                disabled={!canRegisterFleet}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] px-4 text-xs font-bold text-white transition hover:bg-[#5C1414] disabled:cursor-not-allowed disabled:bg-[#E8E1DB] disabled:text-[#817A74]"
              >
                <Plus className="h-4 w-4" />
                <span>Register bus</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-[#E8E1DB] p-5 shadow-2xs flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E8E1DB] flex items-center justify-center text-[#7A1D1B]">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#191512] font-mono">
                  {fleetItems.length}
                </div>
                <div className="text-[11px] font-bold text-[#817A74] uppercase tracking-wider">
                  Total Registered
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8E1DB] p-5 shadow-2xs flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#191512] font-mono">
                  {approvedCount}
                </div>
                <div className="text-[11px] font-bold text-[#817A74] uppercase tracking-wider">
                  Approved &amp; Active
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8E1DB] p-5 shadow-2xs flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-800">
                <Clock3 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#191512] font-mono">
                  {pendingCount}
                </div>
                <div className="text-[11px] font-bold text-[#817A74] uppercase tracking-wider">
                  Under Verification
                </div>
              </div>
            </div>
          </div>

          {/* Registered Buses Grid */}
          <div className="bg-white rounded-3xl border border-[#E8E1DB] p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E1DB]">
              <h2 className="text-base font-bold text-[#191512]">
                Registered Vehicles
              </h2>

              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search plate or bus name..."
                  className="w-full h-10 pl-10 pr-4 bg-[#FAF8F5] rounded-xl border border-[#E8E1DB] text-xs font-medium text-[#191512] outline-none focus:border-[#7A1D1B] transition-all"
                />
              </div>
            </div>

            {filteredBuses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBuses.map((bus) => {
                  const status = String(bus.approvalStatus || "DRAFT").toUpperCase();
                  const isApproved = status === "APPROVED";
                  const isPending = status === "PENDING";
                  const isRejected = status === "REJECTED";

                  return (
                    <Link
                      key={bus.fleetId}
                      href={`/dashboard/fleet/${bus.fleetId}`}
                      className="p-5 rounded-2xl border border-[#E8E1DB] bg-[#FAF8F5]/60 hover:bg-[#FAF8F5] transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white border border-[#E8E1DB] text-[#191512]">
                            {bus.busNumber}
                          </span>
                          <h3 className="text-sm font-bold text-[#191512] mt-2">
                            {bus.busName}
                          </h3>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            isApproved
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isPending
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : isRejected
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-neutral-100 text-neutral-600 border-neutral-200"
                          }`}
                        >
                          {status}
                        </span>
                      </div>

                      {bus.rejectionReason && (
                        <div className="p-2.5 bg-red-50 text-red-700 rounded-xl text-xs font-medium border border-red-200 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{bus.rejectionReason}</span>
                        </div>
                      )}

                      <div className="pt-3 border-t border-[#E8E1DB] flex items-center justify-between text-xs text-[#746E69] font-medium">
                        <div className="flex items-center gap-1">
                          <FileCheck2 className="w-3.5 h-3.5 text-neutral-400" />
                          <span>
                            {bus.documentSummary?.present || 0}/
                            {bus.documentSummary?.totalSlots || 3} Documents
                          </span>
                        </div>

                        <span className="text-[11px] text-[#817A74]">
                          {bus.fleetCode || "Fleet"}
                        </span>
                      </div>
                      <span className="block text-right text-[11px] font-bold text-[#7A1D1B]">Open fleet workstation →</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-[#746E69]">
                No buses match your search &ldquo;{searchQuery}&rdquo;.
              </div>
            )}
          </div>
        </div>
      )}

      <FleetRegistrationModal
        open={isRegistrationOpen}
        onClose={() => setIsRegistrationOpen(false)}
        onRegistered={loadFleetState}
      />
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { OperatorDashboardState } from "@/features/operator-dashboard/operator-dashboard-contract";
import { fetchOperatorDashboardState } from "@/features/operator-dashboard/operator-dashboard-api";
import SetupProgressPanel from "@/components/operator-dashboard/SetupProgressPanel";
import OperationalReadiness from "@/components/operator-dashboard/OperationalReadiness";
import BusinessVerificationCard from "@/components/operator-dashboard/BusinessVerificationCard";
import FleetEmptyState from "@/components/operator-dashboard/FleetEmptyState";
import LockedOperationsPreview from "@/components/operator-dashboard/LockedOperationsPreview";
import OperatorSupportCard from "@/components/operator-dashboard/OperatorSupportCard";

export default function DashboardPage() {
  const [state, setState] = useState<OperatorDashboardState>({
    isLoading: true,
    error: null,
    profile: null,
    kycStatus: null,
    verificationStatus: "not_submitted",
    evidence: {
      accountCreated: true,
      businessProfileComplete: false,
      businessVerificationStatus: "not_submitted",
      settlementAccountPresent: false,
      firstVehicleStatus: "unknown",
      fleetVerificationStatus: "unknown",
      operationalActivationStatus: "unknown",
    },
    capabilities: {
      canManageBusiness: true,
      canPrepareFleet: true,
      canManageRoutes: false,
      canManageTrips: false,
      canViewBookings: false,
      canViewFinance: false,
      canViewReports: false,
    },
  });

  const loadDashboard = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await fetchOperatorDashboardState();
      setState(data);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load dashboard data.";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (state.isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-[#7A1D1B] border-t-transparent rounded-full animate-spin" />
        <div className="text-xs font-semibold text-neutral-500">
          Loading operator setup status...
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-4 bg-white rounded-2xl border border-neutral-200 shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="max-w-md space-y-1">
          <h3 className="text-base font-bold text-neutral-900">
            Unable to load dashboard
          </h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            {state.error}
          </p>
        </div>
        <button
          onClick={loadDashboard}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7A1D1B] hover:bg-[#5C1414] text-white text-xs font-semibold transition-colors shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry loading</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Primary Setup-Progress Surface */}
      <SetupProgressPanel
        evidence={state.evidence}
        verificationStatus={state.verificationStatus}
      />

      {/* 2. Operational Readiness Map */}
      <OperationalReadiness verificationStatus={state.verificationStatus} />

      {/* 3. Business Verification Card & Fleet Empty State */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BusinessVerificationCard
          kycStatus={state.kycStatus}
          verificationStatus={state.verificationStatus}
          rejectionReason={state.profile?.rejectionReason}
        />
        <FleetEmptyState verificationStatus={state.verificationStatus} />
      </div>

      {/* 4. Locked Operations Preview */}
      <LockedOperationsPreview />

      {/* 5. Operator Support Card */}
      <OperatorSupportCard />
    </div>
  );
}

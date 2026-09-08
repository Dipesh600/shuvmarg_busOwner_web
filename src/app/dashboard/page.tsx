"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardGreeting from "@/components/operator-dashboard/DashboardGreeting";
import SetupProgressPanel from "@/components/operator-dashboard/SetupProgressPanel";
import BusinessVerificationCard from "@/components/operator-dashboard/BusinessVerificationCard";
import OperationalReadiness from "@/components/operator-dashboard/OperationalReadiness";
import FleetEmptyState from "@/components/operator-dashboard/FleetEmptyState";
import LockedOperationsPreview from "@/components/operator-dashboard/LockedOperationsPreview";
import OperatorSupportCard from "@/components/operator-dashboard/OperatorSupportCard";
import FirstLoginOverview from "@/components/operator-dashboard/FirstLoginOverview";
import {
  findApprovedFleetAwaitingOperationsById,
  findFirstApprovedFleetAwaitingOperations,
  isFirstLoginOverview,
  OperatorDashboardState,
} from "@/features/operator-dashboard/operator-dashboard-contract";
import { fetchOperatorDashboardState } from "@/features/operator-dashboard/operator-dashboard-api";
import { AlertCircle, RefreshCw } from "lucide-react";
import FirstFleetOperationsSetup from "@/components/operator-dashboard/FirstFleetOperationsSetup";

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Failed to load dashboard status";
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<OperatorDashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestedSetupFleetId = typeof window === "undefined"
    ? null
    : new URLSearchParams(window.location.search).get("setupFleet");

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const state = await fetchOperatorDashboardState();
      setData(state);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    fetchOperatorDashboardState()
      .then((state) => {
        if (isMounted) setData(state);
      })
      .catch((err: unknown) => {
        if (isMounted) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse py-4">
        <div className="h-14 bg-white rounded-2xl w-2/3 border border-[#EEE8E2]" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-72 bg-white rounded-3xl border border-[#EEE8E2]" />
          <div className="lg:col-span-5 h-72 bg-white rounded-3xl border border-[#EEE8E2]" />
        </div>
        <div className="h-44 bg-white rounded-3xl border border-[#EEE8E2]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 bg-white rounded-3xl border border-[#EEE8E2]" />
          <div className="h-48 bg-white rounded-3xl border border-[#EEE8E2]" />
          <div className="h-48 bg-white rounded-3xl border border-[#EEE8E2]" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-3xl border border-red-200 p-8 text-center space-y-4 max-w-lg mx-auto my-12 shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#161311]">
            Unable to Load Dashboard
          </h2>
          <p className="text-xs text-[#746E69]">
            {error || "An unexpected error occurred while fetching account data."}
          </p>
        </div>
        <button
          onClick={loadDashboard}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7A1D1B] text-white font-semibold text-xs hover:bg-[#5C1414] transition-colors shadow-2xs"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  const { profile, verificationStatus, evidence } = data;
  const ownerName = profile?.profile?.name || null;
  const requestedApprovedFleetAwaitingOperations = findApprovedFleetAwaitingOperationsById(data, requestedSetupFleetId);
  const approvedFleetAwaitingOperations =
    requestedApprovedFleetAwaitingOperations || findFirstApprovedFleetAwaitingOperations(data);
  const approvedFleetSetup = approvedFleetAwaitingOperations
    ? data.fleetSetupStatusesByFleetId[approvedFleetAwaitingOperations.fleetId] || null
    : null;

  if (isFirstLoginOverview(data)) {
    return <FirstLoginOverview state={data} initialOperationsFleetId={requestedSetupFleetId} />;
  }

  return (
    <div className="space-y-8">
      {/* 1. Welcome Greeting Row */}
      <DashboardGreeting ownerName={ownerName} />

      {/* 2. Primary 2-Column Desktop Row (~65% / ~35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex">
          <div className="w-full">
            <SetupProgressPanel
              evidence={evidence}
              verificationStatus={verificationStatus}
            />
          </div>
        </div>
        <div className="lg:col-span-5 flex">
          <div className="w-full">
            <BusinessVerificationCard
              kycStatus={data.kycStatus}
              verificationStatus={verificationStatus}
              rejectionReason={data.kycStatus?.rejectionReason || data.profile?.rejectionReason}
            />
          </div>
        </div>
      </div>

      {/* 3. First booking journey row */}
      <OperationalReadiness
        verificationStatus={verificationStatus}
        fleets={data.fleet.items}
        setupStatusesByFleetId={data.fleetSetupStatusesByFleetId}
      />

      {approvedFleetAwaitingOperations && approvedFleetSetup && (
        <FirstFleetOperationsSetup
          fleet={approvedFleetAwaitingOperations}
          setup={approvedFleetSetup}
          eyebrow="Approved bus awaiting launch"
          onBackToBuses={() => router.push("/dashboard/fleet")}
        />
      )}

      {/* 4. Bottom Workspace Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FleetEmptyState verificationStatus={verificationStatus} />
        <div className="md:col-span-1">
          <OperatorSupportCard />
        </div>
        <div className="md:col-span-1">
          <div className="bg-white rounded-3xl border border-[#EEE8E2] p-6 shadow-2xs space-y-2 h-full flex flex-col justify-between">
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-[#7A1D1B] uppercase tracking-wider">
                Platform Notice
              </div>
              <h4 className="text-sm font-bold text-[#161311]">
                Real setup status
              </h4>
              <p className="text-xs text-[#746E69] leading-relaxed">
                This dashboard only shows what is already approved or ready. More tools unlock as each step is completed.
              </p>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono">
              Status: Live account view
            </div>
          </div>
        </div>
      </div>

      {/* Coming-up tools row */}
      <LockedOperationsPreview />
    </div>
  );
}

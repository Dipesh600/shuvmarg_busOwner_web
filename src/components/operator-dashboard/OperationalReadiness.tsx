"use client";

import React from "react";
import { CheckCircle2, Clock, Lock, ShieldAlert } from "lucide-react";
import { OperatorFleetListItem, VerificationStatus } from "@/features/operator-dashboard/operator-dashboard-contract";

interface OperationalReadinessProps {
  verificationStatus: VerificationStatus;
  fleets?: OperatorFleetListItem[];
}

export default function OperationalReadiness({
  verificationStatus,
  fleets = [],
}: OperationalReadinessProps) {
  let businessState: "complete" | "in_progress" | "not_started" = "not_started";
  if (verificationStatus === "approved") {
    businessState = "complete";
  } else if (verificationStatus === "pending" || verificationStatus === "rejected") {
    businessState = "in_progress";
  }

  const fleetStatuses = fleets.map((fleet) => String(fleet.approvalStatus || "DRAFT").toUpperCase());
  const fleetState = fleetStatuses.includes("APPROVED")
    ? "complete"
    : fleetStatuses.includes("PENDING")
      ? "in_review"
      : fleetStatuses.includes("REJECTED")
        ? "action_required"
        : fleetStatuses.length > 0
          ? "in_progress"
          : verificationStatus === "approved" ? "not_started" : "locked";

  const stages = [
    {
      id: "business",
      number: "1",
      label: "Business Verification",
      description: "Company registration & owner KYC approval",
      status: businessState,
    },
    {
      id: "fleet",
      number: "2",
      label: "Fleet Registration",
      description: "Vehicle bluebooks, capacity & seat maps",
      status: fleetState,
    },
    {
      id: "route",
      number: "3",
      label: "Route & Schedule",
      description: "Stops, departure times & base fares",
      status: fleetState === "complete" ? "not_started" : "locked",
    },
    {
      id: "golive",
      number: "4",
      label: "Go Live",
      description: "Publish schedules & sell tickets",
      status: "locked",
    },
  ];

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "complete":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2E7D32]">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F59E0B]">
            <Clock className="w-3.5 h-3.5" /> In progress
          </span>
        );
      case "in_review":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
            <Clock className="w-3.5 h-3.5" /> In review
          </span>
        );
      case "action_required":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700">
            <ShieldAlert className="w-3.5 h-3.5" /> Action required
          </span>
        );
      case "not_started":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#746E69]">
            <ShieldAlert className="w-3.5 h-3.5 text-neutral-400" /> Not started
          </span>
        );
      case "locked":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-400">
            <Lock className="w-3.5 h-3.5 text-neutral-400" /> Locked
          </span>
        );
    }
  };

  return (
    <section className="bg-white rounded-3xl border border-[#EEE8E2] p-6 sm:p-7 shadow-2xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#EEE8E2]">
        <div>
          <h3
            className="text-lg font-bold text-[#161311]"
            style={{ fontFamily: '"Neue Machina", system-ui, sans-serif' }}
          >
            Operational Readiness Sequence
          </h3>
          <p className="text-xs text-[#746E69] mt-0.5 font-medium">
            Each stage unlocks sequentially as prerequisites are verified.
          </p>
        </div>
        <div className="text-[11px] font-semibold text-[#746E69] bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#EEE8E2] self-start sm:self-auto">
          Prerequisite Enforced
        </div>
      </div>

      {/* Grid Sequence */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className={`p-4.5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
              stage.status === "complete"
                ? "bg-emerald-50/40 border-emerald-200"
                : stage.status === "in_progress" || stage.status === "in_review"
                ? "bg-amber-50/40 border-amber-200"
                : stage.status === "action_required"
                ? "bg-red-50/40 border-red-200"
                : stage.status === "not_started"
                ? "bg-white border-[#EEE8E2]"
                : "bg-[#FAF8F5]/80 border-[#EEE8E2]/80 opacity-75"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                    stage.status === "complete"
                      ? "bg-[#2E7D32] text-white"
                      : stage.status === "in_progress" || stage.status === "in_review"
                      ? "bg-[#F59E0B] text-white"
                      : stage.status === "action_required"
                      ? "bg-red-600 text-white"
                      : "bg-[#EEE8E2] text-[#746E69]"
                  }`}
                >
                  {stage.number}
                </div>
                {renderStatusBadge(stage.status)}
              </div>
              <h4 className="text-sm font-bold text-[#161311] mb-1">
                {stage.label}
              </h4>
              <p className="text-xs text-[#746E69] leading-relaxed font-medium">
                {stage.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

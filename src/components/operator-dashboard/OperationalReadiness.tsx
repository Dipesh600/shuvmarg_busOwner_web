"use client";

import React from "react";
import { CheckCircle2, Clock, Lock, ShieldAlert, ArrowRight } from "lucide-react";
import { VerificationStatus } from "@/features/operator-dashboard/operator-dashboard-contract";

interface OperationalReadinessProps {
  verificationStatus: VerificationStatus;
}

export default function OperationalReadiness({
  verificationStatus,
}: OperationalReadinessProps) {
  let businessState: "complete" | "in_progress" | "not_started" = "not_started";
  if (verificationStatus === "approved") {
    businessState = "complete";
  } else if (verificationStatus === "pending" || verificationStatus === "rejected") {
    businessState = "in_progress";
  }

  const stages = [
    {
      id: "business",
      number: "1",
      label: "Business Verification",
      description: "Company registration & KYC approval",
      status: businessState,
    },
    {
      id: "fleet",
      number: "2",
      label: "Fleet Registration",
      description: "Bus bluebooks, capacity & seat maps",
      status: verificationStatus === "approved" ? "not_started" : "locked",
    },
    {
      id: "route",
      number: "3",
      label: "Route & Schedule",
      description: "Stops, departure times & base fares",
      status: "locked",
    },
    {
      id: "golive",
      number: "4",
      label: "Go Live",
      description: "Sell tickets across Shuvmarg passenger web & app",
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
      case "not_started":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-500">
            <ShieldAlert className="w-3.5 h-3.5 text-neutral-400" /> Not started
          </span>
        );
      case "locked":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-400">
            <Lock className="w-3.5 h-3.5" /> Locked
          </span>
        );
    }
  };

  return (
    <section className="bg-white rounded-xl border border-neutral-200 p-6 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-neutral-100">
        <div>
          <h3
            className="text-lg font-bold text-neutral-900"
            style={{ fontFamily: '"Neue Machina", system-ui, sans-serif' }}
          >
            Operational Readiness Sequence
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Each stage unlocks sequentially as prerequisites are verified.
          </p>
        </div>
        <div className="text-[11px] font-medium text-neutral-500 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200 self-start sm:self-auto">
          Prerequisite Enforced
        </div>
      </div>

      {/* Grid Sequence */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
        {stages.map((stage, idx) => (
          <div
            key={stage.id}
            className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
              stage.status === "complete"
                ? "bg-emerald-50/40 border-emerald-200/80"
                : stage.status === "in_progress"
                ? "bg-amber-50/40 border-amber-200/80"
                : stage.status === "not_started"
                ? "bg-white border-neutral-200"
                : "bg-neutral-50 border-neutral-200/60 opacity-75"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    stage.status === "complete"
                      ? "bg-[#2E7D32] text-white"
                      : stage.status === "in_progress"
                      ? "bg-[#F59E0B] text-white"
                      : "bg-neutral-200 text-neutral-700"
                  }`}
                >
                  {stage.number}
                </div>
                {renderStatusBadge(stage.status)}
              </div>
              <h4 className="text-sm font-bold text-neutral-900 mb-1">
                {stage.label}
              </h4>
              <p className="text-xs text-neutral-500 leading-normal">
                {stage.description}
              </p>
            </div>

            {idx < stages.length - 1 && (
              <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-neutral-300 pointer-events-none">
                {/* Visual Connector icon if desired */}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

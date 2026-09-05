import React from "react";
import { CheckCircle, ShieldAlert } from "lucide-react";
import { StaffOperationalStatus } from "./staff-contract";

interface StaffStatusBadgeProps {
  status: StaffOperationalStatus | string;
}

export default function StaffStatusBadge({
  status,
}: StaffStatusBadgeProps) {
  const normStatus = String(status || "").toUpperCase();

  switch (normStatus) {
    case "AVAILABLE":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-200">
          <CheckCircle className="w-3 h-3" />
          <span>Available</span>
        </span>
      );
    case "ON_DUTY":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
          <span>On Trip</span>
        </span>
      );
    case "OFF_DUTY":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-600 border border-neutral-200">
          <span>Off Duty</span>
        </span>
      );
    case "INACTIVE":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-500 border border-neutral-200">
          <span>Inactive</span>
        </span>
      );
    case "SUSPENDED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
          <ShieldAlert className="w-3 h-3" />
          <span>Suspended</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-600 border border-neutral-200">
          <span>{normStatus}</span>
        </span>
      );
  }
}

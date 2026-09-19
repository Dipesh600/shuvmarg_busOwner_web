"use client";

import React from "react";
import { BusFront, Plus } from "lucide-react";
import type { StaffMember } from "../staff-contract";

interface CrewCurrentAssignmentCardProps {
  staff: StaffMember;
  onAssignBus: () => void;
}

export function CrewCurrentAssignmentCard({
  staff,
  onAssignBus,
}: CrewCurrentAssignmentCardProps) {
  const isDriver = staff.role === "driver";
  const isAvailable = staff.status === "AVAILABLE";

  const hasAssignedBus = Boolean(
    staff.assignedBusNumber ||
    staff.assignedBusName ||
    (staff.allowedVehicleIds && staff.allowedVehicleIds.length > 0)
  );

  let busTitle = "No bus assigned";
  let busSubtitle = `This ${isDriver ? "driver" : "conductor"} is available to be assigned to an operating bus.`;

  if (staff.assignedBusNumber) {
    busTitle = `${staff.assignedBusNumber}${staff.assignedBusName ? ` · ${staff.assignedBusName}` : ""}`;
    busSubtitle = `Assigned vehicle · Active ${isDriver ? "driver" : "conductor"}`;
  } else if (staff.vehicleScope === "ANY_VEHICLE" && isAvailable) {
    busTitle = "All fleet vehicles";
    busSubtitle = "Authorized to operate any vehicle under this operator brand";
  } else if (staff.allowedVehicleIds && staff.allowedVehicleIds.length > 0) {
    busTitle = `Vehicle #${staff.allowedVehicleIds[0].slice(-6).toUpperCase()}`;
    busSubtitle = `Assigned ${isDriver ? "driver" : "conductor"} on this vehicle`;
  }

  return (
    <div
      style={{
        background:
          "radial-gradient(ellipse at 92% 0%, rgba(220, 101, 94, 0.16) 0%, rgba(220, 101, 94, 0.07) 28%, rgba(220, 101, 94, 0.025) 48%, rgba(255, 255, 255, 0) 68%), #ffffff",
      }}
      className="rounded-2xl sm:rounded-3xl border border-[#EDE7E0] p-5 sm:p-6 shadow-xs space-y-4"
    >
      {/* Card Header Strip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#554E48]">
          <BusFront className="size-4 text-[#7A1D1B]" />
          <span>Current Assignment</span>
        </div>

        {/* Duty Status Badge */}
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
            isAvailable
              ? "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]"
              : "bg-[#FAF8F5] text-[#554E48] border-[#EDE7E0]"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${
              isAvailable ? "bg-[#059669]" : "bg-[#746E69]"
            }`}
          />
          <span>{isAvailable ? "Available for duty" : staff.status.replace("_", " ")}</span>
        </span>
      </div>

      {/* Card Body */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl bg-[#FAF8F5]/80 border border-[#EDE7E0]/70">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="size-11 rounded-2xl bg-[#FFF5F4] text-[#7A1D1B] flex items-center justify-center shrink-0 border border-[#F8C9C7]/50">
            <BusFront className="size-5 text-[#7A1D1B]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-[#111111] truncate">
              {busTitle}
            </h3>
            <p className="text-xs text-[#746E69] mt-0.5 truncate">
              {busSubtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAssignBus}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#7A1D1B] px-5 text-xs font-bold text-white shadow-xs transition hover:bg-[#641715] active:scale-[0.98] shrink-0 cursor-pointer"
        >
          <Plus className="size-3.5" />
          <span>{hasAssignedBus ? "Change bus assignment" : "Assign to bus"}</span>
        </button>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { IdCard, Edit2, FileText, CheckCircle2 } from "lucide-react";
import type { StaffMember } from "../staff-contract";

interface CrewDetailsCardProps {
  staff: StaffMember;
  brandName: string;
  onEditDetails: () => void;
  onViewDocuments?: () => void;
}

export function CrewDetailsCard({
  staff,
  brandName,
  onEditDetails,
  onViewDocuments,
}: CrewDetailsCardProps) {
  const isDriver = staff.role === "driver";

  const formattedExpiry = staff.licenseExpiry
    ? new Date(staff.licenseExpiry).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const isConnected = staff.accessStatus === "ACTIVE";

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#EDE7E0] bg-white p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header Strip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#554E48]">
          <IdCard className="size-4 text-[#7A1D1B]" />
          <span>{isDriver ? "Driver Details" : "Conductor Details"}</span>
        </div>

        <button
          type="button"
          onClick={onEditDetails}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-[#EDE7E0] bg-white px-3.5 text-xs font-semibold text-[#191512] shadow-2xs hover:bg-[#FAF8F5] transition cursor-pointer"
        >
          <Edit2 className="size-3 text-[#554E48]" />
          <span>Edit details</span>
        </button>
      </div>

      {/* 2-Column Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-xs">
        {/* Left Column */}
        <div className="space-y-3.5">
          {isDriver && (
            <>
              <div className="flex items-baseline justify-between sm:justify-start sm:gap-8">
                <span className="text-[#746E69] w-28 shrink-0">Driving license</span>
                <span className="font-semibold text-[#111111]">
                  {staff.licenseNumber
                    ? `${staff.licenseNumber} · ${staff.licenseType || "HV"}`
                    : "—"}
                </span>
              </div>

              <div className="flex items-baseline justify-between sm:justify-start sm:gap-8">
                <span className="text-[#746E69] w-28 shrink-0">Valid until</span>
                <span className="font-semibold text-[#111111]">{formattedExpiry}</span>
              </div>

              <div className="flex items-baseline justify-between sm:justify-start sm:gap-8">
                <span className="text-[#746E69] w-28 shrink-0">Experience</span>
                <span className="font-semibold text-[#111111]">
                  {staff.experienceYears ? `${staff.experienceYears} years` : "—"}
                </span>
              </div>
            </>
          )}

          {!isDriver && staff.email && (
            <div className="flex items-baseline justify-between sm:justify-start sm:gap-8">
              <span className="text-[#746E69] w-28 shrink-0">Email</span>
              <span className="font-semibold text-[#111111]">{staff.email}</span>
            </div>
          )}

          <div className="flex items-baseline justify-between sm:justify-start sm:gap-8">
            <span className="text-[#746E69] w-28 shrink-0">Phone</span>
            <span className="font-semibold text-[#111111] font-mono">{staff.phone}</span>
          </div>

          <div className="flex items-baseline justify-between sm:justify-start sm:gap-8">
            <span className="text-[#746E69] w-28 shrink-0">App access</span>
            <span className="font-semibold text-[#111111] inline-flex items-center gap-1.5">
              <span
                className={`size-1.5 rounded-full ${
                  isConnected ? "bg-[#059669]" : "bg-[#D97706]"
                }`}
              />
              <span>{isConnected ? "Connected" : staff.accessStatus === "INVITED" ? "Invited" : "Not connected"}</span>
            </span>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3.5">
          <div className="flex items-baseline justify-between sm:justify-start sm:gap-8">
            <span className="text-[#746E69] w-32 shrink-0">Operator</span>
            <span className="font-semibold text-[#111111]">{brandName}</span>
          </div>

          <div className="flex items-baseline justify-between sm:justify-start sm:gap-8">
            <span className="text-[#746E69] w-32 shrink-0">Emergency contact</span>
            <span className="font-semibold text-[#111111]">
              {staff.emergencyContact || "—"}
            </span>
          </div>

          <div className="flex items-baseline justify-between sm:justify-start sm:gap-8">
            <span className="text-[#746E69] w-32 shrink-0">Address</span>
            <span className="font-semibold text-[#111111]">{staff.address || "—"}</span>
          </div>

          <div className="flex items-baseline justify-between sm:justify-start sm:gap-8">
            <span className="text-[#746E69] w-32 shrink-0">Notes</span>
            <span className="font-semibold text-[#111111]">{staff.notes || "—"}</span>
          </div>
        </div>
      </div>

      {/* Bottom Actions Row */}
      {onViewDocuments && (
        <div className="flex justify-end pt-2 border-t border-[#EDE7E0]">
          <button
            type="button"
            onClick={onViewDocuments}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-[#EDE7E0] bg-white px-3.5 text-xs font-semibold text-[#7A1D1B] shadow-2xs hover:bg-[#FFF5F4] transition cursor-pointer"
          >
            <FileText className="size-3.5 text-[#7A1D1B]" />
            <span>View documents</span>
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import {
  Phone,
  Building,
  UserPlus,
  Shield,
  Truck,
  FileBadge,
} from "lucide-react";
import { StaffMember, StaffOperationalStatus } from "./staff-contract";
import StaffStatusBadge from "./StaffStatusBadge";
import StaffCardActionsMenu from "./StaffCardActionsMenu";

interface CrewMembersListProps {
  staff: StaffMember[];
  searchQuery: string;
  roleFilter: string;
  statusFilter: string;
  onOpenAddModal: () => void;
  onStatusChange: (staffId: string, role: "driver" | "conductor", status: StaffOperationalStatus) => void;
  onRemoveStaff: (userId: string, role: "driver" | "conductor") => void;
  actionsDisabled?: boolean;
}

export default function CrewMembersList({
  staff,
  searchQuery,
  roleFilter,
  statusFilter,
  onOpenAddModal,
  onStatusChange,
  onRemoveStaff,
  actionsDisabled = false,
}: CrewMembersListProps) {
  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      !searchQuery.trim() ||
      member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone.includes(searchQuery) ||
      (member.licenseNumber && member.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole =
      roleFilter === "all" || member.role.toLowerCase() === roleFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "all" ||
      member.status.toLowerCase() === statusFilter.toLowerCase() ||
      (statusFilter === "invited" && member.accountStatus === "invited");

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (staff.length === 0) {
    return (
      <div className="py-16 px-6 text-center bg-white rounded-[24px] border border-neutral-100 shadow-sm max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[#7A1D1B] mx-auto mb-4 shadow-sm">
          <UserPlus className="w-8 h-8" />
        </div>
        <h3 className="text-[18px] font-bold text-neutral-900 mb-1">
          No Crew Members Assigned Yet
        </h3>
        <p className="text-[14px] text-neutral-500 max-w-md mx-auto mb-6">
          Add your licensed bus drivers and conductors to manage trip assignments, verify passenger boarding, and track fleet operations.
        </p>
        <button
          type="button"
          onClick={onOpenAddModal}
          disabled={actionsDisabled}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-neutral-100 px-6 text-[13px] font-bold text-neutral-400"
        >
          <UserPlus className="w-4 h-4" />
          <span>{actionsDisabled ? "Crew onboarding unavailable" : "Add First Crew Member"}</span>
        </button>
      </div>
    );
  }

  if (filteredStaff.length === 0) {
    return (
      <div className="py-12 px-4 text-center bg-white rounded-[24px] border border-neutral-100 shadow-sm">
        <p className="text-[15px] font-bold text-neutral-800 mb-1">
          No crew members matching criteria
        </p>
        <p className="text-[13px] text-neutral-500">
          Try clearing your search or filter tags to see more staff members.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {filteredStaff.map((member) => {
        const isDriver = member.role === "driver";

        return (
          <div
            key={member.id}
            className="bg-white rounded-[24px] border border-neutral-100 p-6 shadow-sm flex flex-col justify-between hover:border-neutral-200 transition-all relative overflow-hidden"
          >
            {/* Top Row: Avatar & Actions */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-[16px] shrink-0 border ${
                      isDriver
                        ? "bg-blue-50 text-blue-800 border-blue-100"
                        : "bg-amber-50 text-amber-800 border-amber-100"
                    }`}
                  >
                    {isDriver ? <Truck className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="text-[16px] font-bold text-neutral-900 leading-tight">
                      {member.fullName}
                    </h4>
                    <span
                      className={`inline-block text-[11px] font-bold uppercase tracking-wider mt-0.5 ${
                        isDriver ? "text-blue-700" : "text-amber-700"
                      }`}
                    >
                      {isDriver ? "Heavy Bus Driver" : "Bus Conductor"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <StaffCardActionsMenu
                    staff={member}
                    onStatusChange={(newStatus) =>
                      onStatusChange(member.id, member.role, newStatus)
                    }
                    onRemove={() => onRemoveStaff(member.userId || member.id, member.role)}
                  />
                </div>
              </div>

              {/* Contact & Brand Info */}
              <div className="space-y-2 py-3 border-t border-b border-neutral-100 my-3 text-[13px]">
                <div className="flex items-center gap-2 text-neutral-700">
                  <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="font-mono font-medium">{member.phone}</span>
                </div>

                <div className="flex items-center gap-2 text-neutral-600">
                  <Building className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate">{member.brand || "Main Fleet"}</span>
                </div>

                {isDriver && member.licenseNumber && (
                  <div className="flex items-center gap-2 text-neutral-600 pt-1">
                    <FileBadge className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="font-mono text-[12px] bg-neutral-100 px-2 py-0.5 rounded text-neutral-800">
                      Lic: {member.licenseNumber}
                    </span>
                    {member.licenseType && (
                      <span className="text-[11px] text-neutral-500 font-semibold uppercase">
                        Cat {member.licenseType}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row: Status Badge */}
            <div className="pt-2 flex items-center justify-between">
              <StaffStatusBadge
                status={member.status}
                accountStatus={member.accountStatus}
              />
              <span className="text-[11px] text-neutral-400">
                {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : ""}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

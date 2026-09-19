"use client";

import React, { useState } from "react";
import type { StaffMember, StaffOperationalStatus } from "../staff-contract";
import { ProfileHeroCard } from "./ProfileHeroCard";
import { CrewCurrentAssignmentCard } from "./CrewCurrentAssignmentCard";
import { CrewUpcomingDeparturesCard } from "./CrewUpcomingDeparturesCard";
import { CrewDetailsCard } from "./CrewDetailsCard";
import CrewVehicleAccessDialog from "../CrewVehicleAccessDialog";
import CrewAssignmentDialog from "../CrewAssignmentDialog";
import { listMyBrands, type OperatorBrand } from "@/features/fleet-registration/api-brands";
import { listOperatorFleets, type FleetListItem } from "@/features/fleet-registration/api";
import { updateCrewStatus, removeCrew } from "@/features/crew-management/api";
import { FileText, X } from "lucide-react";

interface CrewProfileScreenProps {
  staff: StaffMember;
  brandName: string;
  onBack: () => void;
  onStaffUpdated?: () => void;
}

export default function CrewProfileScreen({
  staff,
  brandName,
  onBack,
  onStaffUpdated,
}: CrewProfileScreenProps) {
  const [currentStaff, setCurrentStaff] = useState<StaffMember>(staff);
  const [isAssignBusOpen, setIsAssignBusOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false);
  const [brands, setBrands] = useState<OperatorBrand[]>([]);
  const [fleets, setFleets] = useState<FleetListItem[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  React.useEffect(() => {
    listMyBrands().then(setBrands).catch(() => {});
    listOperatorFleets().then(setFleets).catch(() => {});
  }, []);

  const handleStatusChange = async (newStatus: StaffOperationalStatus) => {
    if (newStatus !== "AVAILABLE" && newStatus !== "OFF_DUTY") return;
    try {
      await updateCrewStatus(currentStaff, newStatus);
      setCurrentStaff((prev) => ({ ...prev, status: newStatus }));
      setFeedback(`Status updated to ${newStatus.replace("_", " ")}`);
      onStaffUpdated?.();
    } catch {
      setFeedback("Unable to update status.");
    }
  };

  const handleRemove = async () => {
    if (!window.confirm(`Are you sure you want to remove ${currentStaff.fullName} from crew access?`)) return;
    try {
      await removeCrew(currentStaff);
      onBack();
      onStaffUpdated?.();
    } catch {
      setFeedback("Unable to remove crew member.");
    }
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* ── Top Hero Profile Card with Back Link ── */}
      <ProfileHeroCard
        name={currentStaff.fullName}
        roleLabel={currentStaff.role === "driver" ? "Driver" : "Conductor"}
        status={currentStaff.status}
        statusLabel={
          currentStaff.status === "AVAILABLE"
            ? "Available"
            : currentStaff.status === "ON_DUTY"
            ? "On Duty"
            : currentStaff.status === "OFF_DUTY"
            ? "Off Duty"
            : currentStaff.status
        }
        code={currentStaff.staffCode}
        codeLabel="Staff ID"
        phone={currentStaff.phone}
        brandName={brandName}
        onBack={onBack}
        onEdit={() => setIsEditOpen(true)}
        onStatusChange={handleStatusChange}
        onRemove={handleRemove}
      />

      {/* ── Current Assignment Card ── */}
      <CrewCurrentAssignmentCard
        staff={currentStaff}
        onAssignBus={() => setIsAssignBusOpen(true)}
      />

      {/* ── Upcoming Departures Card ── */}
      <CrewUpcomingDeparturesCard staff={currentStaff} />

      {/* ── Driver / Conductor Details Card ── */}
      <CrewDetailsCard
        staff={currentStaff}
        brandName={brandName}
        onEditDetails={() => setIsEditOpen(true)}
        onViewDocuments={() => setIsDocumentsOpen(true)}
      />

      {/* ── Vehicle Access Assignment Dialog ── */}
      {isAssignBusOpen && (
        <CrewVehicleAccessDialog
          staff={currentStaff}
          onClose={() => setIsAssignBusOpen(false)}
          onSaved={(msg) => {
            setIsAssignBusOpen(false);
            setFeedback(msg);
            listOperatorFleets().then(setFleets).catch(() => {});
            onStaffUpdated?.();
          }}
        />
      )}

      {/* ── Edit Staff Member Dialog ── */}
      {isEditOpen && (
        <CrewAssignmentDialog
          brands={brands}
          initialRole={currentStaff.role}
          existing={currentStaff}
          onClose={() => setIsEditOpen(false)}
          onSaved={(msg, _warn, result) => {
            setIsEditOpen(false);
            setFeedback(msg);
            if (result) {
              setCurrentStaff((prev) => ({
                ...prev,
                fullName: result.name || prev.fullName,
                phone: result.phone || prev.phone,
                staffCode: result.staffCode || prev.staffCode,
                status: result.profileStatus || prev.status,
                approvalStatus: result.approvalStatus || prev.approvalStatus,
                accessStatus: result.accessStatus || prev.accessStatus,
                invitationDeliveryStatus: result.invitationDeliveryStatus || prev.invitationDeliveryStatus,
              }));
            }
            onStaffUpdated?.();
          }}
        />
      )}

      {/* ── Documents Modal ── */}
      {isDocumentsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl border border-[#EDE7E0] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#EDE7E0] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-[#7A1D1B]" />
                <h3 className="font-bold text-[#111111] text-sm">Staff documents</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDocumentsOpen(false)}
                className="size-7 rounded-full flex items-center justify-center text-[#746E69] hover:bg-[#FAF8F5]"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EDE7E0] flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#111111]">Driving License</p>
                  <p className="text-[11px] text-[#746E69]">{currentStaff.licenseNumber || "License record on file"}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#065F46] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md">
                  Verified
                </span>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsDocumentsOpen(false)}
                className="rounded-full border border-[#EDE7E0] bg-white px-4 py-1.5 text-xs font-semibold text-[#191512] shadow-2xs hover:bg-[#FAF8F5]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Feedback ── */}
      {feedback && (
        <button
          type="button"
          onClick={() => setFeedback(null)}
          className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl bg-[#191512] px-5 py-3.5 text-left text-xs font-semibold text-white shadow-2xl transition hover:bg-[#2A2520] cursor-pointer"
        >
          {feedback}
        </button>
      )}
    </div>
  );
}

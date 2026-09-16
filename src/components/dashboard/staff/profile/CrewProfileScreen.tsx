"use client";

import React from "react";
import { BusFront, UserRoundCheck, Route, AlertTriangle } from "lucide-react";
import type { StaffMember } from "../staff-contract";
import StaffStatusBadge from "../StaffStatusBadge";
import ProfileHeader from "./ProfileHeader";
import ProfileEmptySection from "./ProfileEmptySection";

interface CrewProfileScreenProps {
  staff: StaffMember;
  brandName: string;
  onBack: () => void;
}

export default function CrewProfileScreen({ staff, brandName, onBack }: CrewProfileScreenProps) {
  const isDriver = staff.role === "driver";

  const initials = staff.fullName
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isExpired = Boolean(staff.licenseExpiry && new Date(staff.licenseExpiry).getTime() < Date.now());

  const dutyLabel =
    staff.status === "AVAILABLE"
      ? "Available for duty"
      : staff.status === "ON_DUTY"
      ? "Currently on duty"
      : staff.status === "OFF_DUTY"
      ? "Off duty"
      : staff.status.toLowerCase().replace("_", " ");

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Profile Header */}
      <ProfileHeader
        name={staff.fullName}
        roleLabel={isDriver ? "Driver" : "Conductor"}
        statusBadge={<StaffStatusBadge status={staff.status} />}
        code={staff.staffCode}
        codeLabel="Staff ID"
        brandName={brandName}
        backLabel="Back to Onboard crew"
        onBack={onBack}
        avatarContent={
          initials ? (
            <span>{initials}</span>
          ) : isDriver ? (
            <BusFront className="h-7 w-7 text-[#7A1D1B]" />
          ) : (
            <UserRoundCheck className="h-7 w-7 text-[#7A1D1B]" />
          )
        }
      />

      {/* Quick Metrics — role-specific */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Duty Status</span>
          <span className="mt-1.5 text-base font-bold text-neutral-900 block capitalize">{dutyLabel}</span>
        </div>
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">App Access</span>
          <span className="mt-1.5 text-base font-bold text-neutral-900 block">
            {staff.accessStatus === "ACTIVE"
              ? "Connected"
              : staff.accessStatus === "INVITED"
              ? "Invitation sent"
              : "Not linked"}
          </span>
        </div>
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
            {isDriver ? "Experience" : "Assigned Trips"}
          </span>
          <span className="mt-1.5 text-base font-bold text-neutral-900 block">
            {isDriver
              ? `${staff.experienceYears || 0} year${staff.experienceYears === 1 ? "" : "s"}`
              : `${staff.assignedTrips?.length || 0} trip${staff.assignedTrips?.length === 1 ? "" : "s"}`}
          </span>
        </div>
      </div>

      {/* Identity & Contact */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            {isDriver ? "License & Contact" : "Contact & Assignment"}
          </h3>
        </div>
        <dl className="grid sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-neutral-100">
          <div className="px-6 py-4">
            <dt className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Phone</dt>
            <dd className="mt-1 text-sm font-semibold text-neutral-800 font-mono">{staff.phone}</dd>
          </div>
          <div className="px-6 py-4">
            <dt className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Operator Brand</dt>
            <dd className="mt-1 text-sm font-semibold text-neutral-800">{brandName}</dd>
          </div>
          {isDriver && (
            <>
              <div className="px-6 py-4">
                <dt className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Driving License</dt>
                <dd className="mt-1 text-sm font-semibold text-neutral-800">
                  {staff.licenseNumber || "Not supplied"} {staff.licenseType ? `· ${staff.licenseType}` : ""}
                </dd>
              </div>
              <div className="px-6 py-4">
                <dt className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">License Valid Until</dt>
                <dd className={`mt-1 text-sm font-semibold flex items-center gap-1.5 ${isExpired ? "text-red-700" : "text-neutral-800"}`}>
                  {isExpired && <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
                  {staff.licenseExpiry ? new Date(staff.licenseExpiry).toLocaleDateString() : "Not supplied"}
                  {isExpired && <span className="text-[11px]">(Expired)</span>}
                </dd>
              </div>
            </>
          )}
          {!isDriver && staff.email && (
            <div className="px-6 py-4">
              <dt className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Email</dt>
              <dd className="mt-1 text-sm font-semibold text-neutral-800">{staff.email}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Assigned Trips / Manifests feed */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            {isDriver ? "Assigned Departures" : "Scheduled Manifests"}
          </h3>
          {(staff.assignedTrips?.length ?? 0) > 0 && (
            <span className="rounded-full bg-[#FAF0ED] px-2.5 py-0.5 text-xs font-bold text-[#7A1D1B]">
              {staff.assignedTrips!.length} trip{staff.assignedTrips!.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
        {staff.assignedTrips && staff.assignedTrips.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {staff.assignedTrips.map((trip) => (
              <div key={trip.id} className="px-6 py-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-neutral-900">{trip.route?.name || "Scheduled route"}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {trip.tripDate} &middot; {trip.departureTime}
                  </p>
                </div>
                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-700">
                  {trip.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <ProfileEmptySection
            icon={Route}
            title={isDriver ? "No departures assigned" : "No manifests scheduled"}
            description={
              isDriver
                ? "When this driver is added to bus departures, their route schedule and trip history will appear here."
                : "When this conductor is assigned to trips, passenger manifests and boarding runs will appear here."
            }
          />
        )}
      </div>
    </div>
  );
}

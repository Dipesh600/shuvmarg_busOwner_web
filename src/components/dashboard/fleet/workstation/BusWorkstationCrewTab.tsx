"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  BusFront,
  IdCard,
  Loader2,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import {
  listVehicleCrewOptions,
  type CanonicalCurrentCrew,
  type VehicleCrewOption,
} from "@/features/crew-management/api";
import type { OperatorFleetListItem } from "@/features/operator-dashboard/operator-dashboard-contract";
import type { FleetDetailPayload } from "@/features/fleet-registration/api";
import { listMyBrands, type OperatorBrand } from "@/features/fleet-registration/api-brands";
import type { StaffRole } from "@/components/dashboard/staff/staff-contract";
import { BusWorkstationCrewRotationModal } from "./BusWorkstationCrewRotationModal";
import CrewAssignmentDialog from "@/components/dashboard/staff/CrewAssignmentDialog";

interface BusWorkstationCrewTabProps {
  fleet: OperatorFleetListItem;
  fleetId: string;
  detail?: FleetDetailPayload | null;
}

const readable = (value?: string | null) =>
  value ? value.replaceAll("_", " ") : "Not recorded";

const dateText = (value?: string | null) => {
  if (!value) return "Not recorded";
  const d = new Date(value);
  return isNaN(d.getTime())
    ? "Not recorded"
    : d.toLocaleDateString("en-NP", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

function formatIssueCode(code?: string | null): string {
  switch (code) {
    case "PROFILE_NOT_FOUND":
      return "Profile not found";
    case "PROFILE_REMOVED":
      return "Profile removed from brand";
    case "CROSS_BRAND_ASSIGNMENT":
      return "Cross-brand assignment conflict";
    case "LEGACY_CONFLICT":
      return "Conflict with active assignment";
    default:
      return code ? code.replaceAll("_", " ") : "Assignment issue";
  }
}

function CurrentCrewCard({
  role,
  current,
  loading,
  error,
  onRetry,
  onChange,
}: {
  role: StaffRole;
  current: CanonicalCurrentCrew | null;
  loading: boolean;
  error?: string | null;
  onRetry: () => void;
  onChange: () => void;
}) {
  const Icon = role === "driver" ? UserRoundCheck : UsersRound;
  const label = role === "driver" ? "Driver" : "Conductor";

  return (
    <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-[#EDE7E0] bg-white shadow-2xs">
      {/* Card Header */}
      <div className="border-b border-[#EDE7E0] bg-[#FAF8F5] px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#7A1D1B]/10 text-[#7A1D1B]">
              <Icon className="size-5" />
            </span>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#746E69]">
                Current assignment
              </p>
              <h3 className="text-sm font-black text-[#191512]">{label}</h3>
            </div>
          </div>
          {current?.status === "ASSIGNED" && (
            <span className="rounded-full border border-[#EDE7E0] bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[#554E48]">
              Rotatable
            </span>
          )}
          {current?.status === "REQUIRES_ATTENTION" && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-amber-700">
              Attention required
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5">
        {loading && !current ? (
          <div className="flex min-h-36 items-center justify-center gap-2 text-xs font-bold text-[#746E69]">
            <Loader2 className="size-5 animate-spin text-[#7A1D1B]" />
            <span>Loading current {label.toLowerCase()}…</span>
          </div>
        ) : !current && error ? (
          <div className="flex min-h-32 items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertCircle className="size-5 shrink-0 text-red-600" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 inline-flex h-7 items-center rounded-lg border border-red-300 bg-white px-3 text-xs font-bold text-red-800 hover:bg-red-50 transition cursor-pointer"
              >
                Retry
              </button>
            </div>
          </div>
        ) : current?.status === "REQUIRES_ATTENTION" ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-950">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-wider text-amber-700">
                    {formatIssueCode(current.issueCode)}
                  </p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-amber-900">
                    {current.issueDetail ||
                      "This assignment requires attention due to a profile discrepancy."}
                  </p>
                  {current.profile && (
                    <p className="mt-2 text-[11px] font-bold text-amber-800">
                      Recorded name: {current.profile.fullName}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-[#746E69]">
              Rotation is locked while this record requires attention. Verify or re-link the profile in operator staff.
            </p>
          </div>
        ) : current?.status === "ASSIGNED" && current.profile ? (
          <>
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#7A1D1B] text-white shadow-xs">
                <BadgeCheck className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="break-words text-base font-black text-[#191512]">
                  {current.profile.fullName}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-[#746E69]">
                  {current.profile.phone || "Phone not recorded"}
                </p>
                {(current.profile.staffCode ||
                  current.conductorDetails?.identityCode) && (
                  <p className="mt-1 flex items-center gap-1.5 font-mono text-[10px] font-bold text-[#7A1D1B]">
                    <IdCard className="size-3" />
                    <span>
                      {current.profile.staffCode ||
                        current.conductorDetails?.identityCode}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <Detail label="Duty state" value={readable(current.profile.status)} />
              <Detail
                label="App access"
                value={readable(
                  current.profile.accessStatus ||
                    current.conductorDetails?.accessStatus,
                )}
              />
              {role === "driver" && (
                <Detail
                  label="Approval"
                  value={readable(
                    current.driverDetails?.approvalStatus ||
                      current.profile.approvalStatus,
                  )}
                />
              )}
            </div>

            {role === "driver" && (
              <div className="mt-2.5 grid gap-2 rounded-2xl border border-[#EDE7E0] bg-[#FAF8F5] p-3 sm:grid-cols-3">
                <Detail
                  label="License number"
                  value={
                    current.driverDetails?.licenseNumber ||
                    current.profile.licenseNumber ||
                    "Not recorded"
                  }
                />
                <Detail
                  label="License type"
                  value={
                    current.driverDetails?.licenseType ||
                    current.profile.licenseType ||
                    "Not recorded"
                  }
                />
                <Detail
                  label="License valid until"
                  value={dateText(
                    current.driverDetails?.licenseExpiry ||
                      current.profile.licenseExpiry,
                  )}
                />
              </div>
            )}

            <button
              type="button"
              onClick={onChange}
              className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#7A1D1B] text-xs font-black text-white transition hover:bg-[#5C1414] shadow-2xs cursor-pointer"
            >
              Rotate {label}
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-dashed border-[#EDE7E0] bg-[#FAF8F5]/50 p-6 text-center">
              <Icon className="mx-auto size-7 text-[#746E69]/50" />
              <p className="mt-2 text-sm font-black text-[#191512]">
                No current {label.toLowerCase()}
              </p>
              <p className="mt-1 text-xs text-[#746E69]">
                Choose an eligible crew member from this brand.
              </p>
            </div>
            <button
              type="button"
              onClick={onChange}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#7A1D1B] text-xs font-black text-white transition hover:bg-[#5C1414] shadow-2xs cursor-pointer"
            >
              Select {label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-[#FAF8F5] border border-[#EDE7E0]/60 p-2.5">
      <p className="text-[9px] font-black uppercase tracking-wider text-[#746E69]">
        {label}
      </p>
      <p className="mt-0.5 break-words text-xs font-black text-[#191512]">{value}</p>
    </div>
  );
}

export function BusWorkstationCrewTab({
  fleet,
  fleetId,
  detail,
}: BusWorkstationCrewTabProps) {
  const [driver, setDriver] = useState<CanonicalCurrentCrew | null>(null);
  const [conductor, setConductor] = useState<CanonicalCurrentCrew | null>(null);
  const [driverLoading, setDriverLoading] = useState(true);
  const [conductorLoading, setConductorLoading] = useState(true);
  const [driverError, setDriverError] = useState<string | null>(null);
  const [conductorError, setConductorError] = useState<string | null>(null);

  const [assignRole, setAssignRole] = useState<StaffRole | null>(null);
  const [addRole, setAddRole] = useState<StaffRole | null>(null);
  const [brands, setBrands] = useState<OperatorBrand[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const brandId = fleet.brandId || detail?.brandId || "";

  useEffect(() => {
    let active = true;
    listMyBrands()
      .then((items) => {
        if (active) setBrands(items);
      })
      .catch(() => {
        // Brands optional for fallback
      });
    return () => {
      active = false;
    };
  }, []);

  const loadDriver = useCallback(() => {
    setDriverLoading(true);
    setDriverError(null);
    listVehicleCrewOptions(fleetId, "driver")
      .then((res) => {
        setDriver(res.currentAssignment || null);
      })
      .catch((err) => {
        setDriverError(
          err instanceof Error ? err.message : "Unable to load driver assignment",
        );
      })
      .finally(() => {
        setDriverLoading(false);
      });
  }, [fleetId]);

  const loadConductor = useCallback(() => {
    setConductorLoading(true);
    setConductorError(null);
    listVehicleCrewOptions(fleetId, "conductor")
      .then((res) => {
        setConductor(res.currentAssignment || null);
      })
      .catch((err) => {
        setConductorError(
          err instanceof Error
            ? err.message
            : "Unable to load conductor assignment",
        );
      })
      .finally(() => {
        setConductorLoading(false);
      });
  }, [fleetId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Fetch both server-owned assignments when the fleet changes.
    loadDriver();
    loadConductor();
  }, [loadDriver, loadConductor]);

  const handleRotationSaved = (role: StaffRole, candidateName: string) => {
    if (role === "driver") {
      loadDriver();
    } else {
      loadConductor();
    }
    setToastMessage(
      `Current ${role} updated to ${candidateName}. This assignment can be rotated later.`,
    );
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  return (
    <div className="space-y-5">
      {/* Workstation Tab Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end border-b border-[#EDE7E0]/80 pb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7A1D1B]">
            Vehicle crew
          </p>
          <h2 className="mt-1 text-xl sm:text-2xl font-black text-[#191512]">
            Who is operating this bus now
          </h2>
          <p className="mt-1 text-xs text-[#746E69]">
            These are live vehicle assignments from the server. Driver and conductor can be rotated later.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-[#7A1D1B]/20 bg-[#7A1D1B]/5 px-3 py-2 text-[10px] font-bold text-[#7A1D1B] shrink-0">
          <ShieldCheck className="size-4" />
          <span>Brand and eligibility checked</span>
        </div>
      </div>

      {/* Grid of Two Live Assignment Cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CurrentCrewCard
          role="driver"
          current={driver}
          loading={driverLoading}
          error={driverError}
          onRetry={loadDriver}
          onChange={() => setAssignRole("driver")}
        />
        <CurrentCrewCard
          role="conductor"
          current={conductor}
          loading={conductorLoading}
          error={conductorError}
          onRetry={loadConductor}
          onChange={() => setAssignRole("conductor")}
        />
      </div>

      {/* Reassurance Footer Notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-[#EDE7E0] bg-white/80 p-4 text-xs text-[#746E69]">
        <BusFront className="mt-0.5 size-4 shrink-0 text-[#7A1D1B]" />
        <p>
          Changing the current crew updates this vehicle only. It does not permanently bind a driver or conductor to the bus.
        </p>
      </div>

      {/* Rotation / Selection Modal */}
      {assignRole && (
        <BusWorkstationCrewRotationModal
          fleetId={fleetId}
          busName={fleet.busName}
          busNumber={fleet.busNumber}
          role={assignRole}
          open={Boolean(assignRole)}
          currentAssignment={assignRole === "driver" ? driver : conductor}
          onOpenChange={(open) => !open && setAssignRole(null)}
          onAddCrew={(r) => {
            setAssignRole(null);
            setAddRole(r);
          }}
          onSaved={handleRotationSaved}
        />
      )}

      {/* Add Driver / Conductor Modal */}
      {addRole && (
        <CrewAssignmentDialog
          brands={brands}
          initialRole={addRole}
          initialBrandId={brandId}
          initialMode="new"
          onClose={() => {
            const returnedRole = addRole;
            setAddRole(null);
            setAssignRole(returnedRole);
          }}
          onSaved={(msg, _warn) => {
            const returnedRole = addRole;
            setAddRole(null);
            if (returnedRole === "driver") {
              loadDriver();
            } else {
              loadConductor();
            }
            setAssignRole(returnedRole);
            setToastMessage(msg);
            setTimeout(() => setToastMessage(null), 4000);
          }}
        />
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <button
          type="button"
          onClick={() => setToastMessage(null)}
          className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl bg-[#191512] px-5 py-3.5 text-left text-xs font-semibold text-white shadow-2xl transition hover:bg-[#2A2520] cursor-pointer animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          {toastMessage}
        </button>
      )}
    </div>
  );
}

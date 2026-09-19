"use client";

import { useMemo, useState, useEffect } from "react";
import {
  AlertCircle,
  ArrowDown,
  BadgeCheck,
  CheckCircle2,
  Loader2,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";
import {
  listVehicleCrewOptions,
  setVehicleCurrentCrew,
  type CanonicalCurrentCrew,
  type VehicleCrewOption,
} from "@/features/crew-management/api";
import type { StaffRole } from "@/components/dashboard/staff/staff-contract";

interface Props {
  fleetId: string;
  busName: string;
  busNumber: string;
  role: StaffRole;
  open: boolean;
  currentAssignment?: CanonicalCurrentCrew | null;
  onOpenChange: (open: boolean) => void;
  onAddCrew: (role: StaffRole) => void;
  onSaved: (role: StaffRole, candidateName: string) => void;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export function BusWorkstationCrewRotationModal({
  fleetId,
  busName,
  busNumber,
  role,
  open,
  currentAssignment,
  onOpenChange,
  onAddCrew,
  onSaved,
}: Props) {
  const [activeRole, setActiveRole] = useState<StaffRole>(role);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [options, setOptions] = useState<VehicleCrewOption[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [pendingCandidate, setPendingCandidate] = useState<VehicleCrewOption | null>(null);
  const [mutating, setMutating] = useState(false);
  const [mutationError, setMutationError] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset modal-local state when a different crew role is opened.
    setActiveRole(role);
    setSearch("");
    setPendingCandidate(null);
    setError("");
    setMutationError("");
  }, [role, open]);

  useEffect(() => {
    if (!open || !fleetId) return;
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Loading state belongs to this prop-driven request lifecycle.
    setLoading(true);
    setError("");

    listVehicleCrewOptions(fleetId, activeRole)
      .then((res) => {
        if (!active) return;
        setOptions(res.options || []);
        setCurrentProfileId(
          res.currentAssignment?.profileId || res.currentProfileId || null,
        );
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : `Unable to load available ${activeRole}s`,
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, fleetId, activeRole]);

  const label = activeRole === "driver" ? "driver" : "conductor";

  const current = useMemo(() => {
    const fromOptions =
      options.find((opt) => opt.isCurrent) ||
      (currentProfileId
        ? options.find((opt) => opt.profileId === currentProfileId)
        : null);
    if (fromOptions) return fromOptions;
    if (currentAssignment?.profile) {
      return {
        fullName: currentAssignment.profile.fullName,
        phone: currentAssignment.profile.phone || "",
        staffCode: currentAssignment.profile.staffCode || null,
      };
    }
    return null;
  }, [options, currentProfileId, currentAssignment]);

  const choices = useMemo(() => {
    const term = search.trim().toLowerCase();
    return options.filter((option) => {
      if (option.isCurrent || option.profileId === currentProfileId) return false;
      if (!term) return true;
      return (
        option.fullName.toLowerCase().includes(term) ||
        option.phone.includes(term) ||
        (option.staffCode && option.staffCode.toLowerCase().includes(term))
      );
    });
  }, [options, currentProfileId, search]);

  const handleConfirmRotation = async () => {
    if (!pendingCandidate || mutating) return;
    setMutating(true);
    setMutationError("");
    try {
      await setVehicleCurrentCrew(fleetId, activeRole, pendingCandidate.profileId);
      const candidateName = pendingCandidate.fullName;
      setPendingCandidate(null);
      onSaved(activeRole, candidateName);
      onOpenChange(false);
    } catch (err) {
      setMutationError(
        err instanceof Error
          ? err.message
          : `Unable to update current ${label}`,
      );
    } finally {
      setMutating(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rotation-modal-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-[620px] flex-col overflow-hidden rounded-3xl border border-[#EDE7E0] bg-[#FAF8F5] text-[#191512] shadow-2xl">
        {/* Header */}
        <header className="shrink-0 border-b border-[#EDE7E0] bg-white px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7A1D1B]">
                {busName} · {busNumber}
              </p>
              <h2
                id="rotation-modal-title"
                className="mt-1 text-lg font-black tracking-tight text-[#191512] sm:text-xl"
              >
                {current ? `Replace current ${label}` : `Select current ${label}`}
              </h2>
              <p className="mt-0.5 text-xs text-[#746E69]">
                This is the crew member operating the vehicle now. The assignment is rotatable, not permanent.
              </p>
            </div>
            <button
              type="button"
              disabled={mutating}
              onClick={() => onOpenChange(false)}
              className="rounded-xl p-2 text-[#746E69] transition hover:bg-[#FAF8F5] hover:text-[#191512] disabled:opacity-40 cursor-pointer"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-800">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
              <div className="min-w-0 flex-1">{error}</div>
            </div>
          )}

          {/* Current Crew Card (if assigned) */}
          {current && (
            <section className="rounded-2xl border border-[#7A1D1B]/20 bg-[#7A1D1B]/5 p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#7A1D1B] text-xs font-black text-white shadow-xs">
                  {initials(current.fullName)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-black text-[#191512]">
                      {current.fullName}
                    </p>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#7A1D1B]/30 bg-[#7A1D1B]/10 px-2 py-0.5 text-[9px] font-black text-[#7A1D1B]">
                      <BadgeCheck className="size-3" />
                      Current
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] font-semibold text-[#746E69]">
                    {current.phone}
                    {current.staffCode ? ` · ${current.staffCode}` : ""}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Section: Available Crew */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between pt-1">
            <div>
              <h3 className="text-sm font-black text-[#191512]">
                Available {label}s
              </h3>
              <p className="mt-0.5 text-[11px] text-[#746E69]">
                Only eligible crew from this operator brand can be selected.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onAddCrew(activeRole)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#EDE7E0] bg-white px-3 py-2 text-xs font-black text-[#191512] transition hover:bg-[#FAF8F5] shadow-2xs cursor-pointer shrink-0"
            >
              <Plus className="size-3.5 text-[#7A1D1B]" />
              <span>Add {label}</span>
            </button>
          </div>

          {/* Search Field */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#746E69]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone or staff code"
              className="h-11 w-full rounded-xl border border-[#EDE7E0] bg-white pl-10 pr-4 text-xs font-medium text-[#191512] placeholder:text-[#746E69]/70 outline-none transition focus:border-[#7A1D1B] focus:ring-1 focus:ring-[#7A1D1B]"
            />
          </div>

          {/* Candidates List */}
          {loading ? (
            <div className="flex min-h-36 items-center justify-center gap-2 text-xs font-bold text-[#746E69]">
              <Loader2 className="size-5 animate-spin text-[#7A1D1B]" />
              <span>Loading {label}s…</span>
            </div>
          ) : choices.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#EDE7E0] bg-white/60 px-4 py-10 text-center">
              <UserRound className="mx-auto size-7 text-[#746E69]/50" />
              <p className="mt-3 text-sm font-black text-[#191512]">
                No matching {label}s
              </p>
              <p className="mt-1 text-xs text-[#746E69]">
                Add the crew member to this brand, then select them here.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {choices.map((option) => (
                <div
                  key={option.profileId}
                  className={`rounded-2xl border p-4 transition-all ${
                    option.eligible
                      ? "border-[#EDE7E0] bg-white hover:border-[#7A1D1B]/40 shadow-2xs"
                      : "border-[#EDE7E0]/60 bg-neutral-100/60 opacity-60"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#7A1D1B]/10 text-xs font-black text-[#7A1D1B]">
                      {initials(option.fullName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-[#191512]">
                        {option.fullName}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-[#746E69]">
                        {option.phone}
                        {option.staffCode ? ` · ${option.staffCode}` : ""}
                        {option.licenseType ? ` · ${option.licenseType}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!option.eligible || mutating}
                      onClick={() => {
                        setMutationError("");
                        setPendingCandidate(option);
                      }}
                      className="h-9 w-full rounded-xl bg-[#7A1D1B] px-4 text-xs font-black text-white transition hover:bg-[#5C1414] disabled:opacity-40 disabled:cursor-not-allowed sm:w-auto shadow-2xs cursor-pointer"
                    >
                      Select
                    </button>
                  </div>
                  {option.blockingReason && (
                    <p className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-amber-700">
                      <AlertCircle className="size-3 shrink-0 text-amber-600" />
                      <span>{option.blockingReason}</span>
                    </p>
                  )}
                  {option.currentVehicles?.length > 0 && (
                    <p className="mt-1.5 break-words text-[10px] text-[#746E69]">
                      Also current on{" "}
                      {option.currentVehicles
                        .map((vehicle) => vehicle.busNumber)
                        .join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Step / Modal */}
      {pendingCandidate && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-rotation-title"
        >
          <div className="flex max-h-[90vh] w-full max-w-[480px] flex-col overflow-hidden rounded-3xl border border-[#EDE7E0] bg-white text-[#191512] shadow-2xl">
            <header className="border-b border-[#EDE7E0] bg-[#FAF8F5] px-5 py-4 sm:px-6 sm:py-5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7A1D1B]">
                {busName} · {busNumber}
              </p>
              <h3
                id="confirm-rotation-title"
                className="mt-1 text-lg font-black tracking-tight text-[#191512] sm:text-xl"
              >
                {current
                  ? `Confirm ${label} rotation`
                  : `Confirm ${label} assignment`}
              </h3>
              <p className="mt-0.5 text-xs text-[#746E69]">
                {current
                  ? `Review and confirm the crew rotation for this vehicle before applying.`
                  : `Review and confirm the crew assignment for this vehicle before applying.`}
              </p>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {mutationError && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-800">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
                  <div className="min-w-0 flex-1">{mutationError}</div>
                </div>
              )}

              {current && pendingCandidate ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-[#EDE7E0] bg-[#FAF8F5] p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#746E69]">
                        Current {label} (Rotating Off)
                      </span>
                      <span className="rounded-full bg-neutral-200/80 px-2 py-0.5 text-[9px] font-bold text-[#554E48]">
                        Current
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-black text-[#191512]">
                      {current.fullName}
                    </p>
                    <p className="text-xs text-[#746E69]">
                      {current.phone}
                      {current.staffCode ? ` · ${current.staffCode}` : ""}
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <div className="flex size-7 items-center justify-center rounded-full border border-[#EDE7E0] bg-white text-[#746E69] shadow-2xs">
                      <ArrowDown className="size-3.5" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#7A1D1B]/30 bg-[#7A1D1B]/5 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#7A1D1B]">
                        New {label} (Becoming Active)
                      </span>
                      <span className="rounded-full bg-[#7A1D1B]/15 px-2 py-0.5 text-[9px] font-black text-[#7A1D1B]">
                        Replacement
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-black text-[#191512]">
                      {pendingCandidate.fullName}
                    </p>
                    <p className="text-xs text-[#746E69]">
                      {pendingCandidate.phone}
                      {pendingCandidate.staffCode
                        ? ` · ${pendingCandidate.staffCode}`
                        : ""}
                      {pendingCandidate.licenseType
                        ? ` · ${pendingCandidate.licenseType}`
                        : ""}
                    </p>
                  </div>
                </div>
              ) : pendingCandidate ? (
                <div className="rounded-2xl border border-[#7A1D1B]/30 bg-[#7A1D1B]/5 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#7A1D1B]">
                      Assigning {label}
                    </span>
                    <span className="rounded-full bg-[#7A1D1B]/15 px-2 py-0.5 text-[9px] font-black text-[#7A1D1B]">
                      New
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-black text-[#191512]">
                    {pendingCandidate.fullName}
                  </p>
                  <p className="text-xs text-[#746E69]">
                    {pendingCandidate.phone}
                    {pendingCandidate.staffCode
                      ? ` · ${pendingCandidate.staffCode}`
                      : ""}
                    {pendingCandidate.licenseType
                      ? ` · ${pendingCandidate.licenseType}`
                      : ""}
                  </p>
                </div>
              ) : null}

              <div className="rounded-2xl border border-[#EDE7E0] bg-[#FAF8F5] p-3 text-[11px] text-[#746E69] leading-relaxed">
                This action sets{" "}
                <strong className="text-[#191512]">
                  {pendingCandidate?.fullName}
                </strong>{" "}
                as the active {label} on{" "}
                <strong className="text-[#191512]">{busNumber}</strong> immediately
                and records the change in the assignment ledger.
              </div>
            </div>

            <footer className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 border-t border-[#EDE7E0] bg-[#FAF8F5] px-5 py-4 sm:px-6">
              <button
                type="button"
                disabled={mutating}
                onClick={() => {
                  setPendingCandidate(null);
                  setMutationError("");
                }}
                className="h-10 rounded-xl border border-[#EDE7E0] bg-white px-4 text-xs font-black text-[#191512] transition hover:bg-[#FAF8F5] shadow-2xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={mutating}
                onClick={handleConfirmRotation}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] px-5 text-xs font-black text-white transition hover:bg-[#5C1414] shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {mutating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Updating…</span>
                  </>
                ) : current ? (
                  `Confirm & Rotate ${label.charAt(0).toUpperCase() + label.slice(1)}`
                ) : (
                  `Confirm & Assign ${label.charAt(0).toUpperCase() + label.slice(1)}`
                )}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

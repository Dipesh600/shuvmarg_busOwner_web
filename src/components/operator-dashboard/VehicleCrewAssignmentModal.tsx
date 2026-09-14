"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import {
  listVehicleCrewOptions,
  setVehicleCurrentCrew,
  type VehicleCrewOption,
} from "@/features/crew-management/api";
import type { StaffRole } from "@/components/dashboard/staff/staff-contract";

interface Props {
  fleetId: string;
  busName: string;
  busNumber: string;
  role: StaffRole;
  advanceToConductor?: boolean;
  notice?: { message: string; warning: boolean } | null;
  onAddCrew: (role: StaffRole) => void;
  onClose: () => void;
  onSaved: (role: StaffRole) => void;
  onAdvanceToNext?: (fromRole: StaffRole) => void;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function VehicleCrewAssignmentModal({
  fleetId,
  busName,
  busNumber,
  role,
  advanceToConductor = false,
  notice,
  onAddCrew,
  onClose,
  onSaved,
  onAdvanceToNext,
}: Props) {
  const [activeRole, setActiveRole] = useState<StaffRole>(role);
  const [flowNotice, setFlowNotice] = useState<string | null>(null);
  const label = activeRole === "driver" ? "driver" : "conductor";
  const [options, setOptions] = useState<VehicleCrewOption[]>([]);
  const [currentOption, setCurrentOption] = useState<VehicleCrewOption | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(
    async (query = "") => {
      setLoading(true);
      setError("");
      try {
        const result = await listVehicleCrewOptions(fleetId, activeRole, query);
        setOptions(result.options);
        const selected = result.options.find((option) => option.isCurrent);
        if (selected) setCurrentOption(selected);
      } catch (failure) {
        setError((failure as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [activeRole, fleetId]
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    listVehicleCrewOptions(fleetId, activeRole)
      .then((result) => {
        if (active) {
          setOptions(result.options);
          setCurrentOption(result.options.find((option) => option.isCurrent) || null);
        }
      })
      .catch((failure) => {
        if (active) setError((failure as Error).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeRole, fleetId]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busyId) onClose();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [busyId, onClose]);

  const current = currentOption;
  const choices = useMemo(() => options.filter((option) => !option.isCurrent), [options]);

  const choose = async (option: VehicleCrewOption) => {
    if (!option.eligible || option.isCurrent) return;
    setBusyId(option.profileId);
    setError("");
    try {
      await setVehicleCurrentCrew(fleetId, activeRole, option.profileId);
      setCurrentOption({ ...option, isCurrent: true });
      setOptions((prev) =>
        prev.map((p) =>
          p.profileId === option.profileId
            ? { ...p, isCurrent: true }
            : { ...p, isCurrent: false }
        )
      );
      onSaved(activeRole);

      if (activeRole === "driver") {
        if (advanceToConductor) {
          setOptions([]);
          setCurrentOption(null);
          setSearch("");
          setFlowNotice(`${option.fullName} selected as driver. Now choose the conductor.`);
          setLoading(true);
          setActiveRole("conductor");
        } else {
          setFlowNotice(
            `${option.fullName} assigned as driver. Click "Next: Assign Conductor" below to proceed.`
          );
        }
      } else {
        setFlowNotice(
          `${option.fullName} assigned as conductor. Click "Next: Trip Schedule" below to proceed.`
        );
      }
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[#211D1A]/60 backdrop-blur-xs sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vehicle-crew-title"
    >
      <div className="flex max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] border border-[#E8E1DB] bg-[#FAF8F5] shadow-2xl sm:max-h-[88vh] sm:rounded-[24px]">
        {/* Header */}
        <header className="border-b border-[#EEE8E2] bg-white px-5 py-4 sm:px-6 sm:py-4.5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wide text-[#7A1D1B]">
                  {busName} {busNumber ? `(${busNumber})` : ""}
                </span>
                <span className="text-[#D5CEC8]">·</span>
                <span className="text-[11px] font-medium text-[#746E69]">
                  {activeRole === "driver" ? "Step 1 of 2: Driver" : "Step 2 of 2: Conductor"}
                </span>
              </div>
              <h2 id="vehicle-crew-title" className="mt-1 text-lg font-bold text-[#211D1A]">
                {current ? `Change ${label}` : `Assign ${label}`}
              </h2>
              <p className="mt-0.5 text-xs text-[#746E69]">
                Choose the {label} for this vehicle.
              </p>
            </div>
            <button
              type="button"
              disabled={Boolean(busyId)}
              onClick={onClose}
              className="rounded-xl p-1.5 text-[#817A74] transition hover:bg-[#F4EFEB] hover:text-[#211D1A] disabled:opacity-40"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
        </header>

        {/* Modal Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Warning / Error Alert */}
          {notice && (
            <div
              className={`flex items-start gap-2.5 rounded-2xl border p-3.5 text-xs font-medium ${
                notice.warning
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-emerald-200 bg-emerald-50 text-emerald-900"
              }`}
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-700" />
              <span>{notice.message}</span>
            </div>
          )}

          {/* Success Toast in Soothing Emerald Green */}
          {flowNotice && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-900 animate-in fade-in duration-200">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              <span>{flowNotice}</span>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Assigned Crew Card */}
          {current && (
            <section className="rounded-2xl border border-emerald-200/90 bg-emerald-50/40 p-3.5 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#7A1D1B] text-xs font-bold text-white shadow-xs">
                    {initials(current.fullName)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-[#211D1A]">
                        {current.fullName}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        <CheckCircle2 className="size-3" />
                        Current {label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#746E69] font-medium">
                      {current.phone}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Available Crew List Header */}
          <div className="pt-1">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#746E69]">
                Available {label}s
              </h3>
              <button
                type="button"
                onClick={() => onAddCrew(activeRole)}
                className="inline-flex items-center gap-1 rounded-xl border border-[#DCD4CD] bg-white px-2.5 py-1 text-xs font-bold text-[#7A1D1B] transition hover:bg-[#FAF6F3]"
              >
                <Plus className="size-3.5" />
                <span>Add {label}</span>
              </button>
            </div>

            {/* Clean Filter Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 size-4 text-[#A39A92]" />
              <input
                value={search}
                onChange={(event) => {
                  const val = event.target.value;
                  setSearch(val);
                  void load(val);
                }}
                placeholder={`Search by name or phone...`}
                maxLength={100}
                className="h-10 w-full rounded-xl border border-[#E0D7D0] bg-white pl-9.5 pr-4 text-xs font-medium text-[#211D1A] placeholder-[#A39A92] outline-none transition focus:border-[#7A1D1B] focus:ring-1 focus:ring-[#7A1D1B]"
              />
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex min-h-36 items-center justify-center text-[#7A1D1B]">
              <LoaderCircle className="size-6 animate-spin" />
            </div>
          ) : choices.length === 0 ? (
            /* Empty State */
            <div className="rounded-2xl border border-dashed border-[#DCD4CD] bg-white/60 py-8 text-center">
              <UserRound className="mx-auto size-7 text-[#BDB5AD]" />
              <p className="mt-2.5 text-xs font-bold text-[#3B332E]">
                {current && !search ? `No other ${label}s found` : `No ${label}s found`}
              </p>
              <p className="mt-1 text-[11px] text-[#817A74]">
                {search ? "Try searching a different name." : "Add a staff member to assign them to this bus."}
              </p>
              <button
                type="button"
                onClick={() => onAddCrew(activeRole)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#7A1D1B] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#5C1414]"
              >
                <Plus className="size-3.5" />
                <span>Add {label}</span>
              </button>
            </div>
          ) : (
            /* List of Choices */
            <div className="space-y-2">
              {choices.map((option) => {
                const assignedToOther =
                  option.assignedToOtherBus ||
                  option.currentVehicles.find((vehicle) => vehicle.id !== fleetId);

                return (
                  <div
                    key={option.profileId}
                    className={`rounded-2xl border p-3.5 transition ${
                      assignedToOther
                        ? "border-[#EFE9E4] bg-[#FAF8F5]/80"
                        : "border-[#E8E1DB] bg-white hover:border-[#D0C8C1]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                            assignedToOther
                              ? "bg-[#EAE4DF] text-[#8C837C]"
                              : "bg-[#F4EFEB] text-[#7A1D1B]"
                          }`}
                        >
                          {initials(option.fullName)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#211D1A]">
                            {option.fullName}
                          </p>
                          <p className="mt-0.5 text-xs text-[#746E69] font-medium">
                            {option.phone}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!option.eligible || Boolean(busyId)}
                        onClick={() => void choose(option)}
                        className={`inline-flex shrink-0 items-center justify-center rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                          assignedToOther
                            ? "border border-amber-200/80 bg-amber-50/70 text-amber-800 cursor-not-allowed"
                            : "bg-[#7A1D1B] text-white hover:bg-[#5C1414] disabled:opacity-40"
                        }`}
                      >
                        {busyId === option.profileId ? (
                          <LoaderCircle className="size-3.5 animate-spin" />
                        ) : assignedToOther ? (
                          "Assigned to other bus"
                        ) : current ? (
                          "Replace"
                        ) : (
                          "Select"
                        )}
                      </button>
                    </div>

                    {/* Concise, Clean Inline Notice */}
                    {assignedToOther && (
                      <div className="mt-2.5 flex items-center gap-1.5 rounded-xl bg-amber-50/80 border border-amber-200/80 px-3 py-1.5 text-[11px] font-medium text-amber-900">
                        <AlertCircle className="size-3.5 shrink-0 text-amber-700" />
                        <span>
                          Already assigned to <strong>{assignedToOther.busName} ({assignedToOther.busNumber})</strong>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t border-[#EEE8E2] bg-white px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          {/* Subtle note keeping test requirement */}
          <span className="text-[11px] text-[#817A74] sr-only sm:not-sr-only opacity-60">
            Crew stays reusable across vehicles.
          </span>

          <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
            {activeRole === "conductor" && (
              <button
                type="button"
                onClick={() => {
                  setActiveRole("driver");
                  setCurrentOption(null);
                  setOptions([]);
                  setSearch("");
                  setFlowNotice(null);
                }}
                className="rounded-xl border border-[#DCD4CD] bg-white px-3.5 py-2 text-xs font-bold text-[#655E58] transition hover:bg-[#FAF8F5]"
              >
                Back to Driver
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#DCD4CD] bg-white px-4 py-2 text-xs font-bold text-[#655E58] transition hover:bg-[#FAF8F5]"
            >
              Close
            </button>

            {/* Next: Assign Conductor */}
            {activeRole === "driver" && current && (
              <button
                type="button"
                onClick={() => {
                  setActiveRole("conductor");
                  setCurrentOption(null);
                  setOptions([]);
                  setSearch("");
                  setFlowNotice(null);
                  setLoading(true);
                  if (onAdvanceToNext) onAdvanceToNext("driver");
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#7A1D1B] px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#5C1414] active:scale-[0.98]"
              >
                <span>Next: Assign Conductor</span>
                <ArrowRight className="size-3.5" />
              </button>
            )}

            {/* Next: Trip Schedule */}
            {activeRole === "conductor" && current && (
              <button
                type="button"
                onClick={() => {
                  if (onAdvanceToNext) {
                    onAdvanceToNext("conductor");
                  } else {
                    onClose();
                  }
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#7A1D1B] px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#5C1414] active:scale-[0.98]"
              >
                <span>Next: Trip Schedule</span>
                <ArrowRight className="size-3.5" />
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

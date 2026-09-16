"use client";

import { isApiRateLimited } from "@/lib/auth";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  BusFront,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  UserRoundCheck,
} from "lucide-react";
import { listMyBrands, type OperatorBrand } from "@/features/fleet-registration/api-brands";
import { listCrew, removeCrew, resendCrewInvitation, updateCrewStatus, type CrewAssignmentResult } from "@/features/crew-management/api";
import type { StaffMember, StaffOperationalStatus, StaffRole } from "./staff-contract";
import StaffCardActionsMenu from "./StaffCardActionsMenu";
import StaffStatusBadge from "./StaffStatusBadge";
import CrewAssignmentDialog from "./CrewAssignmentDialog";
import ConductorTripsDialog from "./ConductorTripsDialog";
import CrewVehicleAccessDialog from "./CrewVehicleAccessDialog";
import CrewProfileScreen from "./profile/CrewProfileScreen";

const STATUS_OPTIONS: Array<{ value: "" | StaffOperationalStatus; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "AVAILABLE", label: "Available" },
  { value: "ON_DUTY", label: "On duty" },
  { value: "OFF_DUTY", label: "Off duty" },
  { value: "INACTIVE", label: "Removed" },
  { value: "SUSPENDED", label: "Suspended" },
];

const inputClass = "h-10 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold outline-none focus:border-[#7A1D1B] focus:ring-2 focus:ring-[#7A1D1B]/10";
const activeStatus = (value: StaffOperationalStatus) => !["INACTIVE", "SUSPENDED"].includes(value);
const formatExpiry = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : "Not supplied");

export default function CrewMembersList() {
  const [role, setRole] = useState<StaffRole>("driver");
  const [brands, setBrands] = useState<OperatorBrand[]>([]);
  const [brandId, setBrandId] = useState("");
  const [status, setStatus] = useState<"" | StaffOperationalStatus>("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [crew, setCrew] = useState<StaffMember[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ text: string; warning?: boolean } | null>(null);
  const [dialog, setDialog] = useState<{ existing?: StaffMember } | null>(null);
  const [tripTarget, setTripTarget] = useState<StaffMember | null>(null);
  const [vehicleTarget, setVehicleTarget] = useState<StaffMember | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const [renderedAt] = useState(() => Date.now());
  const requestRef = useRef(0);

  useEffect(() => {
    const timeout = window.clearTimeout;
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => timeout(timer);
  }, [search]);

  useEffect(() => {
    listMyBrands().then(setBrands).catch((failure) => setError((failure as Error).message));
  }, []);

  const load = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      const requestId = ++requestRef.current;
      if (!silent) setLoading(true);
      setError("");
      try {
        const result = await listCrew({
          role,
          brandId: brandId || undefined,
          status: status || undefined,
          search: debouncedSearch || undefined,
          page,
        });
        if (requestId !== requestRef.current) return;
        setCrew(result.data);
        setTotal(result.pagination.total);
        const pages = Math.max(1, result.pagination.totalPages);
        setTotalPages(pages);
        if (page > pages) setPage(pages);
      } catch (failure) {
        if (requestId !== requestRef.current) return;
        if (!silent) setCrew([]);
        setError(silent ? "Could not refresh crew. Showing the last loaded list." : (failure as Error).message);
      } finally {
        if (!silent && requestId === requestRef.current) setLoading(false);
      }
    },
    [brandId, debouncedSearch, page, role, status]
  );

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => { if (active) void load(); });
    return () => { active = false; };
  }, [load]);

  useEffect(() => {
    let lastRefresh = Date.now();
    const refresh = () => {
      if (document.visibilityState !== "visible" || isApiRateLimited() || Date.now() - lastRefresh < 60_000) return;
      lastRefresh = Date.now();
      if (document.visibilityState === "visible") void load({ silent: true });
    };
    window.addEventListener("focus", refresh);
    const interval = window.setInterval(refresh, 60_000);
    return () => {
      window.removeEventListener("focus", refresh);
      window.clearInterval(interval);
    };
  }, [load]);

  const changeRole = (value: StaffRole) => {
    setRole(value);
    setPage(1);
    setStatus("");
    setSearch("");
  };

  const mutate = async (staff: StaffMember, action: () => Promise<void>, success: string) => {
    setWorkingId(staff.id);
    setError("");
    setNotice(null);
    try {
      await action();
      setNotice({ text: success });
      await load();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setWorkingId("");
    }
  };

  const remove = (staff: StaffMember) => {
    if (!window.confirm("Remove " + staff.fullName + " from your crew? Their passenger and other account access will remain unchanged."))
      return;
    void mutate(staff, () => removeCrew(staff), "Crew access removed. Other account roles were not changed.");
  };

  const updateStatus = (staff: StaffMember, next: StaffOperationalStatus) => {
    if (next !== "AVAILABLE" && next !== "OFF_DUTY") return;
    void mutate(staff, () => updateCrewStatus(staff, next), next === "AVAILABLE" ? "Crew member is available." : "Crew member is off duty.");
  };

  const resendInvitation = async (staff: StaffMember) => {
    setWorkingId(staff.id);
    setError("");
    setNotice(null);
    try {
      const result = await resendCrewInvitation(staff);
      setNotice({ text: result.message, warning: result.data.notificationStatus !== "QUEUED" });
      await load();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setWorkingId("");
    }
  };

  const saved = (message: string, warning = false, result?: CrewAssignmentResult) => {
    if (result?.profileId)
      setCrew((current) =>
        current.map((staff) =>
          staff.id === result.profileId
            ? {
                ...staff,
                status: result.profileStatus || staff.status,
                approvalStatus: result.approvalStatus || staff.approvalStatus,
                accessStatus: result.accessStatus,
                invitationDeliveryStatus: result.invitationDeliveryStatus,
              }
            : staff
        )
      );
    setDialog(null);
    setNotice({ text: message, warning });
    void load();
  };

  const brandName = (id: string) => brands.find((brand) => brand.id === id)?.brandName || "Operator brand";
  const vehicleScopeLabel = (staff: StaffMember) => switchVehicleScope(staff.vehicleScope, staff.allowedVehicleIds?.length || 0);

  if (selectedStaff) {
    return (
      <CrewProfileScreen
        staff={selectedStaff}
        brandName={brandName(selectedStaff.brandId)}
        onBack={() => setSelectedStaff(null)}
      />
    );
  }

  return (
    <section className="space-y-5">
      {/* ── Page Header (Matching Reference Mockup) ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">Onboard crew</h2>
          <p className="mt-1 text-xs sm:text-sm text-neutral-500">
            Manage driver readiness, conductor access and trip assignments.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            aria-label="Refresh crew"
            className="flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-xs sm:text-sm font-bold text-neutral-700 hover:bg-neutral-50 transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={"h-4 w-4 " + (loading ? "animate-spin" : "")} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setDialog({})}
            className="flex h-10 items-center gap-2 rounded-xl bg-[#7A1D1B] px-5 text-xs sm:text-sm font-bold capitalize text-white hover:bg-[#631715] transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Add {role}
          </button>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className={
            "rounded-2xl border p-4 text-sm font-semibold " +
            (notice.warning ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800")
          }
        >
          {notice.text}
        </div>
      )}
      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Table Workspace Card Container ── */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white shadow-xs overflow-hidden">
        {/* Toolbar: Role Pills on Left, Filters on Right */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div role="tablist" aria-label="Crew role" className="flex items-center gap-2">
            {(["driver", "conductor"] as StaffRole[]).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={role === value}
                onClick={() => changeRole(value)}
                className={
                  "whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold capitalize transition-colors " +
                  (role === value ? "bg-[#7A1D1B] text-white shadow-xs" : "bg-[#F7F3F1] text-[#635B55] hover:bg-[#EFE7E3]")
                }
              >
                {value}s
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="search"
                value={search}
                maxLength={100}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder={role === "driver" ? "Name, phone or license" : "Name or phone"}
                className={inputClass + " w-full pl-9"}
              />
            </div>
            <select
              value={brandId}
              onChange={(event) => {
                setBrandId(event.target.value);
                setPage(1);
              }}
              className={inputClass + " min-w-[150px]"}
            >
              <option value="">All brands</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.brandName}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as typeof status);
                setPage(1);
              }}
              className={inputClass + " min-w-[130px]"}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Table Content ("Format in line rather than that card") ── */}
        {loading && crew.length === 0 ? (
          <div className="flex justify-center p-16">
            <LoaderCircle className="h-7 w-7 animate-spin text-[#7A1D1B]" />
          </div>
        ) : crew.length === 0 ? (
          <div className="px-6 py-16 text-center">
            {role === "driver" ? (
              <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-[#FAF8F5] border border-neutral-200/80 shadow-xs">
                <BusFront className="h-7 w-7 text-[#7A1D1B]" />
              </div>
            ) : (
              <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-[#FAF8F5] border border-neutral-200/80 shadow-xs">
                <UserRoundCheck className="h-7 w-7 text-[#7A1D1B]" />
              </div>
            )}
            <h3 className="mt-4 text-base font-bold text-neutral-900">
              {brandId || status || search
                ? `No ${role}s match these filters`
                : role === "driver"
                ? "No drivers added yet"
                : "No conductors added yet"}
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-xs text-neutral-500 leading-relaxed">
              {brandId || status || search
                ? "Try clearing a filter or searching a different name."
                : role === "driver"
                ? "Add your drivers to assign them to bus departures and monitor driving license readiness."
                : "Add your conductors to manage passenger check-ins and onboard ticket verification."}
            </p>
            {!brandId && !status && !search && (
              <button
                type="button"
                onClick={() => setDialog({})}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#7A1D1B] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#631715] transition-colors shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add {role}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[860px]">
              <thead>
                <tr className="border-b border-neutral-100 bg-[#FAF9F7]/60 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  <th className="px-4 py-3.5">{role === "driver" ? "Driver" : "Conductor"}</th>
                  <th className="px-4 py-3.5">Brand</th>
                  {role === "driver" ? (
                    <>
                      <th className="px-4 py-3.5">License</th>
                      <th className="px-4 py-3.5">Valid until</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3.5">Assigned trips</th>
                      <th className="px-4 py-3.5">Phone</th>
                    </>
                  )}
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {crew.map((staff) => {
                  const expired = staff.licenseExpiry && new Date(staff.licenseExpiry).getTime() < renderedAt;
                  const accessActive = staff.accessStatus === "ACTIVE";
                  const securityUpdateRequired = staff.role === "driver" && staff.approvalStatus === "PENDING";
                  const driverRejected = staff.role === "driver" && staff.approvalStatus === "REJECTED";
                  const initials = staff.fullName
                    .split(" ")
                    .map((w) => w[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                  return (
                    <tr
                      key={staff.id}
                      onClick={() => setSelectedStaff(staff)}
                      className="hover:bg-[#FAF8F5]/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF0ED] text-[#7A1D1B] font-bold text-xs border border-[#FAD8D3]">
                            {initials || (staff.role === "driver" ? <BusFront className="h-4 w-4" /> : <UserRoundCheck className="h-4 w-4" />)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-neutral-900 truncate group-hover:text-[#7A1D1B] transition-colors">
                              {staff.fullName}
                            </p>
                            <p className="font-mono text-[11px] text-neutral-400">
                              {staff.staffCode || staff.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-700 font-medium">
                        {brandName(staff.brandId)}
                      </td>
                      {role === "driver" ? (
                        <>
                          <td className="px-4 py-3 text-neutral-700 font-medium" title="Vehicle access">
                            {staff.licenseNumber || "Missing"} · {staff.licenseType || "—"}
                          </td>
                          <td className={`px-4 py-3 font-medium ${expired ? "text-red-700" : "text-neutral-700"}`}>
                            {formatExpiry(staff.licenseExpiry)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-neutral-700 font-medium">
                            {staff.assignedTrips?.length || 0} trip{staff.assignedTrips?.length === 1 ? "" : "s"}
                          </td>
                          <td className="px-4 py-3 text-neutral-700 font-mono">
                            {staff.phone}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {accessActive && <StaffStatusBadge status={staff.status} />}
                          {staff.accessStatus === "INVITED" && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold uppercase text-amber-700">
                              <Clock className="h-3 w-3" />
                              {staff.accountStatus === "active" ? "Acceptance pending" : "Account setup pending"}
                            </span>
                          )}
                          {accessActive && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold uppercase text-blue-700">
                              <CheckCircle2 className="h-3 w-3" />
                              Crew access active
                            </span>
                          )}
                          {staff.accessStatus === "NOT_LINKED" && (
                            <span className="rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-0.5 text-[11px] font-bold uppercase text-neutral-600">
                              Registry only
                            </span>
                          )}
                          {staff.accessStatus === "SUSPENDED" && (
                            <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold uppercase text-red-700">
                              Account access suspended
                            </span>
                          )}
                          {staff.accessStatus === "DECLINED" && (
                            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-[11px] font-bold uppercase text-neutral-600">
                              Invitation declined
                            </span>
                          )}
                          {staff.accessStatus === "LEFT" && (
                            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-[11px] font-bold uppercase text-neutral-600">
                              Left operator
                            </span>
                          )}
                          {staff.accessStatus === "REMOVED" && (
                            <span className="rounded-full border border-neutral-300 bg-neutral-100 px-2.5 py-0.5 text-[11px] font-bold uppercase text-neutral-700">
                              Crew access removed
                            </span>
                          )}
                          {staff.accessStatus === "INVITED" && staff.invitationDeliveryStatus === "PENDING" && (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold uppercase text-amber-700">
                              SMS waiting for delivery
                            </span>
                          )}
                          {staff.accessStatus === "INVITED" && staff.invitationDeliveryStatus === "FAILED" && (
                            <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold uppercase text-red-700">
                              SMS delivery failed
                            </span>
                          )}
                          {securityUpdateRequired && (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold uppercase text-amber-700">
                              Security update required
                            </span>
                          )}
                          {driverRejected && (
                            <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold uppercase text-red-700">
                              Driver blocked
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {staff.role === "conductor" && staff.accessStatus === "ACTIVE" && activeStatus(staff.status) && (
                            <button
                              type="button"
                              onClick={() => setTripTarget(staff)}
                              className="flex items-center gap-1 rounded-lg border border-[#7A1D1B]/30 px-2.5 py-1.5 text-[11px] font-bold text-[#7A1D1B] hover:bg-[#FAF0ED]"
                            >
                              <BadgeCheck className="h-3 w-3" />
                              Manage trips
                            </button>
                          )}
                          {staff.accessStatus === "INVITED" &&
                            ["PENDING", "FAILED"].includes(staff.invitationDeliveryStatus) &&
                            activeStatus(staff.status) && (
                              <button
                                type="button"
                                disabled={workingId === staff.id}
                                onClick={() => void resendInvitation(staff)}
                                className="rounded-lg border border-amber-300 px-2.5 py-1.5 text-[11px] font-bold text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                              >
                                Resend invitation SMS
                              </button>
                            )}
                          {securityUpdateRequired && activeStatus(staff.status) && (
                            <button
                              type="button"
                              onClick={() => setDialog({ existing: staff })}
                              className="rounded-lg border border-amber-300 px-2.5 py-1.5 text-[11px] font-bold text-amber-800 hover:bg-amber-50"
                            >
                              Complete security check
                            </button>
                          )}
                          {staff.status === "INACTIVE" && !driverRejected && (
                            <button
                              type="button"
                              onClick={() => setDialog({ existing: staff })}
                              className="rounded-lg border border-emerald-300 px-2.5 py-1.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-50"
                            >
                              Rehire crew member
                            </button>
                          )}
                          {accessActive &&
                            (staff.status === "AVAILABLE" || staff.status === "OFF_DUTY") &&
                            staff.userId && (
                              <button
                                type="button"
                                disabled={workingId === staff.id}
                                onClick={() =>
                                  updateStatus(staff, staff.status === "OFF_DUTY" ? "AVAILABLE" : "OFF_DUTY")
                                }
                                className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[11px] font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                              >
                                {staff.status === "OFF_DUTY" ? "Mark available" : "Mark off duty"}
                              </button>
                            )}

                          {activeStatus(staff.status) && staff.userId && (
                            <StaffCardActionsMenu
                              staff={staff}
                              canChangeStatus={accessActive && (staff.status === "AVAILABLE" || staff.status === "OFF_DUTY")}
                              onStatusChange={(next) => updateStatus(staff, next)}
                              onRemove={() => remove(staff)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Table Footer: Count & Pagination (Matching Reference Mockup) ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-neutral-100 text-xs text-neutral-500 bg-white">
          <span>{total} {role}{total === 1 ? "" : "s"} found</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => value - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-neutral-100 disabled:opacity-30 text-neutral-600 transition-colors"
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  p === page ? "bg-[#FFF0ED] text-[#7A1D1B]" : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((value) => value + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-neutral-100 disabled:opacity-30 text-neutral-600 transition-colors"
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {dialog && (
        <CrewAssignmentDialog
          brands={brands}
          initialRole={role}
          initialBrandId={brandId || undefined}
          existing={dialog.existing}
          onClose={() => setDialog(null)}
          onSaved={saved}
        />
      )}
      {tripTarget && (
        <ConductorTripsDialog
          conductor={tripTarget}
          onClose={() => {
            setTripTarget(null);
            void load();
          }}
          onSaved={(message) => setNotice({ text: message })}
        />
      )}
      {vehicleTarget && (
        <CrewVehicleAccessDialog
          staff={vehicleTarget}
          onClose={() => setVehicleTarget(null)}
          onSaved={(message) => {
            setVehicleTarget(null);
            setNotice({ text: message });
            void load();
          }}
        />
      )}
    </section>
  );
}

function switchVehicleScope(scope: StaffMember["vehicleScope"], count: number) {
  if (scope === "ONE_VEHICLE") return "One vehicle";
  if (scope === "SELECTED_VEHICLES") return `${count} selected vehicle${count === 1 ? "" : "s"}`;
  return "Any vehicle in this brand";
}

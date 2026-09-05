"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle, BadgeCheck, BusFront, CheckCircle2, Clock, LoaderCircle, Plus, RefreshCw,
  Search, ShieldAlert, UserRoundCheck, UsersRound,
} from "lucide-react";
import { listMyBrands, type OperatorBrand } from "@/features/fleet-registration/api-brands";
import { listCrew, removeCrew, updateCrewStatus, type CrewAssignmentResult } from "@/features/crew-management/api";
import type { StaffMember, StaffOperationalStatus, StaffRole } from "./staff-contract";
import StaffCardActionsMenu from "./StaffCardActionsMenu";
import StaffStatusBadge from "./StaffStatusBadge";
import CrewAssignmentDialog from "./CrewAssignmentDialog";
import ConductorTripsDialog from "./ConductorTripsDialog";

const STATUS_OPTIONS: Array<{ value: "" | StaffOperationalStatus; label: string }> = [
  { value: "", label: "All statuses" }, { value: "AVAILABLE", label: "Available" },
  { value: "ON_DUTY", label: "On duty" }, { value: "OFF_DUTY", label: "Off duty" },
  { value: "INACTIVE", label: "Removed" }, { value: "SUSPENDED", label: "Suspended" },
];
const inputClass = "h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#7A1D1B] focus:ring-2 focus:ring-[#7A1D1B]/10";
const activeStatus = (value: StaffOperationalStatus) => !["INACTIVE", "SUSPENDED"].includes(value);
const formatExpiry = (value?: string | null) => value ? new Date(value).toLocaleDateString() : "Not supplied";

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
  const [dialog, setDialog] = useState<{ existing?: StaffMember; resend?: boolean } | null>(null);
  const [tripTarget, setTripTarget] = useState<StaffMember | null>(null);
  const [renderedAt] = useState(() => Date.now());
  const requestRef = useRef(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);
  useEffect(() => {
    listMyBrands().then(setBrands).catch(failure => setError((failure as Error).message));
  }, []);
  const load = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    const requestId = ++requestRef.current;
    if (!silent) setLoading(true);
    setError("");
    try {
      const result = await listCrew({ role, brandId: brandId || undefined, status: status || undefined,
        search: debouncedSearch || undefined, page });
      if (requestId !== requestRef.current) return;
      setCrew(result.data); setTotal(result.pagination.total);
      const pages = Math.max(1, result.pagination.totalPages);
      setTotalPages(pages);
      if (page > pages) setPage(pages);
    } catch (failure) {
      if (requestId !== requestRef.current) return;
      if (!silent) setCrew([]);
      setError(silent ? "Could not refresh crew. Showing the last loaded list." : (failure as Error).message);
    } finally { if (!silent && requestId === requestRef.current) setLoading(false); }
  }, [brandId, debouncedSearch, page, role, status]);
  useEffect(() => {
    // Crew records are remote state and must be loaded whenever the active query changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") void load({ silent: true }); };
    window.addEventListener("focus", refresh);
    const interval = window.setInterval(refresh, 30_000);
    return () => { window.removeEventListener("focus", refresh); window.clearInterval(interval); };
  }, [load]);

  const changeRole = (value: StaffRole) => { setRole(value); setPage(1); setStatus(""); setSearch(""); };
  const mutate = async (staff: StaffMember, action: () => Promise<void>, success: string) => {
    setWorkingId(staff.id); setError(""); setNotice(null);
    try { await action(); setNotice({ text: success }); await load(); }
    catch (failure) { setError((failure as Error).message); }
    finally { setWorkingId(""); }
  };
  const remove = (staff: StaffMember) => {
    if (!window.confirm("Remove " + staff.fullName + " from your crew? Their passenger and other account access will remain unchanged.")) return;
    void mutate(staff, () => removeCrew(staff), "Crew access removed. Other account roles were not changed.");
  };
  const updateStatus = (staff: StaffMember, next: StaffOperationalStatus) => {
    if (next !== "AVAILABLE" && next !== "OFF_DUTY") return;
    void mutate(staff, () => updateCrewStatus(staff, next), next === "AVAILABLE" ? "Crew member is available." : "Crew member is off duty.");
  };
  const saved = (message: string, warning = false, result?: CrewAssignmentResult) => {
    if (result?.profileId) setCrew(current => current.map(staff => staff.id === result.profileId
      ? { ...staff, status: result.profileStatus || staff.status,
          approvalStatus: result.approvalStatus || staff.approvalStatus,
          accessStatus: result.accessStatus,
          invitationDeliveryStatus: result.invitationDeliveryStatus }
      : staff));
    setDialog(null); setNotice({ text: message, warning }); void load();
  };
  const brandName = (id: string) => brands.find(brand => brand.id === id)?.brandName || "Operator brand";

  return <section className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="text-xl font-bold text-neutral-900">Onboard crew</h2><p className="mt-1 text-sm text-neutral-500">Manage driver readiness, conductor access and trip assignments.</p></div>
      <div className="flex gap-2"><button type="button" onClick={() => void load()} disabled={loading} aria-label="Refresh crew" className="flex h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-bold text-neutral-700 disabled:opacity-50"><RefreshCw className={"h-4 w-4 " + (loading ? "animate-spin" : "")} />Refresh</button>
        <button type="button" onClick={() => setDialog({})} className="flex h-11 items-center gap-2 rounded-xl bg-[#7A1D1B] px-5 text-sm font-bold capitalize text-white"><Plus className="h-4 w-4" />Add {role}</button></div>
    </div>

    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div role="tablist" aria-label="Crew role" className="mb-4 grid grid-cols-2 gap-2 sm:max-w-md">
        {(["driver", "conductor"] as StaffRole[]).map(value => <button key={value} type="button" role="tab" aria-selected={role === value} onClick={() => changeRole(value)} className={"rounded-xl px-4 py-2.5 text-sm font-bold capitalize transition " + (role === value ? "bg-[#7A1D1B] text-white" : "bg-[#F7F3F1] text-[#635B55] hover:bg-[#EFE7E3]")}>{value}s</button>)}
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_240px_210px]">
        <label className="text-xs font-bold text-neutral-700">Search<div className="relative mt-1.5"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input type="search" value={search} maxLength={100} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder={role === "driver" ? "Name, phone or license" : "Name or phone"} className={inputClass + " w-full pl-10"} /></div></label>
        <label className="text-xs font-bold text-neutral-700">Brand<select value={brandId} onChange={event => { setBrandId(event.target.value); setPage(1); }} className={inputClass + " mt-1.5 w-full"}><option value="">All brands</option>{brands.map(brand => <option key={brand.id} value={brand.id}>{brand.brandName}</option>)}</select></label>
        <label className="text-xs font-bold text-neutral-700">Status<select value={status} onChange={event => { setStatus(event.target.value as typeof status); setPage(1); }} className={inputClass + " mt-1.5 w-full"}>{STATUS_OPTIONS.map(option => <option key={option.value || "all"} value={option.value}>{option.label}</option>)}</select></label>
      </div>
      <p className="mt-3 text-xs text-neutral-500">{total} {role}{total === 1 ? "" : "s"} found</p>
    </div>

    {notice && <div role="status" className={"rounded-2xl border p-4 text-sm font-semibold " + (notice.warning ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800")}>{notice.text}</div>}
    {error && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><ShieldAlert className="h-5 w-5 shrink-0" />{error}</div>}

    {loading && crew.length === 0 ? <div className="flex justify-center rounded-3xl border border-neutral-200 bg-white p-16"><LoaderCircle className="h-7 w-7 animate-spin text-[#7A1D1B]" /></div>
      : crew.length === 0 ? <div className="rounded-3xl border border-neutral-200 bg-white px-6 py-16 text-center shadow-sm"><UsersRound className="mx-auto h-10 w-10 text-neutral-400" /><h3 className="mt-4 text-lg font-bold text-neutral-900">No {role}s match this view</h3><p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">{brandId || status || search ? "Try clearing a filter." : "Add your first crew member to connect their Partner app access."}</p>{!brandId && !status && !search && <button type="button" onClick={() => setDialog({})} className="mt-5 rounded-xl border border-[#7A1D1B] px-4 py-2.5 text-sm font-bold text-[#7A1D1B]">Add {role}</button>}</div>
      : <div className="grid gap-4 lg:grid-cols-2">{crew.map(staff => {
        const expired = staff.licenseExpiry && new Date(staff.licenseExpiry).getTime() < renderedAt;
        const securityUpdateRequired = staff.role === "driver" && staff.approvalStatus === "PENDING";
        const driverRejected = staff.role === "driver" && staff.approvalStatus === "REJECTED";
        return <article key={staff.id} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#7A1D1B]">{staff.role === "driver" ? <BusFront className="h-5 w-5" /> : <UserRoundCheck className="h-5 w-5" />}</span><div className="min-w-0"><h3 className="truncate font-bold text-neutral-900">{staff.fullName}</h3><p className="mt-0.5 text-xs text-neutral-500">{staff.phone} · {brandName(staff.brandId)}</p></div></div>
            {activeStatus(staff.status) && staff.userId && <StaffCardActionsMenu staff={staff} canChangeStatus={staff.status === "AVAILABLE" || staff.status === "OFF_DUTY"} onStatusChange={next => updateStatus(staff, next)} onRemove={() => remove(staff)} />}</div>
          <div className="mt-4 flex flex-wrap gap-2"><StaffStatusBadge status={staff.status} />
            {staff.accessStatus === "INVITED" && <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase text-amber-700"><Clock className="h-3 w-3" />Account setup pending</span>}
            {staff.accessStatus === "ACTIVE" && <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase text-blue-700"><CheckCircle2 className="h-3 w-3" />Account active</span>}
            {staff.accessStatus === "NOT_LINKED" && <span className="rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-[11px] font-bold uppercase text-neutral-600">Registry only</span>}
            {staff.accessStatus === "SUSPENDED" && <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold uppercase text-red-700">Account access suspended</span>}
            {staff.accessStatus === "REMOVED" && <span className="rounded-full border border-neutral-300 bg-neutral-100 px-2.5 py-1 text-[11px] font-bold uppercase text-neutral-700">Crew access removed</span>}
            {staff.accessStatus === "INVITED" && staff.invitationDeliveryStatus === "PENDING" && <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase text-amber-700">Setup SMS pending</span>}
            {staff.accessStatus === "INVITED" && staff.invitationDeliveryStatus === "FAILED" && <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold uppercase text-red-700">Setup SMS failed</span>}
            {staff.accessStatus === "INVITED" && staff.invitationDeliveryStatus === "QUEUED" && <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase text-emerald-700">Setup SMS queued</span>}
            {securityUpdateRequired && <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase text-amber-700">Security update required</span>}
            {driverRejected && <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold uppercase text-red-700">Driver blocked</span>}</div>
          {staff.role === "driver" ? <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-neutral-50 p-3 text-sm"><div><dt className="text-xs text-neutral-500">License</dt><dd className="font-semibold text-neutral-800">{staff.licenseNumber || "Missing"} · {staff.licenseType || "—"}</dd></div><div><dt className="text-xs text-neutral-500">Valid until</dt><dd className={"font-semibold " + (expired ? "text-red-700" : "text-neutral-800")}>{formatExpiry(staff.licenseExpiry)}</dd></div></dl>
            : <div className="mt-4 rounded-xl bg-neutral-50 p-3"><p className="text-xs text-neutral-500">Assigned trips</p><p className="mt-1 font-semibold text-neutral-800">{staff.assignedTrips?.length || 0} trip{staff.assignedTrips?.length === 1 ? "" : "s"}</p></div>}
          {(expired || securityUpdateRequired || driverRejected || staff.status === "SUSPENDED") && <div className="mt-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800"><AlertTriangle className="h-4 w-4 shrink-0" /><span>{staff.status === "SUSPENDED" || driverRejected ? "This driver is blocked. Contact Shuvmarg support before restoring access." : expired ? "The licence has expired. Upload a valid replacement before assignment." : "Upload the licence once to complete the automated security checks."}</span></div>}
          <div className="mt-4 flex flex-wrap gap-2">
            {staff.role === "conductor" && staff.accessStatus === "ACTIVE" && activeStatus(staff.status) && <button type="button" onClick={() => setTripTarget(staff)} className="flex items-center gap-2 rounded-lg border border-[#7A1D1B]/30 px-3 py-2 text-xs font-bold text-[#7A1D1B]"><BadgeCheck className="h-3.5 w-3.5" />Manage trips</button>}
            {staff.accessStatus === "INVITED" && activeStatus(staff.status) && <button type="button" onClick={() => setDialog({ existing: staff, resend: true })} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-800">Retry setup SMS</button>}
            {securityUpdateRequired && activeStatus(staff.status) && <button type="button" onClick={() => setDialog({ existing: staff })} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-800">Complete security check</button>}
            {staff.status === "INACTIVE" && !driverRejected && <button type="button" onClick={() => setDialog({ existing: staff })} className="rounded-lg border border-emerald-300 px-3 py-2 text-xs font-bold text-emerald-800">Rehire crew member</button>}
            {(staff.status === "AVAILABLE" || staff.status === "OFF_DUTY") && staff.userId && <button type="button" disabled={workingId === staff.id} onClick={() => updateStatus(staff, staff.status === "OFF_DUTY" ? "AVAILABLE" : "OFF_DUTY")} className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-bold text-neutral-700 disabled:opacity-50">{staff.status === "OFF_DUTY" ? "Mark available" : "Mark off duty"}</button>}
          </div>
        </article>;
      })}</div>}

    {totalPages > 1 && <nav aria-label="Crew pages" className="flex items-center justify-center gap-3"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage(value => value - 1)} className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-bold disabled:opacity-40">Previous</button><span className="text-sm text-neutral-500">Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages || loading} onClick={() => setPage(value => value + 1)} className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-bold disabled:opacity-40">Next</button></nav>}
    {dialog && <CrewAssignmentDialog brands={brands} initialRole={role} existing={dialog.existing} resend={dialog.resend} onClose={() => setDialog(null)} onSaved={saved} />}
    {tripTarget && <ConductorTripsDialog conductor={tripTarget} onClose={() => { setTripTarget(null); void load(); }} onSaved={message => setNotice({ text: message })} />}
  </section>;
}

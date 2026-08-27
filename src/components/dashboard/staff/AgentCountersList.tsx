"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LoaderCircle, Plus, Search, ShieldAlert, Store } from "lucide-react";
import { listMyBrands, type OperatorBrand } from "@/features/fleet-registration/api-brands";
import { listAgentAssignments, transitionAssignment } from "@/features/agent-assignment/api";
import type { AgentAssignment, AssignmentStatus } from "@/features/agent-assignment/agent-assignment-contract";
import AgentAssignmentDialog from "./AgentAssignmentDialog";
import AgentSummaryKpis, { type AgentSummary } from "./AgentSummaryKpis";

const EMPTY_SUMMARY: AgentSummary = { active: 0, invited: 0, suspended: 0 };
const STATUS_LABELS: Record<AssignmentStatus, string> = {
  ACTIVE: "Active", INVITED: "Waiting for reply", SUSPENDED: "Paused",
  REVOKED: "Ended", DECLINED: "Declined", EXPIRED: "Invite expired",
};
const STATUS_STYLES: Record<AssignmentStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800", INVITED: "bg-amber-100 text-amber-800",
  SUSPENDED: "bg-orange-100 text-orange-800", REVOKED: "bg-neutral-200 text-neutral-700",
  DECLINED: "bg-red-100 text-red-700", EXPIRED: "bg-neutral-100 text-neutral-600",
};
const ACCESS_LABELS = { ALL_BUSES: "All trips", ROUTES: "Selected routes", SCHEDULES: "Selected departures" } as const;

const commissionLabel = (row: AgentAssignment) => {
  if (row.commission.value === 0) return "No commission";
  if (row.commission.mode === "PERCENT") return `${row.commission.value}% of ticket price`;
  const unit = row.commission.mode === "FLAT_PER_SEAT" ? "per seat" : "per booking";
  return `Rs. ${row.commission.value} ${unit}`;
};

export default function AgentCountersList() {
  const [assignments, setAssignments] = useState<AgentAssignment[]>([]);
  const [brands, setBrands] = useState<OperatorBrand[]>([]);
  const [summary, setSummary] = useState<AgentSummary>(EMPTY_SUMMARY);
  const [brandId, setBrandId] = useState("");
  const [status, setStatus] = useState<AssignmentStatus | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  const loadAssignments = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const result = await listAgentAssignments({ brandId: brandId || undefined, status: status || undefined, page });
      setAssignments(result.data);
      const pageCount = Math.max(1, result.pagination.totalPages);
      setTotalPages(pageCount);
      if (page > pageCount) setPage(pageCount);
    } catch (failure) { setError((failure as Error).message); }
    finally { setLoading(false); }
  }, [brandId, page, status]);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const filters = (value: AssignmentStatus) => ({ brandId: brandId || undefined, status: value, limit: 1 });
      const [active, invited, suspended] = await Promise.all([
        listAgentAssignments(filters("ACTIVE")),
        listAgentAssignments(filters("INVITED")),
        listAgentAssignments(filters("SUSPENDED")),
      ]);
      setSummary({ active: active.pagination.total, invited: invited.pagination.total, suspended: suspended.pagination.total });
    } catch (failure) { setError((failure as Error).message); }
    finally { setSummaryLoading(false); }
  }, [brandId]);

  useEffect(() => {
    listMyBrands().then(setBrands).catch((failure: Error) => setError(failure.message));
  }, []);
  useEffect(() => {
    // Assignments are server state and must be reloaded when their filters change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAssignments();
  }, [loadAssignments]);
  useEffect(() => {
    // KPI totals are server state scoped to the selected brand.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSummary();
  }, [loadSummary]);

  const visible = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return assignments;
    return assignments.filter((row) => [row.agent.name, row.agent.agentCode, row.agent.businessName, row.brand.name]
      .some((value) => value?.toLowerCase().includes(query)));
  }, [assignments, searchQuery]);
  const isFiltered = Boolean(searchQuery.trim() || brandId || status);

  const refresh = async () => Promise.all([loadAssignments(), loadSummary()]);
  const act = async (assignment: AgentAssignment, action: "suspend" | "reinstate" | "revoke") => {
    const note = action === "reinstate" ? undefined : window.prompt(
      action === "suspend" ? "Why are you pausing this agent? (optional)" : "Why are you ending this agent's access? (optional)",
      assignment.operatorNote || "",
    );
    if (note === null) return;
    setWorkingId(assignment.assignmentId); setError("");
    try { await transitionAssignment(assignment.assignmentId, action, note || undefined); await refresh(); }
    catch (failure) { setError((failure as Error).message); }
    finally { setWorkingId(""); }
  };

  return <section className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="text-xl font-bold text-neutral-900">Ticket agents</h2><p className="mt-1 text-sm text-neutral-500">Invite agents and manage where they can sell.</p></div>
      <button type="button" onClick={() => setShowDialog(true)} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] px-5 text-sm font-bold text-white"><Plus className="h-4 w-4" />Add agent</button>
    </div>

    <AgentSummaryKpis summary={summary} loading={summaryLoading} />

    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
        <label className="relative"><span className="sr-only">Search agents</span><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by name or Agent ID" className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-10 pr-4 text-sm outline-none focus:border-[#7A1D1B]" /></label>
        <select aria-label="Filter by brand" value={brandId} onChange={(event) => { setBrandId(event.target.value); setPage(1); }} className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm"><option value="">All brands</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.brandName}</option>)}</select>
        <select aria-label="Filter by status" value={status} onChange={(event) => { setStatus(event.target.value as AssignmentStatus | ""); setPage(1); }} className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm"><option value="">All agents</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      </div>
    </div>

    {error && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><ShieldAlert className="h-5 w-5 shrink-0" />{error}</div>}
    {loading && assignments.length === 0 ? <div className="flex justify-center rounded-3xl border border-neutral-200 bg-white p-16"><LoaderCircle className="h-7 w-7 animate-spin text-[#7A1D1B]" /></div>
      : visible.length === 0 ? <div className="rounded-3xl border border-neutral-200 bg-white px-6 py-16 text-center shadow-sm"><Store className="mx-auto h-10 w-10 text-neutral-400" /><h3 className="mt-4 text-lg font-bold text-neutral-900">{isFiltered ? "No agents match these filters" : "No agents here yet"}</h3><p className="mt-2 text-sm text-neutral-500">{isFiltered ? "Try another name or clear the filters." : "Add your first ticket agent to get started."}</p></div>
      : <div className="grid gap-4 lg:grid-cols-2">{visible.map((row) => <article key={row.assignmentId} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-neutral-900">{row.agent.name || "Unnamed agent"}</h3><p className="mt-1 font-mono text-xs text-neutral-500">{row.agent.agentCode}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[row.status]}`}>{STATUS_LABELS[row.status]}</span></div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-neutral-500">Brand</dt><dd className="font-semibold text-neutral-800">{row.brand.name || "Unknown"}</dd></div><div><dt className="text-xs text-neutral-500">Tickets sold</dt><dd className="font-semibold text-neutral-800">{row.salesCount ?? 0}</dd></div><div><dt className="text-xs text-neutral-500">Trip access</dt><dd className="font-semibold text-neutral-800">{ACCESS_LABELS[row.access.accessScope]}</dd></div><div><dt className="text-xs text-neutral-500">Cash bookings</dt><dd className="font-semibold text-neutral-800">{row.permissions.canSellCash ? "Allowed" : "Not allowed"}</dd></div><div className="col-span-2"><dt className="text-xs text-neutral-500">Commission</dt><dd className="font-semibold text-neutral-800">{commissionLabel(row)}</dd></div></dl>
        {(row.statusReason || row.operatorNote) && <p className="mt-4 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600">{row.operatorNote || row.statusReason}</p>}
        <div className="mt-5 flex flex-wrap gap-2">{row.status === "ACTIVE" && <button type="button" disabled={workingId === row.assignmentId} onClick={() => void act(row, "suspend")} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-800">Pause access</button>}{row.status === "SUSPENDED" && <button type="button" disabled={workingId === row.assignmentId} onClick={() => void act(row, "reinstate")} className="rounded-lg border border-emerald-300 px-3 py-2 text-xs font-bold text-emerald-800">Restore access</button>}{["INVITED", "ACTIVE", "SUSPENDED"].includes(row.status) && <button type="button" disabled={workingId === row.assignmentId} onClick={() => void act(row, "revoke")} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">End access</button>}</div>
      </article>)}</div>}

    {totalPages > 1 && <nav className="flex items-center justify-center gap-3" aria-label="Agent pages"><button type="button" disabled={page === 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-bold disabled:opacity-40">Previous</button><span className="text-sm text-neutral-500">Page {page} of {totalPages}</span><button type="button" disabled={page === totalPages || loading} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-bold disabled:opacity-40">Next</button></nav>}
    {showDialog && <AgentAssignmentDialog brands={brands} onClose={() => setShowDialog(false)} onInvited={() => void refresh()} />}
  </section>;
}

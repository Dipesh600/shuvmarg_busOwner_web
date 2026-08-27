"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LoaderCircle, Plus, RefreshCw, ShieldAlert, Store } from "lucide-react";
import { listMyBrands, type OperatorBrand } from "@/features/fleet-registration/api-brands";
import { listAgentAssignments, transitionAssignment } from "@/features/agent-assignment/api";
import type { AgentAssignment, AssignmentStatus } from "@/features/agent-assignment/agent-assignment-contract";
import AgentAssignmentDialog from "./AgentAssignmentDialog";

interface Props { searchQuery: string; onCountChange?: (count: number) => void; }
const STATUS_STYLES: Record<AssignmentStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800", INVITED: "bg-amber-100 text-amber-800",
  SUSPENDED: "bg-orange-100 text-orange-800", REVOKED: "bg-neutral-200 text-neutral-700",
  DECLINED: "bg-red-100 text-red-700", EXPIRED: "bg-neutral-100 text-neutral-600",
};

export default function AgentCountersList({ searchQuery, onCountChange }: Props) {
  const [assignments, setAssignments] = useState<AgentAssignment[]>([]);
  const [brands, setBrands] = useState<OperatorBrand[]>([]);
  const [brandId, setBrandId] = useState("");
  const [status, setStatus] = useState<AssignmentStatus | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [brandRows, assignmentPage] = await Promise.all([
        listMyBrands(), listAgentAssignments({ brandId: brandId || undefined, status: status || undefined, page }),
      ]);
      setBrands(brandRows);
      setAssignments(assignmentPage.data);
      const pageCount = Math.max(1, assignmentPage.pagination.totalPages);
      setTotalPages(pageCount);
      if (page > pageCount) setPage(pageCount);
      onCountChange?.(assignmentPage.pagination.total);
    } catch (failure) { setError((failure as Error).message); }
    finally { setLoading(false); }
  }, [brandId, onCountChange, page, status]);

  useEffect(() => {
    // The assignment collection is external state; refetch whenever its server-side filters change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return assignments;
    return assignments.filter((row) => [row.agent.name, row.agent.agentCode, row.agent.businessName, row.brand.name]
      .some((value) => value?.toLowerCase().includes(query)));
  }, [assignments, searchQuery]);

  const act = async (assignment: AgentAssignment, action: "suspend" | "reinstate" | "revoke") => {
    const note = action === "reinstate" ? undefined : window.prompt(
      action === "suspend" ? "Optional reason for suspending this agent" : "Optional reason for ending this assignment",
      assignment.operatorNote || "",
    );
    if (note === null) return;
    setWorkingId(assignment.assignmentId); setError("");
    try { await transitionAssignment(assignment.assignmentId, action, note || undefined); await load(); }
    catch (failure) { setError((failure as Error).message); }
    finally { setWorkingId(""); }
  };

  if (loading && assignments.length === 0) return <div className="flex justify-center rounded-3xl border border-neutral-200 bg-white p-16"><LoaderCircle className="h-7 w-7 animate-spin text-[#7A1D1B]" /></div>;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row">
          <select value={brandId} onChange={(event) => { setBrandId(event.target.value); setPage(1); }} className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm"><option value="">All brands</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.brandName}</option>)}</select>
          <select value={status} onChange={(event) => { setStatus(event.target.value as AssignmentStatus | ""); setPage(1); }} className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm"><option value="">All statuses</option>{Object.keys(STATUS_STYLES).map((value) => <option key={value} value={value}>{value}</option>)}</select>
        </div>
        <div className="flex gap-2"><button type="button" onClick={() => void load()} className="rounded-xl border border-neutral-200 p-2.5 text-neutral-600" aria-label="Refresh agents"><RefreshCw className="h-4 w-4" /></button><button type="button" onClick={() => setShowDialog(true)} className="flex items-center gap-2 rounded-xl bg-[#7A1D1B] px-4 py-2.5 text-sm font-bold text-white"><Plus className="h-4 w-4" />Add agent</button></div>
      </div>

      {error && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><ShieldAlert className="h-5 w-5 shrink-0" />{error}</div>}

      {visible.length === 0 ? <div className="rounded-[24px] border border-neutral-200 bg-white px-6 py-16 text-center shadow-sm"><Store className="mx-auto h-10 w-10 text-neutral-400" /><h2 className="mt-4 text-lg font-bold text-neutral-900">{searchQuery.trim() ? "No matching agents" : "No agents connected yet"}</h2><p className="mt-2 text-sm text-neutral-500">Add an existing agent by their Shuvmarg ID or create a new invited account.</p></div> : <div className="grid gap-4 lg:grid-cols-2">{visible.map((row) => <article key={row.assignmentId} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-neutral-900">{row.agent.name || "Unnamed agent"}</h3><p className="mt-1 font-mono text-xs text-neutral-500">{row.agent.agentCode}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[row.status]}`}>{row.status}</span></div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-neutral-500">Operator</dt><dd className="font-semibold text-neutral-800">{row.brand.name || "Unknown"}</dd></div><div><dt className="text-xs text-neutral-500">Sales</dt><dd className="font-semibold text-neutral-800">{row.salesCount ?? 0}</dd></div><div><dt className="text-xs text-neutral-500">Access</dt><dd className="font-semibold text-neutral-800">{row.access.accessScope.replaceAll("_", " ")}</dd></div><div><dt className="text-xs text-neutral-500">Cash sales</dt><dd className="font-semibold text-neutral-800">{row.permissions.canSellCash ? "Allowed" : "Blocked"}</dd></div><div><dt className="text-xs text-neutral-500">Commission</dt><dd className="font-semibold text-neutral-800">{row.commission.value} · {row.commission.mode.replaceAll("_", " ")}</dd></div></dl>
        {(row.statusReason || row.operatorNote) && <p className="mt-4 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600">{row.operatorNote || row.statusReason}</p>}
        <div className="mt-5 flex flex-wrap gap-2">{row.status === "ACTIVE" && <button type="button" disabled={workingId === row.assignmentId} onClick={() => void act(row, "suspend")} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-800">Suspend</button>}{row.status === "SUSPENDED" && <button type="button" disabled={workingId === row.assignmentId} onClick={() => void act(row, "reinstate")} className="rounded-lg border border-emerald-300 px-3 py-2 text-xs font-bold text-emerald-800">Reinstate</button>}{["INVITED", "ACTIVE", "SUSPENDED"].includes(row.status) && <button type="button" disabled={workingId === row.assignmentId} onClick={() => void act(row, "revoke")} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Revoke</button>}</div>
      </article>)}</div>}

      {totalPages > 1 && <nav className="flex items-center justify-center gap-3" aria-label="Agent pages"><button type="button" disabled={page === 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-bold disabled:opacity-40">Previous</button><span className="text-sm text-neutral-500">Page {page} of {totalPages}</span><button type="button" disabled={page === totalPages || loading} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-bold disabled:opacity-40">Next</button></nav>}

      {showDialog && <AgentAssignmentDialog brands={brands} onClose={() => setShowDialog(false)} onInvited={() => void load()} />}
    </section>
  );
}

"use client";

import { isApiRateLimited } from "@/lib/auth";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Store,
} from "lucide-react";
import { listMyBrands, type OperatorBrand } from "@/features/fleet-registration/api-brands";
import { listAgentAssignments, transitionAssignment, type AssignmentView } from "@/features/agent-assignment/api";
import type { AgentAssignment, AssignmentStatus } from "@/features/agent-assignment/agent-assignment-contract";
import AgentAssignmentDialog from "./AgentAssignmentDialog";
import AgentProfileScreen from "./profile/AgentProfileScreen";
import { AgentSearchableSelect } from "./AgentFormControls";

const STATUS_LABELS: Record<AssignmentStatus, string> = {
  ACTIVE: "Agent access active",
  INVITED: "Invitation pending",
  SUSPENDED: "Access paused by you",
  REVOKED: "Access ended by you",
  DECLINED: "Agent declined invite",
  EXPIRED: "Invite expired",
};

const STATUS_PILL_STYLES: Record<AssignmentStatus, string> = {
  ACTIVE: "bg-[#E8F8F0] text-[#1E7E4E]",
  INVITED: "bg-[#FEF6EE] text-[#B54708]",
  SUSPENDED: "bg-[#FFF0ED] text-[#D93829]",
  REVOKED: "bg-neutral-100 text-neutral-600",
  DECLINED: "bg-red-50 text-red-700",
  EXPIRED: "bg-neutral-100 text-neutral-600",
};

type AgentListTab = "ACTIVE" | Extract<AssignmentView, "INVITATIONS" | "STOPPED">;

const LIST_TABS: { value: AgentListTab; label: string }[] = [
  { value: "ACTIVE", label: "Active agents" },
  { value: "INVITATIONS", label: "Invitations" },
  { value: "STOPPED", label: "Paused & removed" },
];

const EMPTY_TAB: Record<AgentListTab, { title: string; help: string }> = {
  ACTIVE: { title: "No active agents", help: "Agents appear here after accepting your invitation." },
  INVITATIONS: { title: "No invitations", help: "New, declined and expired invitations appear here." },
  STOPPED: { title: "No paused or removed agents", help: "Agents appear here when you pause or end their access." },
};

const ACCESS_LABELS = {
  ALL_BUSES: "All trips",
  ROUTES: "Selected routes",
  SCHEDULES: "Selected departures",
} as const;

const AUTO_REFRESH_MS = 60_000;

const commissionLabel = (row: AgentAssignment) => {
  if (row.commission.value === 0) return "No commission";
  if (row.commission.mode === "PERCENT") return `${row.commission.value}% per ticket`;
  const unit = row.commission.mode === "FLAT_PER_SEAT" ? "per seat" : "per booking";
  return `Rs. ${row.commission.value} ${unit}`;
};

interface AgentCountersListProps {
  onSelectAgent?: (agent: AgentAssignment) => void;
}

export default function AgentCountersList({ onSelectAgent }: AgentCountersListProps = {}) {
  const [assignments, setAssignments] = useState<AgentAssignment[]>([]);
  const [brands, setBrands] = useState<OperatorBrand[]>([]);
  const [brandId, setBrandId] = useState("");
  const [status, setStatus] = useState<AgentListTab>("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentAssignment | null>(null);
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const loadingRequestIdRef = useRef<number | null>(null);

  const loadAssignments = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    const requestId = ++requestIdRef.current;
    if (!silent) {
      loadingRequestIdRef.current = requestId;
      setLoading(true);
    }
    setError("");
    try {
      const groupedView = status === "INVITATIONS" || status === "STOPPED";
      const result = await listAgentAssignments({
        brandId: brandId || undefined,
        ...(groupedView ? { view: status } : { status }),
        page,
      });
      if (requestId !== requestIdRef.current) return;
      setAssignments(result.data);
      const pageCount = Math.max(1, result.pagination.totalPages);
      setTotalPages(pageCount);
      if (page > pageCount) setPage(pageCount);
    } catch (failure) {
      if (requestId !== requestIdRef.current) return;
      if (!silent) setAssignments([]);
      setError(silent ? "Could not refresh agents. Showing the last loaded list." : (failure as Error).message);
    } finally {
      if (!silent && loadingRequestIdRef.current === requestId) {
        loadingRequestIdRef.current = null;
        setLoading(false);
      }
    }
  }, [brandId, page, status]);

  useEffect(() => {
    listMyBrands().then(setBrands).catch((failure: Error) => setError(failure.message));
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => { if (active) void loadAssignments(); });
    return () => { active = false; };
  }, [loadAssignments]);

  useEffect(() => {
    let lastRefresh = Date.now();
    const refreshVisibleList = () => {
      if (document.visibilityState !== "visible" || isApiRateLimited() || Date.now() - lastRefresh < AUTO_REFRESH_MS) return;
      lastRefresh = Date.now();
      void loadAssignments({ silent: true });
    };
    window.addEventListener("focus", refreshVisibleList);
    document.addEventListener("visibilitychange", refreshVisibleList);
    const interval = window.setInterval(refreshVisibleList, AUTO_REFRESH_MS);
    return () => {
      window.removeEventListener("focus", refreshVisibleList);
      document.removeEventListener("visibilitychange", refreshVisibleList);
      window.clearInterval(interval);
    };
  }, [loadAssignments]);

  useEffect(() => {
    const handleClickOutside = () => setOpenActionId(null);
    if (openActionId) window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [openActionId]);

  const visible = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return assignments;
    return assignments.filter((row) =>
      [row.agent.name, row.agent.agentCode, row.agent.businessName, row.brand.name].some((value) =>
        value?.toLowerCase().includes(query)
      )
    );
  }, [assignments, searchQuery]);

  const isFiltered = Boolean(searchQuery.trim() || brandId);

  const refresh = () => loadAssignments();

  const act = async (assignment: AgentAssignment, action: "suspend" | "reinstate" | "revoke") => {
    const note =
      action === "reinstate"
        ? undefined
        : window.prompt(
            action === "suspend"
              ? "Why are you pausing this agent? (optional)"
              : "Why are you ending this agent's access? (optional)",
            assignment.operatorNote || ""
          );
    if (note === null) return;
    setWorkingId(assignment.assignmentId);
    setError("");
    try {
      await transitionAssignment(assignment.assignmentId, action, note || undefined);
      await refresh();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setWorkingId("");
    }
  };

  if (selectedAgent) {
    return (
      <AgentProfileScreen
        assignment={selectedAgent}
        onBack={() => setSelectedAgent(null)}
      />
    );
  }

  return (
    <section className="space-y-5">
      {/* ── Page Header (Matching Reference) ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">Ticket agents</h2>
          <p className="mt-1 text-xs sm:text-sm text-neutral-500">Invite agents and manage where they can sell.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          <button
            type="button"
            onClick={() => void loadAssignments()}
            disabled={loading}
            aria-label="Refresh agents"
            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-xs sm:text-sm font-bold text-neutral-700 hover:bg-neutral-50 transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowDialog(true)}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] px-5 text-xs sm:text-sm font-bold text-white hover:bg-[#631715] transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Add or connect agent
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Table Workspace Card Container (Matching Reference Mockup) ── */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white shadow-xs overflow-hidden">
        {/* Toolbar: Pill Tabs on Left, Search and Brand on Right */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div role="tablist" aria-label="Agent status" className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {LIST_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={status === tab.value}
                onClick={() => {
                  setStatus(tab.value);
                  setPage(1);
                }}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                  status === tab.value
                    ? "bg-[#7A1D1B] text-white shadow-xs"
                    : "bg-[#F7F3F1] text-[#635B55] hover:bg-[#EFE7E3]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Name or Agent ID"
                className="h-10 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-4 text-xs font-semibold text-neutral-800 outline-none transition focus:border-[#7A1D1B] focus:ring-2 focus:ring-[#7A1D1B]/10"
              />
            </div>
            <div className="min-w-[180px]">
              <AgentSearchableSelect
                label=""
                value={brandId}
                showRequirement={false}
                placeholder="All brands"
                options={[
                  { value: "", label: "All brands" },
                  ...brands.map((brand) => ({
                    value: brand.id,
                    label: brand.brandName,
                    group: `${brand.status.toLocaleLowerCase()} brand`,
                  })),
                ]}
                onChange={(value) => {
                  setBrandId(value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Table Content ("Format in line rather than that card") ── */}
        {loading && assignments.length === 0 ? (
          <div className="flex justify-center p-16">
            <LoaderCircle className="h-7 w-7 animate-spin text-[#7A1D1B]" />
          </div>
        ) : visible.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF8F5] text-[#7A1D1B] border border-neutral-200/80 shadow-xs">
              <Store className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-neutral-900">
              {isFiltered ? "No agents match these filters" : EMPTY_TAB[status].title}
            </h3>
            <p className="mt-1.5 text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
              {isFiltered
                ? "Try searching a different name or clearing your brand filters."
                : "Invite counter agents across bus parks to sell tickets and expand your distribution across Nepal."}
            </p>
            {!isFiltered && (
              <button
                type="button"
                onClick={() => setShowDialog(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#7A1D1B] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#631715] transition-colors shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add or connect agent
              </button>
            )}
            {!isFiltered && status === "INVITATIONS" && (
              <button
                type="button"
                onClick={() => setShowDialog(true)}
                className="mt-3 block mx-auto text-xs font-bold text-[#7A1D1B] hover:underline"
              >
                Connect existing agent
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-neutral-100 bg-[#FAF9F7]/60 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  <th className="px-4 py-3.5">Agent</th>
                  <th className="px-4 py-3.5">Brand</th>
                  <th className="px-4 py-3.5">Tickets sold</th>
                  <th className="px-4 py-3.5">Commission</th>
                  <th className="px-4 py-3.5">Cash bookings</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {visible.map((row) => {
                  const initials = (row.agent.name || "Agent")
                    .split(" ")
                    .map((w) => w[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <tr
                      key={row.assignmentId}
                      onClick={() => {
                        if (onSelectAgent) {
                          onSelectAgent(row);
                        } else {
                          setSelectedAgent(row);
                        }
                      }}
                      className="hover:bg-[#FAF8F5]/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF0ED] text-[#7A1D1B] font-bold text-xs border border-[#FAD8D3]">
                            {initials}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-neutral-900 truncate group-hover:text-[#7A1D1B] transition-colors">
                              {row.agent.name || "Unnamed agent"}
                            </p>
                            <p className="font-mono text-[11px] text-neutral-400">{row.agent.agentCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-700 font-medium">
                        {row.brand.name || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-neutral-700 font-medium">
                        {row.salesCount ?? 0}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        {commissionLabel(row)}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        {row.permissions.canSellCash ? "Allowed" : "Not allowed"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            STATUS_PILL_STYLES[row.status]
                          }`}
                        >
                          {STATUS_LABELS[row.status]}
                        </span>
                        {row.status === "INVITED" && (
                          <p className="sr-only">The settings below start only after the agent accepts this invitation.</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={() => setOpenActionId(openActionId === row.assignmentId ? null : row.assignmentId)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                            title="Agent options"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          {openActionId === row.assignmentId && (
                            <div className="absolute right-0 top-9 z-30 w-44 rounded-xl border border-neutral-200 bg-white py-1.5 shadow-lg text-xs font-semibold animate-in fade-in duration-100">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onSelectAgent) {
                                    onSelectAgent(row);
                                  } else {
                                    setSelectedAgent(row);
                                  }
                                  setOpenActionId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                              >
                                View profile
                              </button>
                              {row.status === "ACTIVE" && <button
                                type="button"
                                disabled={workingId === row.assignmentId}
                                onClick={() => {
                                  setOpenActionId(null);
                                  void act(row, "suspend");
                                }}
                                className="w-full px-3 py-2 text-left text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                              >
                                Pause access
                              </button>}
                              {row.status === "SUSPENDED" && (
                                <button
                                  type="button"
                                  disabled={workingId === row.assignmentId}
                                  onClick={() => {
                                    setOpenActionId(null);
                                    void act(row, "reinstate");
                                  }}
                                  className="w-full px-3 py-2 text-left text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                                >
                                  Restore access
                                </button>
                              )}
                              {["INVITED", "ACTIVE", "SUSPENDED"].includes(row.status) && (
                                <button
                                  type="button"
                                  disabled={workingId === row.assignmentId}
                                  onClick={() => {
                                    setOpenActionId(null);
                                    void act(row, "revoke");
                                  }}
                                  className="w-full px-3 py-2 text-left text-red-700 hover:bg-red-50 flex items-center gap-2"
                                >
                                  End access
                                </button>
                              )}
                            </div>
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
          <span>{visible.length} agents</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                  p === page
                    ? "bg-[#FFF0ED] text-[#7A1D1B]"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-neutral-100 disabled:opacity-30 text-neutral-600 transition-colors"
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {showDialog && (
        <AgentAssignmentDialog
          brands={brands}
          onClose={() => setShowDialog(false)}
          onInvited={() => {
            if (status === "INVITATIONS" && page === 1) void refresh();
            else {
              setStatus("INVITATIONS");
              setPage(1);
            }
          }}
        />
      )}
    </section>
  );
}

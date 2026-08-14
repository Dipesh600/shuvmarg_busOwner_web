"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, BusFront, Loader2, Plus, RefreshCw, Search } from "lucide-react";
import FleetSetupResumeBar from "@/components/dashboard/fleet/FleetSetupResumeBar";
import FleetRegistrationFlow from "@/features/fleet-registration/FleetRegistrationFlow";
import { listOperatorFleets, submitFleetDraft, type FleetListItem } from "@/features/fleet-registration/api";
import { fetchOperatorDashboardState } from "@/features/operator-dashboard/operator-dashboard-api";
import { subscribeToDataRefresh } from "@/lib/data-refresh";
import {
  hasFleetRegistrationDraft,
  setActiveDraftId,
  subscribeToFleetDraftChanges,
} from "@/features/fleet-registration/fleet-registration-draft-storage";

export default function FleetPage() {
  const [items, setItems] = useState<FleetListItem[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [businessApproved, setBusinessApproved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    try {
      const [fleets, dashboard] = await Promise.all([listOperatorFleets(), fetchOperatorDashboardState()]);
      setItems(fleets);
      setBusinessApproved(dashboard.verificationStatus === "approved");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load fleet.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([listOperatorFleets(), fetchOperatorDashboardState()])
      .then(([fleets, dashboard]) => {
        if (!active) return;
        setItems(fleets);
        setBusinessApproved(dashboard.verificationStatus === "approved");
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load fleet.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => subscribeToDataRefresh(() => { void load(true); }), [load]);

  useEffect(() => {
    const updateDraftState = () => setHasLocalDraft(hasFleetRegistrationDraft());
    updateDraftState();
    return subscribeToFleetDraftChanges(updateDraftState);
  }, [open]);

  function handleStartFresh() {
    setActiveDraftId(null);
    setOpen(true);
  }

  async function submitPreparedFleet(fleetId: string) {
    setSubmittingId(fleetId);
    setError(null);
    try {
      await submitFleetDraft(fleetId);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to submit the prepared vehicle.");
    } finally {
      setSubmittingId(null);
    }
  }

  const visible = useMemo(() => {
    const value = query.trim().toLowerCase();
    return items.filter((item) => `${item.busName} ${item.busNumber} ${item.busType}`.toLowerCase().includes(value));
  }, [items, query]);

  return (
    <div className="min-h-full bg-[#FAF8F5] p-5 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A1D1B]">Fleet</p>
            <h1 className="mt-1 text-3xl font-black text-[#191512]">Your buses</h1>
          </div>
          <div className="flex items-center gap-2">
            {hasLocalDraft && (
              <button
                onClick={handleStartFresh}
                className="flex h-11 items-center justify-center rounded-xl border border-[#DCD4CD] bg-white px-4 text-xs font-black text-[#191512] hover:border-[#7A1D1B] transition shadow-2xs"
              >
                <Plus className="mr-1.5 size-4 text-[#7A1D1B]" />
                Start another bus
              </button>
            )}
            <button
              onClick={() => setOpen(true)}
              className="flex h-11 items-center justify-center rounded-xl bg-[#7A1D1B] px-5 text-xs font-black text-white shadow-sm transition hover:bg-[#641715]"
            >
              <Plus className="mr-2 size-4" />
              {hasLocalDraft ? "Continue bus setup" : "Add bus"}
            </button>
          </div>
        </header>

        <FleetSetupResumeBar
          fleets={items}
          businessApproved={businessApproved}
          hasLocalDraft={hasLocalDraft}
          onAdd={() => setOpen(true)}
          onManageDrafts={() => setOpen(true)}
          onStartFresh={handleStartFresh}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="shrink-0 text-xs font-bold text-[#746E69]">
            {items.length} bus{items.length === 1 ? "" : "es"}
          </p>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 size-4 text-[#938A82]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search buses by name, number, or class"
              className="h-11 w-full rounded-xl border border-[#E8E1DB] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#7A1D1B]"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex h-56 items-center justify-center rounded-3xl border border-[#E8E1DB] bg-white text-sm text-[#746E69]">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Loading fleet…
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-white p-8 text-center">
            <AlertCircle className="mx-auto size-6 text-red-700" />
            <p className="mt-3 text-sm font-bold">{error}</p>
            <button onClick={() => void load()} className="mt-4 text-xs font-black text-[#7A1D1B]">
              <RefreshCw className="mr-1 inline size-3.5" />
              Retry
            </button>
          </div>
        ) : visible.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((fleet) => {
              const status = String(fleet.approvalStatus || "DRAFT").toUpperCase();
              const statusLabel =
                status === "APPROVED"
                  ? "Ready"
                  : status === "PENDING"
                    ? "In review"
                    : status === "REJECTED"
                      ? "Needs changes"
                      : "Draft";
              const isDraft = status === "DRAFT";
              const documentsReady = Boolean(
                fleet.documentSummary?.totalSlots &&
                  fleet.documentSummary.present === fleet.documentSummary.totalSlots
              );
              return (
                <article
                  id={`fleet-${fleet.fleetId}`}
                  key={fleet.fleetId}
                  className="scroll-mt-6 rounded-3xl border border-[#E8E1DB] bg-white p-5 shadow-sm target:border-[#7A1D1B] target:ring-2 target:ring-[#7A1D1B]/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#7A1D1B]">
                      <BusFront className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-black text-[#191512]">{fleet.busName}</h2>
                      <p className="mt-0.5 font-mono text-[10px] font-bold text-[#746E69]">
                        {fleet.busNumber}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#FAF8F5] px-2.5 py-1 text-[9px] font-black text-[#655E58]">
                      {statusLabel}
                    </span>
                  </div>
                  <div className="mt-4 flex justify-between border-t border-[#EEE8E2] pt-3 text-[10px] text-[#746E69]">
                    <span>{fleet.busType}</span>
                    <span className="font-bold">{fleet.totalSeats} places</span>
                  </div>
                  {isDraft && businessApproved && documentsReady ? (
                    <button
                      type="button"
                      onClick={() => void submitPreparedFleet(fleet.fleetId)}
                      disabled={submittingId === fleet.fleetId}
                      className="mt-4 flex h-10 w-full items-center justify-center rounded-xl bg-[#7A1D1B] text-xs font-black text-white disabled:opacity-50"
                    >
                      {submittingId === fleet.fleetId ? (
                        <>
                          <Loader2 className="mr-2 size-3.5 animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        "Submit for review"
                      )}
                    </button>
                  ) : isDraft && !businessApproved ? (
                    <p className="mt-4 rounded-xl bg-[#FAF8F5] px-3 py-2.5 text-center text-[10px] font-bold text-[#746E69]">
                      Saved. You can finish this bus while verification continues.
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-[#DCD4CD] bg-white p-10 text-center">
            <BusFront className="mx-auto size-8 text-[#7A1D1B]" />
            <h2 className="mt-4 text-lg font-black">Add your first bus</h2>
            <button
              onClick={() => setOpen(true)}
              className="mt-5 rounded-xl bg-[#191512] px-5 py-3 text-xs font-black text-white"
            >
              Add bus
            </button>
          </div>
        )}

        <FleetRegistrationFlow
          open={open}
          canSubmitForReview={businessApproved}
          onClose={() => setOpen(false)}
          onRegistered={() => {
            setHasLocalDraft(false);
            void load();
          }}
        />
      </div>
    </div>
  );
}

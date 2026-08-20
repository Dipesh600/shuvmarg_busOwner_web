"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, BusFront, Loader2, RefreshCw } from "lucide-react";
import FleetSetupResumeBar from "@/components/dashboard/fleet/FleetSetupResumeBar";
import FleetRegistrationFlow from "@/features/fleet-registration/FleetRegistrationFlow";
import { getFleetDetail, listOperatorFleets, submitFleetDraft, type FleetListItem } from "@/features/fleet-registration/api";
import { fetchOperatorDashboardState } from "@/features/operator-dashboard/operator-dashboard-api";
import type { OperatorDashboardState } from "@/features/operator-dashboard/operator-dashboard-contract";
import { subscribeToDataRefresh } from "@/lib/data-refresh";
import {
  cleanupLockedServerFleetDrafts,
  hasFleetRegistrationDraft,
  setActiveDraftId,
  subscribeToFleetDraftChanges,
  getDraftForServerFleet,
  generateDraftId,
  saveFleetRegistrationDraft,
} from "@/features/fleet-registration/fleet-registration-draft-storage";
import { EMPTY_FLEET_DRAFT, type FleetRegistrationDraft } from "@/features/fleet-registration/types";

// Extracted Components
import { FleetPageHeader } from "./components/FleetPageHeader";
import { FleetSearch } from "./components/FleetSearch";
import { FleetCard } from "./components/FleetCard";
import SubmittedFleetPreviewModal from "./components/SubmittedFleetPreviewModal";

export default function FleetPage() {
  const [items, setItems] = useState<FleetListItem[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [readOnlyMode, setReadOnlyMode] = useState(false);
  const [businessApproved, setBusinessApproved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const [previewFleetId, setPreviewFleetId] = useState<string | null>(null);
  const [dashboardState, setDashboardState] = useState<OperatorDashboardState | null>(null);
  const [correctionReason, setCorrectionReason] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    try {
      const [fleets, dashboard] = await Promise.all([
        listOperatorFleets(),
        fetchOperatorDashboardState(),
      ]);
      setItems(fleets);
      setDashboardState(dashboard);
      setBusinessApproved(dashboard.verificationStatus === "approved");
      void cleanupLockedServerFleetDrafts(fleets);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load fleet."
      );
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
        setDashboardState(dashboard);
        setBusinessApproved(dashboard.verificationStatus === "approved");
        void cleanupLockedServerFleetDrafts(fleets);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Unable to load fleet."
          );
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
    setCorrectionReason(null);
    setReadOnlyMode(false);
    setOpen(true);
  }

  function handleOpenFleet(draftId: string | null, readOnly: boolean = false, reason: string | null = null) {
    if (draftId) setActiveDraftId(draftId);
    setCorrectionReason(reason);
    setReadOnlyMode(readOnly);
    setOpen(true);
  }



  async function submitPreparedFleet(fleetId: string) {
    setSubmittingId(fleetId);
    setError(null);
    try {
      await submitFleetDraft(fleetId);
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to submit the prepared vehicle."
      );
    } finally {
      setSubmittingId(null);
    }
  }

  async function correctRejectedFleet(fleetId: string) {
    setError(null);
    try {
      const data = await getFleetDetail(fleetId);
      const docs = data.documents || {};
      const serverFile = { __serverFile: true } as unknown as File;
      const route = data.route || {};
      const correctionDraft: FleetRegistrationDraft = {
        vehicle: {
          brandId: data.brandId || "",
          busName: data.busName || data.vehicle?.busName || "",
          busNumber: data.busNumber || data.vehicle?.busNumber || "",
          busType: data.busType || data.vehicle?.busType || "DELUXE",
          vehicleType: data.vehicleType || data.vehicle?.vehicleType || "BUS",
          registrationYear: data.registrationYear || data.vehicle?.registrationYear || "",
          amenityIds: data.features || data.vehicle?.features || [],
        },
        route: {
          ...EMPTY_FLEET_DRAFT.route,
          origin: route.origin || "",
          destination: route.destination || "",
          selectedVariant: route.selectedVariant || null,
          servedStops: route.servedStops || [],
          addedPlaces: route.addedPlaces || [],
          returnEnabled: route.returnEnabled ?? true,
          resolutionStatus: route.resolutionStatus || "AVAILABLE",
        },
        layout: data.seatLayout?.layout ? {
          templateId: data.seatLayout.templateId ?? null,
          templateName: "Current fleet layout",
          revisionId: data.seatLayout.revisionId ?? null,
          totalPlaces: data.seatLayout.totalPlaces || data.totalSeats || 0,
          layout: data.seatLayout.layout,
        } : null,
        files: {
          photos: {
            front: docs.fleetImages?.present ? serverFile : null,
            rear: docs.fleetImages?.present ? serverFile : null,
            side: docs.fleetImages?.present ? serverFile : null,
            cabin: docs.fleetImages?.present ? serverFile : null,
          },
          fitnessCert: docs.fitnessCert?.present ? serverFile : null,
          insurance: docs.insurance?.present ? serverFile : null,
          bluebook: docs.bluebook?.present ? serverFile : null,
          routePermit: docs.routePermit?.present ? serverFile : null,
        },
        documents: {
          fitnessValidTill: docs.fitnessCert?.validTill || "",
          insurancePolicyNumber: docs.insurance?.policyNumber || "",
          insuranceValidTill: docs.insurance?.validTill || "",
          routePermitValidTill: docs.routePermit?.validTill || "",
        },
      };
      const draftId = generateDraftId();
      await saveFleetRegistrationDraft(
        draftId,
        correctionDraft,
        "review",
        ["vehicle", "layout", "photos", "documents", "route"],
        fleetId,
      );
      handleOpenFleet(
        draftId,
        false,
        data.rejectionReason || "Shuvmarg requested corrections before resubmission.",
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to open the requested corrections.");
    }
  }

  const visible = useMemo(() => {
    const value = query.trim().toLowerCase();
    return items.filter((item) =>
      `${item.busName} ${item.busNumber} ${item.busType}`
        .toLowerCase()
        .includes(value)
    );
  }, [items, query]);

  return (
    <div className="min-h-full bg-[#FAF8F5] p-5 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <FleetPageHeader
          hasLocalDraft={hasLocalDraft}
          onStartFresh={handleStartFresh}
          onAddBus={() => handleOpenFleet(null, false)}
        />

        <FleetSetupResumeBar
          fleets={items}
          businessApproved={businessApproved}
          hasLocalDraft={hasLocalDraft}
          onAdd={() => handleOpenFleet(null, false)}
          onManageDrafts={() => handleOpenFleet(null, false)}
          onStartFresh={handleStartFresh}
        />

        <FleetSearch
          query={query}
          onQueryChange={setQuery}
          count={items.length}
        />

        {loading ? (
          <div className="flex h-56 items-center justify-center rounded-3xl border border-[#E8E1DB] bg-white text-sm text-[#746E69]">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Loading fleet…
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-white p-8 text-center">
            <AlertCircle className="mx-auto size-6 text-red-700" />
            <p className="mt-3 text-sm font-bold">{error}</p>
            <button
              onClick={() => void load()}
              className="mt-4 text-xs font-black text-[#7A1D1B]"
            >
              <RefreshCw className="mr-1 inline size-3.5" />
              Retry
            </button>
          </div>
        ) : visible.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((fleet) => {
              const localDraftId = getDraftForServerFleet(
                fleet.fleetId,
                fleet.busNumber
              );

              return (
                <FleetCard
                  key={fleet.fleetId}
                  fleet={fleet}
                  businessApproved={businessApproved}
                  localDraftId={localDraftId}
                  submittingId={submittingId}
                  onOpenFleet={handleOpenFleet}
                  onPreviewFleet={setPreviewFleetId}
                  onSubmitPreparedFleet={submitPreparedFleet}
                  onCorrectRejectedFleet={correctRejectedFleet}
                />
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-[#DCD4CD] bg-white p-10 text-center">
            <BusFront className="mx-auto size-8 text-[#7A1D1B]" />
            <h2 className="mt-4 text-lg font-black">Add your first bus</h2>
            <button
              onClick={() => handleOpenFleet(null, false)}
              className="mt-5 rounded-xl bg-[#191512] px-5 py-3 text-xs font-black text-white"
            >
              Add bus
            </button>
          </div>
        )}

        <FleetRegistrationFlow
          open={open}
          canSubmitForReview={businessApproved}
          readOnly={readOnlyMode}
          correctionReason={correctionReason}
          onClose={() => setOpen(false)}
          onRegistered={() => {
            setHasLocalDraft(false);
            void load();
          }}
        />

        {previewFleetId && dashboardState && (
          <SubmittedFleetPreviewModal
            fleetId={previewFleetId}
            ownerId={dashboardState.profile?.ownerId || ""}
            onClose={() => setPreviewFleetId(null)}
          />
        )}
      </div>
    </div>
  );
}

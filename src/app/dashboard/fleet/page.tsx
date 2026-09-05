"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, BusFront, Loader2, RefreshCw } from "lucide-react";
import FleetSetupResumeBar from "@/components/dashboard/fleet/FleetSetupResumeBar";
import FleetRegistrationFlow from "@/features/fleet-registration/FleetRegistrationFlow";
import { getFleetDetail, getFleetSubmissionFileUrls, type FleetListItem, type FleetReviewRequirement, type FleetReviewRequirementKey } from "@/features/fleet-registration/api";
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
  loadFleetRegistrationDraft,
  saveFleetRegistrationDraft,
} from "@/features/fleet-registration/fleet-registration-draft-storage";
import { EMPTY_FLEET_DRAFT, type FleetRegistrationDraft, type FleetStep } from "@/features/fleet-registration/types";
import { validateFleetStep } from "@/features/fleet-registration/validation";

// Extracted Components
import { FleetPageHeader } from "./components/FleetPageHeader";
import { FleetSearch } from "./components/FleetSearch";
import { FleetCard } from "./components/FleetCard";
import SubmittedFleetPreviewModal from "./components/SubmittedFleetPreviewModal";

export default function FleetPage() {
  const router = useRouter();
  const [items, setItems] = useState<FleetListItem[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [readOnlyMode, setReadOnlyMode] = useState(false);
  const [businessApproved, setBusinessApproved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const [previewFleetId, setPreviewFleetId] = useState<string | null>(null);
  const [dashboardState, setDashboardState] = useState<OperatorDashboardState | null>(null);
  const [correctionReason, setCorrectionReason] = useState<string | null>(null);
  const [correctionRequirements, setCorrectionRequirements] = useState<Partial<Record<FleetReviewRequirementKey, FleetReviewRequirement>>>({});
  const [activeView, setActiveView] = useState<"ALL" | "DRAFT" | "PENDING" | "REJECTED" | "APPROVED">("ALL");

  const applyDashboard = useCallback((dashboard: OperatorDashboardState) => {
    const fleets: FleetListItem[] = dashboard.fleet.items.map((fleet) => ({
      ...fleet,
      busType: fleet.busType || "Bus",
      totalSeats: fleet.totalSeats || 0,
      status: fleet.status || "",
    }));
    setItems(fleets);
    setDashboardState(dashboard);
    setBusinessApproved(dashboard.verificationStatus === "approved");
    void cleanupLockedServerFleetDrafts(fleets);
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    try {
      const dashboard = await fetchOperatorDashboardState({ force: true });
      applyDashboard(dashboard);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load buses."
      );
    } finally {
      setLoading(false);
    }
  }, [applyDashboard]);

  useEffect(() => {
    let active = true;
    fetchOperatorDashboardState()
      .then((dashboard) => {
        if (!active) return;
        applyDashboard(dashboard);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Unable to load buses."
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applyDashboard]);

  useEffect(() => subscribeToDataRefresh(() => { void load(true); }), [load]);

  useEffect(() => {
    const updateDraftState = () => setHasLocalDraft(hasFleetRegistrationDraft());
    updateDraftState();
    return subscribeToFleetDraftChanges(updateDraftState);
  }, [open]);

  function handleStartFresh() {
    setActiveDraftId(null);
    setCorrectionReason(null);
    setCorrectionRequirements({});
    setReadOnlyMode(false);
    setOpen(true);
  }

  function handleOpenFleet(draftId: string | null, readOnly: boolean = false, reason: string | null = null) {
    if (draftId) setActiveDraftId(draftId);
    setCorrectionReason(reason);
    setReadOnlyMode(readOnly);
    setOpen(true);
  }



  async function openServerFleet(fleetId: string, correction: boolean) {
    setError(null);
    try {
      const data = await getFleetDetail(fleetId);
      setCorrectionRequirements(correction ? data.reviewRequirements || {} : {});
      const docs = data.documents || {};
      const fileUrls = await getFleetSubmissionFileUrls(fleetId, docs);
      const existingCorrectionDraft = getDraftForServerFleet(fleetId, data.busNumber || data.vehicle?.busNumber);
      if (existingCorrectionDraft) {
        const saved = await loadFleetRegistrationDraft(existingCorrectionDraft);
        if (saved) {
          const refreshedDraft = {
            ...saved.draft,
            files: {
              ...saved.draft.files,
              photos: { ...saved.draft.files.photos, ...fileUrls.photos },
              ...fileUrls.documents,
            },
          } as FleetRegistrationDraft;
          await saveFleetRegistrationDraft(existingCorrectionDraft, refreshedDraft, saved.step, saved.completed, fleetId);
        }
        handleOpenFleet(
          existingCorrectionDraft,
          false,
          correction ? data.rejectionReason || "Shuvmarg requested corrections before resubmission." : null,
        );
        return;
      }
      const route = data.route || {};
      const features = data.features || data.vehicle?.features || [];
      const correctionDraft: FleetRegistrationDraft = {
        vehicle: {
          brandId: data.brandId || "",
          busName: data.busName || data.vehicle?.busName || "",
          busNumber: data.busNumber || data.vehicle?.busNumber || "",
          busType: data.busType || data.vehicle?.busType || "DELUXE",
          vehicleType: data.vehicleType || data.vehicle?.vehicleType || "BUS",
          registrationYear: String(data.registrationYear || data.vehicle?.registrationYear || ""),
          amenityIds: features.map((item) => typeof item === "string" ? item : item.id).filter((id): id is string => Boolean(id)),
          amenityDetails: features.flatMap((item) => typeof item !== "string" && item.id && item.name ? [{ ...item, type: item.type || "GLOBAL" }] : []),
        },
        route: {
          ...EMPTY_FLEET_DRAFT.route,
          origin: route.origin || "",
          destination: route.destination || "",
          originStop: route.originStop || null,
          destinationStop: route.destinationStop || null,
          corridorId: route.corridorId || null,
          corridorCode: route.corridorCode || null,
          direction: route.direction || null,
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
            front: (fileUrls.photos.front || null) as File | null,
            rear: (fileUrls.photos.rear || null) as File | null,
            side: (fileUrls.photos.side || null) as File | null,
            cabin: (fileUrls.photos.cabin || null) as File | null,
          },
          fitnessCert: (fileUrls.documents.fitnessCert || null) as File | null,
          insurance: (fileUrls.documents.insurance || null) as File | null,
          bluebook: (fileUrls.documents.bluebook || null) as File | null,
          routePermit: (fileUrls.documents.routePermit || null) as File | null,
        },
        documents: {
          fitnessValidTill: docs.fitnessCert?.validTill || "",
          insurancePolicyNumber: docs.insurance?.policyNumber || "",
          insuranceValidTill: docs.insurance?.validTill || "",
          routePermitValidTill: docs.routePermit?.validTill || "",
        },
      };
      const setupSteps = ["vehicle", "layout", "photos", "documents", "route"] as FleetStep[];
      const completedSteps = setupSteps.filter((candidate) => !validateFleetStep(candidate, correctionDraft));
      const firstIncomplete = setupSteps.find((candidate) => validateFleetStep(candidate, correctionDraft));
      const draftId = generateDraftId();
      await saveFleetRegistrationDraft(
        draftId,
        correctionDraft,
        firstIncomplete || "review",
        completedSteps,
        fleetId,
      );
      handleOpenFleet(
        draftId,
        false,
        correction ? data.rejectionReason || "Shuvmarg requested corrections before resubmission." : null,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : correction ? "Unable to open the requested corrections." : "Unable to open this bus setup.");
    }
  }

  function correctRejectedFleet(fleetId: string) {
    return openServerFleet(fleetId, true);
  }

  const visible = useMemo(() => {
    const value = query.trim().toLowerCase();
    return items.filter((item) => {
      const status = String(item.approvalStatus || "DRAFT").toUpperCase();
      return (activeView === "ALL" || status === activeView) && `${item.busName} ${item.busNumber} ${item.busType}`
        .toLowerCase()
        .includes(value);
    });
  }, [items, query, activeView]);

  const viewCounts = useMemo(() => items.reduce<Record<string, number>>((counts, item) => {
    const status = String(item.approvalStatus || "DRAFT").toUpperCase();
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {}), [items]);

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

        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Bus status">
          {([
            ["ALL", "All", items.length],
            ["DRAFT", "Drafts", viewCounts.DRAFT || 0],
            ["PENDING", "In review", viewCounts.PENDING || 0],
            ["REJECTED", "Needs changes", viewCounts.REJECTED || 0],
            ["APPROVED", "Approved", viewCounts.APPROVED || 0],
          ] as const).map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveView(value)}
              aria-pressed={activeView === value}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-black transition ${activeView === value ? "border-[#7A1D1B] bg-[#7A1D1B] text-white" : "border-[#E0D8D1] bg-white text-[#655E58] hover:border-[#BDAFA6]"}`}
            >
              {label} <span className="ml-1 opacity-70">{count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex h-56 items-center justify-center rounded-3xl border border-[#E8E1DB] bg-white text-sm text-[#746E69]">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Loading buses…
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
                  setupStatus={dashboardState?.fleetSetupStatusesByFleetId[fleet.fleetId] || null}
                  onOpenFleet={handleOpenFleet}
                  onPreviewFleet={setPreviewFleetId}
                  onOpenServerDraft={(fleetId) => void openServerFleet(fleetId, false)}
                  onCorrectRejectedFleet={correctRejectedFleet}
                  onOpenOperations={(fleetId) => router.push(`/dashboard?setupFleet=${encodeURIComponent(fleetId)}`)}
                />
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-[#DCD4CD] bg-white p-10 text-center">
            <BusFront className="mx-auto size-8 text-[#7A1D1B]" />
            <h2 className="mt-4 text-lg font-black">
              {items.length ? "No buses in this view" : "Add your first bus"}
            </h2>
            {!items.length && (
              <button
                onClick={() => handleOpenFleet(null, false)}
                className="mt-5 rounded-xl bg-[#191512] px-5 py-3 text-xs font-black text-white"
              >
                Add bus
              </button>
            )}
          </div>
        )}

        <FleetRegistrationFlow
          open={open}
          canSubmitForReview={businessApproved}
          readOnly={readOnlyMode}
          correctionReason={correctionReason}
          correctionRequirements={correctionRequirements}
          onClose={() => setOpen(false)}
          onRegistered={() => {
            setHasLocalDraft(false);
            void load();
          }}
          onPreviewSubmitted={(fleetId) => {
            setOpen(false);
            setPreviewFleetId(fleetId);
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

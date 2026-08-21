"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FolderOpen,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import FleetRegistrationStepper, { STEPS } from "./FleetRegistrationStepper";
import { EMPTY_FLEET_DRAFT, type FleetRegistrationDraft, type FleetStep } from "./types";
import { registerFleet, type FleetReviewRequirement, type FleetReviewRequirementKey, type RegisterFleetProgress } from "./api";
import { validateFleetCorrectionDraft, validateFleetCorrectionStep, validateFleetDraft, validateFleetStep } from "./validation";
import VehicleDetailsStep from "./steps/VehicleDetailsStep";
import SeatLayoutStep from "./steps/SeatLayoutStep";
import VehiclePhotosStep from "./steps/VehiclePhotosStep";
import DocumentsStep from "./steps/DocumentsStep";
import RouteAssignmentStep from "./steps/RouteAssignmentStep";
import ReviewStep from "./steps/ReviewStep";
import FleetDraftManagerModal from "./components/FleetDraftManagerModal";
import {
  deleteFleetRegistrationDraft,
  generateDraftId,
  getActiveDraftId,
  listFleetDrafts,
  loadFleetRegistrationDraft,
  saveFleetRegistrationDraft,
  setActiveDraftId,
} from "./fleet-registration-draft-storage";

interface Props {
  open: boolean;
  canSubmitForReview: boolean;
  readOnly?: boolean;
  correctionReason?: string | null;
  correctionRequirements?: Partial<Record<FleetReviewRequirementKey, FleetReviewRequirement>>;
  onClose: () => void;
  onRegistered: (fleetId: string) => void;
  onPreviewSubmitted?: (fleetId: string) => void;
}

export default function FleetRegistrationFlow({
  open,
  canSubmitForReview,
  readOnly = false,
  correctionReason = null,
  correctionRequirements,
  onClose,
  onRegistered,
  onPreviewSubmitted,
}: Props) {
  const [draftId, setDraftIdState] = useState<string>(() => getActiveDraftId() || generateDraftId());
  const [step, setStep] = useState<FleetStep>("vehicle");
  const [completed, setCompleted] = useState<FleetStep[]>([]);
  const [draft, setDraft] = useState<FleetRegistrationDraft>(EMPTY_FLEET_DRAFT);
  const [serverFleetId, setServerFleetId] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<RegisterFleetProgress | null>(null);
  const hydratedDraftIdRef = useRef<string | null>(null);
  const [showDraftManager, setShowDraftManager] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [submittedFleetId, setSubmittedFleetId] = useState<string | null>(null);

  const [isHydrated, setIsHydrated] = useState(false);
  const rejectedRequirements = Object.entries(correctionRequirements || {})
    .filter(([, requirement]) => String(requirement?.status || "").toUpperCase() === "REJECTED")
    .map(([key]) => key as FleetReviewRequirementKey);
  const approvedRequirements = Object.entries(correctionRequirements || {})
    .filter(([, requirement]) => String(requirement?.status || "").toUpperCase() === "APPROVED")
    .map(([key]) => key as FleetReviewRequirementKey);
  const correctionMode = rejectedRequirements.length > 0;
  const editableSteps = new Set<FleetStep>([
    "review",
    ...(rejectedRequirements.includes("vehicleDetails") ? ["vehicle" as FleetStep] : []),
    ...(rejectedRequirements.includes("seatLayout") ? ["layout" as FleetStep] : []),
    ...(rejectedRequirements.includes("fleetImages") ? ["photos" as FleetStep] : []),
    ...(rejectedRequirements.some((key) => ["fitnessCert", "insurance", "bluebook", "routePermit"].includes(key)) ? ["documents" as FleetStep] : []),
    ...(rejectedRequirements.includes("routeSetup") ? ["route" as FleetStep] : []),
  ]);

  // Load active draft on modal open
  useEffect(() => {
    if (!open) {
      hydratedDraftIdRef.current = null;
      return;
    }
    let active = true;

    async function init() {
      setSubmittedFleetId(null);
      const activeId = getActiveDraftId();
      const saved = await loadFleetRegistrationDraft(activeId);
      if (!active) return;

      if (saved) {
        hydratedDraftIdRef.current = saved.draftId;
        setDraftIdState(saved.draftId);
        setDraft(saved.draft);
        setStep(readOnly ? "review" : saved.step);
        setCompleted(saved.completed);
        setServerFleetId(saved.serverFleetId);
      } else {
        const newId = generateDraftId();
        hydratedDraftIdRef.current = newId;
        setDraftIdState(newId);
        setDraft(EMPTY_FLEET_DRAFT);
        setStep(readOnly ? "review" : "vehicle");
        setCompleted([]);
        setServerFleetId(undefined);
      }
      setIsHydrated(true);
    }

    void init();
    return () => {
      active = false;
      hydratedDraftIdRef.current = null;
    };
  }, [open, readOnly]);

  // Continuous auto-save to localStorage + IndexedDB
  useEffect(() => {
    if (!open || !isHydrated || submittedFleetId || hydratedDraftIdRef.current !== draftId) return;
    void saveFleetRegistrationDraft(draftId, draft, step, completed, serverFleetId);
  }, [open, isHydrated, submittedFleetId, draftId, draft, step, completed, serverFleetId]);

  if (!open) return null;

  async function closeAndSave() {
    if (!readOnly && isHydrated && hydratedDraftIdRef.current === draftId && !submittedFleetId) {
      await saveFleetRegistrationDraft(draftId, draft, step, completed, serverFleetId);
      setActiveDraftId(draftId);
    }
    onClose();
  }

  if (!isHydrated || hydratedDraftIdRef.current !== draftId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-xl">
          <Loader2 className="size-5 animate-spin text-[#7A1D1B]" />
          <span className="text-sm font-bold text-[#211D1A]">Restoring your bus draft…</span>
        </div>
      </div>
    );
  }

  if (submittedFleetId) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
        <div role="dialog" aria-modal="true" aria-labelledby="fleet-submitted-title" className="w-full max-w-md rounded-[26px] border border-[#E8E1DB] bg-white p-7 shadow-2xl sm:p-8">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="size-6" />
          </div>
          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-[#7A1D1B]">In review</p>
          <h2 id="fleet-submitted-title" className="mt-1 text-2xl font-black text-[#191512]">Bus submitted</h2>
          <p className="mt-2 text-sm leading-6 text-[#746E69]">
            {draft.vehicle.busName || draft.vehicle.busNumber || "This bus"} is now with Shuvmarg for review. Its submitted record is locked unless changes are requested.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => void closeAndSave()} className="h-11 flex-1 rounded-xl border border-[#DCD4CD] text-xs font-black text-[#655E58] transition hover:bg-[#FAF8F5]">
              Back to fleet
            </button>
            {onPreviewSubmitted && (
              <button type="button" onClick={() => onPreviewSubmitted(submittedFleetId)} className="h-11 flex-1 rounded-xl bg-[#7A1D1B] text-xs font-black text-white transition hover:bg-[#641715]">
                View submission
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const totalSavedDrafts = listFleetDrafts().length;
  const index = STEPS.findIndex((item) => item.id === step);

  const content =
    step === "vehicle" ? (
      <VehicleDetailsStep draft={draft} update={setDraft} readOnly={readOnly} />
    ) : step === "layout" ? (
      <SeatLayoutStep draft={draft} update={setDraft} readOnly={readOnly} />
    ) : step === "photos" ? (
      <VehiclePhotosStep draft={draft} update={setDraft} readOnly={readOnly} />
    ) : step === "documents" ? (
      <DocumentsStep draft={draft} update={setDraft} readOnly={readOnly} editableSlots={correctionMode ? rejectedRequirements : undefined} />
    ) : step === "route" ? (
      <RouteAssignmentStep draft={draft} update={setDraft} readOnly={readOnly} />
    ) : (
      <ReviewStep draft={draft} onEditStep={readOnly ? undefined : selectStep} readOnly={readOnly} />
    );

  function selectStep(value: FleetStep) {
    if (correctionMode && !editableSteps.has(value)) return;
    setError(null);
    setStep(value);
  }

  function next() {
    const issue = correctionMode
      ? validateFleetCorrectionStep(step, draft, rejectedRequirements)
      : validateFleetStep(step, draft);
    if (issue) return setError(issue);
    setError(null);
    setCompleted((items) => (items.includes(step) ? items : [...items, step]));
    if (correctionMode) setStep("review");
    else if (index < STEPS.length - 1) setStep(STEPS[index + 1].id);
  }

  async function handleSwitchDraft(targetId: string) {
    const saved = await loadFleetRegistrationDraft(targetId);
    if (saved) {
      setDraftIdState(saved.draftId);
      setDraft(saved.draft);
      setStep(saved.step);
      setCompleted(saved.completed);
      setServerFleetId(saved.serverFleetId);
      setError(null);
    }
  }

  function handleStartNewBus() {
    const newId = generateDraftId();
    setDraftIdState(newId);
    setDraft(EMPTY_FLEET_DRAFT);
    setStep("vehicle");
    setCompleted([]);
    setServerFleetId(undefined);
    setError(null);
  }

  async function handleDiscardCurrent() {
    await deleteFleetRegistrationDraft(draftId);
    setShowDiscardConfirm(false);
    handleStartNewBus();
  }

  async function submit() {
    if (correctionMode) {
      const isReplacement = (value: File | null) => typeof Blob !== "undefined" && value instanceof Blob;
      if (rejectedRequirements.includes("fleetImages") && Object.values(draft.files.photos).some((file) => !isReplacement(file))) {
        return setError("Replace all four requested vehicle photos before resubmitting.");
      }
      const rejectedDocument = (["fitnessCert", "insurance", "bluebook", "routePermit"] as const)
        .find((key) => rejectedRequirements.includes(key) && !isReplacement(draft.files[key]));
      if (rejectedDocument) {
        const label = rejectedDocument === "fitnessCert" ? "fitness certificate" : rejectedDocument === "routePermit" ? "route permit" : rejectedDocument;
        return setError(`Upload the corrected ${label} before resubmitting.`);
      }
    }
    const issue = correctionMode
      ? validateFleetCorrectionDraft(draft, rejectedRequirements)
      : validateFleetDraft(draft);
    if (issue) return setError(issue);
    setBusy(true);
    setError(null);
    setProgress(null);

    try {
      const id = await registerFleet(draft, {
        existingFleetId: serverFleetId,
        onDraftCreated: (newServerId) => {
          setServerFleetId(newServerId);
          void saveFleetRegistrationDraft(draftId, draft, step, completed, newServerId);
        },
        onProgress: setProgress,
        submitForReview: canSubmitForReview,
        correctionRequirements: correctionMode ? rejectedRequirements : undefined,
      });

      if (canSubmitForReview) {
        // The accepted server record is the preview source. Remove this exact
        // editable copy without depending on another request succeeding.
        await deleteFleetRegistrationDraft(draftId);
        setActiveDraftId(null);
        onRegistered(id);
        setSubmittedFleetId(id);
        return;
      }

      const newId = generateDraftId();
      hydratedDraftIdRef.current = newId;
      setDraftIdState(newId);

      setDraft(EMPTY_FLEET_DRAFT);
      setServerFleetId(undefined);
      setCompleted([]);
      setStep("vehicle");

      onRegistered(id);
      onClose();
    } catch (cause) {
      const suffix = serverFleetId
        ? " Your vehicle progress is saved; retrying will continue this exact bus."
        : "";
      setError(`${cause instanceof Error ? cause.message : "Unable to save this bus."}${suffix}`);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-2 backdrop-blur-sm sm:p-4 animate-in fade-in duration-150">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add bus"
          className="flex h-[min(840px,calc(100dvh-16px))] w-full max-w-6xl flex-col overflow-hidden rounded-[26px] border border-[#E8E1DB] bg-white shadow-2xl sm:h-[min(840px,calc(100dvh-32px))]"
        >
          {/* Header */}
          <header className="flex h-[72px] shrink-0 items-center justify-between gap-4 border-b border-[#E8E1DB] px-5 sm:px-7">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7A1D1B]">
                  Fleet Setup
                </p>
                <h2 className="mt-0.5 text-lg font-black text-[#191512]">
                  {draft.vehicle.busName.trim() || "Add a bus"}
                </h2>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              {/* Draft Switcher Button — hidden in read-only mode */}
              {!readOnly && totalSavedDrafts > 0 && (
                <button
                  type="button"
                  onClick={() => setShowDraftManager(true)}
                  disabled={busy}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#DCD4CD] bg-white px-3 text-xs font-bold text-[#655E58] hover:border-[#7A1D1B] hover:text-[#7A1D1B] transition shadow-2xs"
                >
                  <FolderOpen className="size-3.5 text-[#7A1D1B]" />
                  <span>Drafts</span>
                  <span className="rounded-full bg-[#FFF1EE] px-1.5 py-0.2 text-[10px] font-black text-[#7A1D1B]">
                    {totalSavedDrafts}
                  </span>
                </button>
              )}

              {/* Discard Draft Button — hidden in read-only mode */}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(true)}
                  disabled={busy}
                  title="Discard this draft"
                  className="inline-flex h-9 items-center gap-1 rounded-xl border border-transparent px-2.5 text-xs font-bold text-[#938A82] hover:bg-red-50 hover:text-red-700 transition"
                >
                  <Trash2 className="size-3.5" />
                  <span className="hidden sm:inline">Discard</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => void closeAndSave()}
                disabled={busy}
                className="flex size-9 items-center justify-center rounded-xl border border-[#E8E1DB] text-[#655E58] hover:bg-[#FAF8F5] transition"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
          </header>

          {/* Body */}
          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            <FleetRegistrationStepper
              active={step}
              completed={completed}
              busName={draft.vehicle.busName}
              busNumber={draft.vehicle.busNumber}
              onSelect={selectStep}
            />

            <section className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="shrink-0 border-b border-[#EEE8E2] px-5 py-3.5 sm:px-7">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#938A82]">
                  Step {index + 1} of {STEPS.length}
                </p>
                <h3 className="mt-0.5 text-xl font-black text-[#211D1A]">
                  {STEPS[index].label}
                </h3>
              </div>

              <main className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
                {correctionReason && !readOnly && (
                  <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-red-700">Changes requested by Shuvmarg</p>
                    <p className="mt-1.5 whitespace-pre-line text-xs font-semibold text-red-900">{correctionReason}</p>
                  </div>
                )}
                {correctionMode && step === "review" && (
                  <div className="mb-5 space-y-3">
                    {approvedRequirements.length > 0 && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">Approved by Shuvmarg</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {approvedRequirements.map((key) => (
                            <span key={key} className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                              <CheckCircle2 className="size-3" />
                              {key.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase())}
                            </span>
                          ))}
                        </div>
                        <p className="mt-2 text-[10px] font-semibold text-emerald-800">These accepted details are retained and cannot be changed in this correction round.</p>
                      </div>
                    )}
                    <div className="grid gap-2 sm:grid-cols-2">
                      {rejectedRequirements.map((key) => (
                        <button key={key} type="button" onClick={() => selectStep(
                          key === "vehicleDetails" ? "vehicle" : key === "seatLayout" ? "layout" : key === "fleetImages" ? "photos" : key === "routeSetup" ? "route" : "documents"
                        )} className="rounded-xl border border-red-200 bg-red-50 p-3 text-left">
                          <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-red-700">Needs changes</span>
                          <span className="mt-1 block text-xs font-bold text-red-950">{correctionRequirements?.[key]?.reason}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Submission Progress Bar */}
                {busy && progress && (
                  <div className="mb-5 rounded-2xl border border-[#F0CACA] bg-[#FFF8F7] p-4 shadow-2xs animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-2 text-[#7A1D1B]">
                        <Loader2 className="size-3.5 animate-spin" />
                        {progress.stage}
                      </span>
                      <span className="text-[#938A82]">
                        {progress.stepNumber} / {progress.totalSteps}
                      </span>
                    </div>
                    <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#F0E6E2]">
                      <div
                        className="h-full rounded-full bg-[#7A1D1B] transition-all duration-300"
                        style={{
                          width: `${(progress.stepNumber / progress.totalSteps) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mb-4 flex gap-2 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {content}
              </main>

              {error && (
                <div role="alert" className="shrink-0 border-t border-red-200 bg-red-50 px-5 py-2.5 text-xs font-bold text-red-800 sm:px-7">
                  <AlertCircle className="mr-2 inline size-3.5" />
                  {error}
                </div>
              )}

              {/* Footer Actions */}
              <footer className="flex h-[72px] shrink-0 items-center justify-between border-t border-[#E8E1DB] bg-white px-5 sm:px-7">
                {readOnly ? (
                  <div className="flex w-full h-10 items-center justify-center rounded-xl bg-amber-50 px-5 text-xs font-black text-amber-800 border border-amber-200">
                    <AlertCircle className="mr-2 size-4" />
                    Submitted for review · Editing locked
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => correctionMode ? setStep("review") : index > 0 && setStep(STEPS[index - 1].id)}
                      disabled={(correctionMode ? step === "review" : index === 0) || busy}
                      className="flex h-10 items-center rounded-xl border border-[#DCD4CD] px-4 text-xs font-black text-[#655E58] hover:bg-[#FAF8F5] transition disabled:opacity-30"
                    >
                      <ArrowLeft className="mr-2 size-4" />
                      {correctionMode ? "Back to review" : "Back"}
                    </button>

                    {step === "review" ? (
                      <button
                        type="button"
                        onClick={() => void submit()}
                        disabled={busy}
                        className="flex h-10 items-center rounded-xl bg-[#7A1D1B] px-5 text-xs font-black text-white shadow-sm transition hover:bg-[#641715] disabled:opacity-50"
                      >
                        {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
                        {busy
                          ? "Saving vehicle…"
                          : canSubmitForReview
                            ? "Submit for review"
                            : "Save bus"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={next}
                        disabled={busy || (step === "layout" && !draft.layout)}
                        className="flex h-10 items-center rounded-xl bg-[#191512] px-5 text-xs font-black text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        Continue
                        <ArrowRight className="ml-2 size-4" />
                      </button>
                    )}
                  </>
                )}
              </footer>
            </section>
          </div>
        </div>
      </div>

      {/* Discard Confirmation Dialog */}
      {showDiscardConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-100"
        >
          <div className="w-full max-w-sm rounded-[24px] border border-[#E8E1DB] bg-white p-6 shadow-2xl">
            <div className="flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-700">
              <Trash2 className="size-5" />
            </div>
            <h4 className="mt-3 text-base font-black text-[#191512]">Discard this bus draft?</h4>
            <p className="mt-1.5 text-xs text-[#746E69]">
              This will permanently delete this unfinished setup, including entered vehicle details, custom seat layout, and uploaded photos.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 rounded-xl border border-[#DCD4CD] py-2.5 text-xs font-bold text-[#655E58] hover:bg-[#FAF8F5]"
              >
                Keep draft
              </button>
              <button
                type="button"
                onClick={() => void handleDiscardCurrent()}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-red-700"
              >
                Yes, discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Draft Manager Modal */}
      <FleetDraftManagerModal
        isOpen={showDraftManager}
        activeDraftId={draftId}
        onClose={() => setShowDraftManager(false)}
        onSelectDraft={(targetId) => void handleSwitchDraft(targetId)}
        onStartNew={handleStartNewBus}
      />
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, X } from "lucide-react";
import FleetRegistrationStepper, { STEPS } from "./FleetRegistrationStepper";
import { EMPTY_FLEET_DRAFT, type FleetRegistrationDraft, type FleetStep } from "./types";
import { registerFleet } from "./api";
import { validateFleetDraft, validateFleetStep } from "./validation";
import VehicleDetailsStep from "./steps/VehicleDetailsStep";
import SeatLayoutStep from "./steps/SeatLayoutStep";
import VehiclePhotosStep from "./steps/VehiclePhotosStep";
import DocumentsStep from "./steps/DocumentsStep";
import RouteAssignmentStep from "./steps/RouteAssignmentStep";
import ReviewStep from "./steps/ReviewStep";
import { clearFleetRegistrationDraft, loadFleetRegistrationDraft, saveFleetRegistrationDraft } from "./fleet-registration-draft-storage";

interface Props { open: boolean; canSubmitForReview: boolean; onClose: () => void; onRegistered: (fleetId: string) => void; }

export default function FleetRegistrationFlow({ open, canSubmitForReview, onClose, onRegistered }: Props) {
  const [step, setStep] = useState<FleetStep>("vehicle");
  const [completed, setCompleted] = useState<FleetStep[]>([]);
  const [draft, setDraft] = useState<FleetRegistrationDraft>(EMPTY_FLEET_DRAFT);
  const [serverFleetId, setServerFleetId] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [filesNeedReselection, setFilesNeedReselection] = useState(false);

  useEffect(() => {
    if (!open || draftLoaded) return;
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      const saved = loadFleetRegistrationDraft();
      if (saved) { setDraft(saved.draft); setStep(saved.step); setCompleted(saved.completed); setFilesNeedReselection(saved.filesNeedReselection); }
      setDraftLoaded(true);
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [open, draftLoaded]);

  useEffect(() => {
    if (!open || !draftLoaded) return;
    saveFleetRegistrationDraft(draft, step, completed, filesNeedReselection);
  }, [open, draftLoaded, draft, step, completed, filesNeedReselection]);

  if (!open) return null;

  const index = STEPS.findIndex((item) => item.id === step);
  const content = step === "vehicle" ? <VehicleDetailsStep draft={draft} update={setDraft} />
    : step === "layout" ? <SeatLayoutStep draft={draft} update={setDraft} />
      : step === "photos" ? <VehiclePhotosStep draft={draft} update={setDraft} />
        : step === "documents" ? <DocumentsStep draft={draft} update={setDraft} />
          : step === "route" ? <RouteAssignmentStep draft={draft} update={setDraft} />
            : <ReviewStep draft={draft} />;

  function selectStep(value: FleetStep) { setError(null); setStep(value); }
  function next() {
    const issue = validateFleetStep(step, draft);
    if (issue) return setError(issue);
    setError(null);
    setCompleted((items) => items.includes(step) ? items : [...items, step]);
    if (index < STEPS.length - 1) setStep(STEPS[index + 1].id);
  }
  async function submit() {
    const issue = validateFleetDraft(draft);
    if (issue) return setError(issue);
    setBusy(true); setError(null);
    try {
      const id = await registerFleet(draft, { existingFleetId: serverFleetId, onDraftCreated: setServerFleetId, submitForReview: canSubmitForReview });
      clearFleetRegistrationDraft();
      setDraft(EMPTY_FLEET_DRAFT); setServerFleetId(undefined); setCompleted([]); setStep("vehicle"); setFilesNeedReselection(false);
      onRegistered(id); onClose();
    } catch (cause) {
      const suffix = serverFleetId ? " Your saved draft is safe; retry continues the same bus." : "";
      setError(`${cause instanceof Error ? cause.message : "Unable to save this bus."}${suffix}`);
    } finally { setBusy(false); }
  }

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-2 backdrop-blur-sm sm:p-4">
    <div role="dialog" aria-modal="true" aria-label="Add bus" className="flex h-[min(820px,calc(100dvh-16px))] w-full max-w-6xl flex-col overflow-hidden rounded-[24px] border border-[#E8E1DB] bg-white shadow-2xl sm:h-[min(820px,calc(100dvh-32px))]">
      <header className="flex h-[72px] shrink-0 items-center justify-between gap-4 border-b border-[#E8E1DB] px-5 sm:px-7">
        <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7A1D1B]">Fleet setup</p><h2 className="mt-1 text-lg font-black text-[#191512]">Add a bus</h2></div>
        <button type="button" onClick={onClose} disabled={busy} className="flex size-9 items-center justify-center rounded-xl border border-[#E8E1DB]" aria-label="Close"><X className="size-4" /></button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <FleetRegistrationStepper active={step} completed={completed} busName={draft.vehicle.busName} busNumber={draft.vehicle.busNumber} onSelect={selectStep} />
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-[#EEE8E2] px-5 py-4 sm:px-7"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#938A82]">Step {index + 1}</p><h3 className="mt-1 text-xl font-black text-[#211D1A]">{STEPS[index].label}</h3></div>
          <main className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">{filesNeedReselection && <div className="mb-4 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-900">Draft restored. For security, add the photos and documents again.</div>}{error && <div className="mb-4 flex gap-2 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700"><AlertCircle className="size-4 shrink-0" />{error}</div>}{content}</main>
          <footer className="flex h-[72px] shrink-0 items-center justify-between border-t border-[#E8E1DB] bg-white px-5 sm:px-7">
            <button type="button" onClick={() => index > 0 && setStep(STEPS[index - 1].id)} disabled={index === 0 || busy} className="flex h-10 items-center rounded-xl border border-[#DCD4CD] px-4 text-xs font-black disabled:opacity-30"><ArrowLeft className="mr-2 size-4" />Back</button>
            {step === "review" ? <button type="button" onClick={() => void submit()} disabled={busy} className="flex h-10 items-center rounded-xl bg-[#7A1D1B] px-5 text-xs font-black text-white disabled:opacity-50">{busy && <Loader2 className="mr-2 size-4 animate-spin" />}{busy ? "Saving…" : canSubmitForReview ? "Submit for review" : "Save bus"}</button> : <button type="button" onClick={next} disabled={busy || (step === "layout" && !draft.layout)} className="flex h-10 items-center rounded-xl bg-[#191512] px-5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-35">Continue<ArrowRight className="ml-2 size-4" /></button>}
          </footer>
        </section>
      </div>
    </div>
  </div>;
}

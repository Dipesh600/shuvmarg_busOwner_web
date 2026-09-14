"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import type {
  OperatorFleetSetupStatus,
  OperatorSetupRouteConfig,
  OperatorSetupTiming,
} from "@/features/operator-dashboard/operator-dashboard-contract";
import {
  clearScheduleRequestId,
  persistentScheduleRequestId,
  recoverFleetSchedulePlan,
  saveFleetSchedulePlan,
  ScheduleConflictError,
  type RecoverableSchedulePlan,
} from "@/features/operator-dashboard/schedule-plan-api";

interface Props {
  fleetId: string;
  busName: string;
  busNumber: string;
  setup: OperatorFleetSetupStatus;
  onClose: () => void;
  onSaved: () => void;
}

type Step = "journey" | "days" | "return" | "rules" | "review";
type Recurrence = "DAILY" | "CUSTOM";
type ReturnMode = "SAME_DAY" | "NEXT_DAY";

const STEPS: Array<{ id: Step; short: string; title: string; description: string }> = [
  { id: "journey", short: "Journey", title: "Choose the first journey", description: "Confirm which direction this bus leaves first." },
  { id: "days", short: "Days", title: "Choose the running days", description: "Set the first service date and how often the bus runs." },
  { id: "return", short: "Return", title: "Set the return journey", description: "Choose when the bus comes back after its first journey." },
  { id: "rules", short: "Bookings", title: "Set booking rules", description: "The recommended defaults are already selected." },
  { id: "review", short: "Review", title: "Check the schedule", description: "Review everything once before saving." },
];

const DAYS = [
  { value: 0, short: "Sun", label: "Sunday" },
  { value: 1, short: "Mon", label: "Monday" },
  { value: 2, short: "Tue", label: "Tuesday" },
  { value: 3, short: "Wed", label: "Wednesday" },
  { value: 4, short: "Thu", label: "Thursday" },
  { value: 5, short: "Fri", label: "Friday" },
  { value: 6, short: "Sat", label: "Saturday" },
];

function todayInKathmandu() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kathmandu" });
}

function to24h(value?: string) {
  if (!value) return "";
  const text = value.trim();
  if (/^([01]\d|2[0-3]):[0-5]\d$/.test(text)) return text;
  const match = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return "";
  let hour = Number(match[1]);
  if (match[3].toUpperCase() === "AM" && hour === 12) hour = 0;
  if (match[3].toUpperCase() === "PM" && hour !== 12) hour += 12;
  return `${String(hour).padStart(2, "0")}:${match[2]}`;
}

function minutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function legTimes(timing: OperatorSetupTiming[] = []) {
  if (!timing.length) return { departure: "", arrival: "", arrivalDayOffset: 0 };
  const departure = to24h(timing[0]?.estimatedDeparture || timing[0]?.estimatedArrival);
  const last = timing[timing.length - 1];
  const arrival = to24h(last?.estimatedArrival || last?.estimatedDeparture);
  const inferred = departure && arrival && minutes(arrival) <= minutes(departure) ? 1 : 0;
  let offset = Number.isInteger(last?.dayOffset) ? Number(last.dayOffset) : inferred;
  if (offset > 1) {
    offset = inferred;
  }
  return {
    departure,
    arrival,
    arrivalDayOffset: offset,
  };
}

function formatTime(value: string) {
  if (!value) return "—";
  const [hour, minute] = value.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

function formatDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kathmandu",
  }).format(new Date(`${value}T00:00:00+05:45`));
}

function variantId(config?: OperatorSetupRouteConfig) {
  if (!config?.variantId) return "";
  return typeof config.variantId === "string" ? config.variantId : config.variantId._id || "";
}

function returnVariantId(config?: OperatorSetupRouteConfig) {
  return typeof config?.variantId === "object" ? config.variantId.returnVariantId || "" : "";
}

function scheduleErrorMessage(failure: unknown) {
  const message = failure instanceof Error ? failure.message : "";
  if (failure instanceof ScheduleConflictError) {
    if (failure.isInternalCandidateConflict) {
      return "The outbound and return journeys overlap in time. Check the departure and arrival times of the return journey.";
    }
    if (failure.conflictingStatus === "ACTIVE") {
      return "This bus already has an active trip schedule at the same time. Pause the existing schedule first if you want to create a new one.";
    }
    return message || "This bus has a conflicting schedule. Please contact support.";
  }
  if (/Model\.findById|Mongoose model|cannot run without a model/i.test(message)) {
    return "The server could not verify this route. Please try saving again. If it still fails, contact Shuvmarg support.";
  }
  return message || "The trip schedule could not be saved. Please try again.";
}

function Choice({ selected, title, detail, onClick, disabled = false }: {
  selected: boolean;
  title: string;
  detail?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-[68px] rounded-xl border p-3.5 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${selected ? "border-[#B66B63] bg-[#F8ECE8]" : "border-[#E4DDD6] bg-white hover:border-[#C9BDB4]"}`}
    >
      <span className="flex items-center gap-2.5 text-sm font-black text-[#211D1A]">
        <span className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-[#7A1D1B] bg-[#7A1D1B] text-white" : "border-[#B7AEA7]"}`}>
          {selected && <Check className="size-3" />}
        </span>
        {title}
      </span>
      {detail && <span className="mt-1 block pl-[30px] text-[11px] font-semibold text-[#817A74]">{detail}</span>}
    </button>
  );
}

function JourneyTimeCard({ from, to, departure, arrival, arrivalDayOffset, label }: {
  from: string;
  to: string;
  departure: string;
  arrival: string;
  arrivalDayOffset: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E8E0D8] bg-[#F7F3EE] p-4 sm:p-5">
      <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#655E58]">
        <Clock3 className="size-4 text-[#7A1D1B]" /> {label}
      </p>
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold text-[#817A74]">Leaves {from}</p>
          <p className="mt-0.5 text-lg font-black text-[#211D1A]">{formatTime(departure)}</p>
        </div>
        <ArrowRight className="size-4 text-[#A59C95]" />
        <div className="min-w-0 text-right">
          <p className="truncate text-[11px] font-semibold text-[#817A74]">Arrives {to}</p>
          <p className="mt-0.5 text-lg font-black text-[#211D1A]">
            {formatTime(arrival)}{arrivalDayOffset ? " · next day" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#E8E0D8] bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#817A74]">{label}</p>
      <div className="mt-2 text-sm font-bold leading-6 text-[#211D1A]">{children}</div>
    </div>
  );
}

export default function TripScheduleModal({
  fleetId,
  busName,
  busNumber,
  setup,
  onClose,
  onSaved,
}: Props) {
  const configs = useMemo(() => setup.assignedRouteConfigs || [], [setup.assignedRouteConfigs]);
  const [step, setStep] = useState<Step>("journey");
  const [requestId, setRequestId] = useState(() => persistentScheduleRequestId(fleetId));
  const [configId, setConfigId] = useState(configs[0]?._id || "");
  const [reverse, setReverse] = useState(false);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveUntil, setEffectiveUntil] = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence>("DAILY");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [returnMode, setReturnMode] = useState<ReturnMode>("SAME_DAY");
  const [advanceBookingDays, setAdvanceBookingDays] = useState(60);
  const [bookingCutoffHours, setBookingCutoffHours] = useState(2);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [recoveryPlan, setRecoveryPlan] = useState<RecoverableSchedulePlan | null>(null);
  const [recovering, setRecovering] = useState(true);
  const [replaceServicePlanId, setReplaceServicePlanId] = useState<string | null>(null);
  const [reviewingRecovery, setReviewingRecovery] = useState<RecoverableSchedulePlan | null>(null);

  const config = configs.find((item) => item._id === configId) || configs[0];
  const firstTiming = config?.timingConfig || [];
  const reverseTiming = config?.returnTimingConfig || [];
  const outbound = legTimes(reverse ? reverseTiming : firstTiming);
  const returning = legTimes(reverse ? firstTiming : reverseTiming);
  const origin = setup.assignedRoute?.origin || "Origin";
  const destination = setup.assignedRoute?.destination || "Destination";
  const from = reverse ? destination : origin;
  const to = reverse ? origin : destination;
  const firstVariant = variantId(config);
  const pairedVariant = returnVariantId(config);
  const outboundVariant = reverse ? pairedVariant : firstVariant;
  const returnVariant = reverse ? firstVariant : pairedVariant;
  const canReverse = Boolean(pairedVariant && reverseTiming.length);
  const canSameDay = Boolean(outbound.departure && outbound.arrival && returning.departure
    && outbound.arrivalDayOffset === 0
    && minutes(returning.departure) >= minutes(outbound.arrival) + 15);
  const effectiveReturnMode: ReturnMode = canSameDay ? returnMode : "NEXT_DAY";
  const customDaysReady = recurrence === "DAILY" || daysOfWeek.length > 0;
  const journeyReady = Boolean(config && outboundVariant && outbound.departure && outbound.arrival);
  const daysReady = Boolean(effectiveFrom && customDaysReady);
  const returnReady = Boolean(returnVariant && returning.departure && returning.arrival);
  const rulesReady = Boolean(advanceBookingDays > 0 && bookingCutoffHours >= 0
    && (!effectiveUntil || !effectiveFrom || effectiveUntil > effectiveFrom));
  const formReady = journeyReady && daysReady && returnReady && rulesReady;
  const stepIndex = STEPS.findIndex((item) => item.id === step);
  const activeStep = STEPS[stepIndex];
  const minimumDate = todayInKathmandu();

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [busy, onClose]);

  useEffect(() => {
    let active = true;
    void recoverFleetSchedulePlan(fleetId)
      .then((result) => { if (active) setRecoveryPlan(result.data.draft); })
      .catch(() => {})
      .finally(() => { if (active) setRecovering(false); });
    return () => { active = false; };
  }, [fleetId]);

  const reviewRecoveredPlan = (plan: RecoverableSchedulePlan) => {
    const primary = plan.primary;
    const returning = plan.returnSchedule;
    const savedConfigId = typeof primary.operatorRouteConfigId === "string"
      ? primary.operatorRouteConfigId : primary.operatorRouteConfigId?._id || "";
    const savedVariantId = typeof primary.variantId === "string"
      ? primary.variantId : primary.variantId?._id || "";
    const savedConfig = configs.find(item => item._id === savedConfigId);
    setConfigId(savedConfigId || configId);
    setReverse(Boolean(savedConfig && returnVariantId(savedConfig) === savedVariantId));
    setEffectiveFrom(primary.effectiveFrom?.slice(0, 10) || "");
    setEffectiveUntil(primary.effectiveUntil?.slice(0, 10) || "");
    setRecurrence(primary.recurrence === "DAILY" ? "DAILY" : "CUSTOM");
    setDaysOfWeek(primary.daysOfWeek || []);
    setReturnMode(primary.returnMode
      || (primary.operationalModel === "RELAY" ? "NEXT_DAY" : "SAME_DAY"));
    setAdvanceBookingDays(primary.advanceBookingDays || 60);
    setBookingCutoffHours(primary.bookingCutoffHours ?? 2);
    setReviewingRecovery(plan);
    setStep("review");
  };

  const beginReplacement = (plan: RecoverableSchedulePlan) => {
    clearScheduleRequestId(fleetId);
    setRequestId(persistentScheduleRequestId(fleetId));
    setReplaceServicePlanId(plan.servicePlanId);
    setRecoveryPlan(null);
    setReviewingRecovery(null);
    setStep("journey");
  };

  const toggleDay = (day: number) => setDaysOfWeek((current) => current.includes(day)
    ? current.filter((value) => value !== day)
    : [...current, day].sort((a, b) => a - b));

  const isCurrentStepReady = step === "journey" ? journeyReady
    : step === "days" ? daysReady
      : step === "return" ? returnReady
        : step === "rules" ? rulesReady
          : formReady;

  const next = () => {
    if (!isCurrentStepReady || stepIndex >= STEPS.length - 1) return;
    setError("");
    setStep(STEPS[stepIndex + 1].id);
  };

  const back = () => {
    if (stepIndex === 0) return;
    setError("");
    if (reviewingRecovery) {
      setReviewingRecovery(null);
      setStep("journey");
      return;
    }
    setStep(STEPS[stepIndex - 1].id);
  };

  const save = async () => {
    if (!formReady || !config || !requestId) return;
    setBusy(true);
    setError("");
    try {
      await saveFleetSchedulePlan(fleetId, {
        requestId,
        ...(replaceServicePlanId ? { replaceServicePlanId } : {}),
        effectiveFrom: new Date(`${effectiveFrom}T00:00:00.000Z`).toISOString(),
        effectiveUntil: effectiveUntil ? new Date(`${effectiveUntil}T23:59:59.999Z`).toISOString() : undefined,
        recurrence,
        daysOfWeek: recurrence === "CUSTOM" ? daysOfWeek : undefined,
        returnMode: effectiveReturnMode,
        advanceBookingDays,
        bookingCutoffHours,
        outbound: {
          variantId: outboundVariant,
          operatorRouteConfigId: config._id,
          departureTime: outbound.departure,
          arrivalTime: outbound.arrival,
          arrivalDayOffset: outbound.arrivalDayOffset,
        },
        returnTrip: {
          variantId: returnVariant,
          operatorRouteConfigId: config._id,
          departureTime: returning.departure,
          arrivalTime: returning.arrival,
          arrivalDayOffset: returning.arrivalDayOffset,
        },
      });
      clearScheduleRequestId(fleetId);
      onSaved();
    } catch (failure) {
      if (failure instanceof ScheduleConflictError && failure.recoveryPlan) {
        setRecoveryPlan(failure.recoveryPlan);
        setError("");
      } else {
        setError(scheduleErrorMessage(failure));
      }
    } finally {
      setBusy(false);
    }
  };

  const dayText = recurrence === "DAILY" ? "Every day"
    : DAYS.filter((day) => daysOfWeek.includes(day.value)).map((day) => day.short).join(", ");

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#211D1A]/55 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="trip-schedule-title">
      <div className="flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden border border-[#E8E0D8] bg-[#FDFAF6] shadow-[0_24px_70px_rgba(42,31,25,0.22)] sm:h-auto sm:max-h-[92vh] sm:min-h-[620px] sm:rounded-3xl">
        <header className="shrink-0 border-b border-[#E8E0D8] bg-white px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F8ECE8] text-[#7A1D1B]"><CalendarDays className="size-5" /></span>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-black uppercase tracking-[0.14em] text-[#7A1D1B]">{busName} · {busNumber}</p>
                <h2 id="trip-schedule-title" className="mt-1 text-lg font-semibold text-[#211D1A] sm:text-xl">{activeStep.title}</h2>
                <p className="mt-1 text-xs text-[#746E69]">{activeStep.description}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <span className="rounded-full bg-[#F3EFEB] px-2.5 py-1 text-[10px] font-bold text-[#655E58]">{stepIndex + 1} of {STEPS.length}</span>
              <button type="button" disabled={busy} onClick={onClose} className="rounded-xl p-2 text-[#746E69] hover:bg-[#F3EFEB] disabled:opacity-40" aria-label="Close"><X className="size-5" /></button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-1.5" aria-label="Schedule progress">
            {STEPS.map((item, index) => (
              <div key={item.id} className="min-w-0">
                <div className={`h-1.5 rounded-full ${index <= stepIndex ? "bg-[#7A1D1B]" : "bg-[#E5DDD6]"}`} />
                <p className={`mt-1 hidden truncate text-center text-[9px] font-bold sm:block ${index === stepIndex ? "text-[#7A1D1B]" : "text-[#928A83]"}`}>{item.short}</p>
              </div>
            ))}
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {recovering && <div className="mb-4 rounded-xl border border-[#E8E0D8] bg-white p-3 text-xs font-semibold text-[#746E69]">Checking for a saved schedule…</div>}
          {recoveryPlan && !reviewingRecovery && (
            <section className="mb-5 rounded-2xl border border-[#D8AE67] bg-[#FFF8ED] p-4 text-[#4B3820]">
              <p className="text-sm font-black">{recoveryPlan.pairComplete ? "A saved schedule is ready" : "This saved schedule needs a return journey"}</p>
              <p className="mt-1 text-xs leading-5 text-[#785F3B]">{recoveryPlan.pairComplete ? `It starts ${formatDate(recoveryPlan.primary.effectiveFrom)} at ${formatTime(recoveryPlan.primary.departureTime)}. Nothing has been replaced.` : recoveryPlan.pairIssue?.message || "Create a complete outbound and return pair before opening ticket sales."}</p>
              <div className={`mt-3 grid gap-2 ${recoveryPlan.pairComplete ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                {recoveryPlan.pairComplete && <button type="button" onClick={() => { clearScheduleRequestId(fleetId); onSaved(); }} className="rounded-xl bg-[#7A1D1B] px-3 py-2.5 text-xs font-black text-white"><Check className="mr-1.5 inline size-3.5" />Continue with saved</button>}
                <button type="button" onClick={() => reviewRecoveredPlan(recoveryPlan)} className="rounded-xl border border-[#CDB991] bg-white px-3 py-2.5 text-xs font-black">Review saved schedule</button>
                {recoveryPlan.canReplace && <button type="button" onClick={() => beginReplacement(recoveryPlan)} className="rounded-xl border border-[#CDB991] bg-white px-3 py-2.5 text-xs font-black"><RotateCcw className="mr-1.5 inline size-3.5" />{recoveryPlan.pairComplete ? "Create replacement" : "Fix with paired schedule"}</button>}
              </div>
            </section>
          )}
          {!config && <div className="rounded-2xl border border-[#D9BDB7] bg-[#FAF2F0] p-4 text-sm font-bold text-[#7A1D1B]">Complete Stops & timings before adding a trip schedule.</div>}

          {config && step === "journey" && (
            <div className="space-y-5">
              {configs.length > 1 && (
                <label className="block space-y-2 text-sm font-black text-[#211D1A]">Saved stop plan
                  <select value={configId} onChange={(event) => setConfigId(event.target.value)} className="block h-11 w-full rounded-xl border border-[#DED7D1] bg-white px-3 text-sm font-bold outline-none focus:border-[#7A1D1B]">
                    {configs.map((item) => <option key={item._id} value={item._id}>{item.patternName || "Standard route"}</option>)}
                  </select>
                </label>
              )}
              <section>
                <p className="mb-2 text-sm font-black text-[#211D1A]">Which direction leaves first?</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Choice selected={!reverse} title={`${origin} → ${destination}`} detail="Use the saved outbound time" onClick={() => setReverse(false)} />
                  <Choice selected={reverse} title={`${destination} → ${origin}`} detail={!canReverse ? "Return timing is not ready" : "Use the saved return time first"} disabled={!canReverse} onClick={() => setReverse(true)} />
                </div>
              </section>
              {outbound.departure && outbound.arrival
                ? <JourneyTimeCard from={from} to={to} departure={outbound.departure} arrival={outbound.arrival} arrivalDayOffset={outbound.arrivalDayOffset} label="Saved first-journey time" />
                : <div className="rounded-xl border border-[#D9BDB7] bg-[#FAF2F0] p-3 text-sm font-bold text-[#7A1D1B]">This direction has no saved travel time. Complete Stops & timings first.</div>}
              <p className="flex items-start gap-2 text-xs leading-5 text-[#746E69]"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#7A1D1B]" />Travel times come from the bus setup, so they stay consistent everywhere.</p>
            </div>
          )}

          {config && step === "days" && (
            <div className="space-y-6">
              <label className="block space-y-2 text-sm font-black text-[#211D1A]">First service date
                <input type="date" min={minimumDate} value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} className="block h-12 w-full rounded-xl border border-[#DED7D1] bg-white px-3 text-sm font-bold outline-none focus:border-[#7A1D1B]" />
                <span className="block text-[11px] font-semibold text-[#817A74]">Passengers can book trips starting from this date.</span>
              </label>
              <section>
                <p className="mb-2 text-sm font-black text-[#211D1A]">How often will it run?</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Choice selected={recurrence === "DAILY"} title="Every day" detail="Runs seven days a week" onClick={() => setRecurrence("DAILY")} />
                  <Choice selected={recurrence === "CUSTOM"} title="Only on chosen days" detail="For example: Sunday, Tuesday, Friday" onClick={() => setRecurrence("CUSTOM")} />
                </div>
              </section>
              {recurrence === "CUSTOM" && (
                <section className="rounded-2xl border border-[#E8E0D8] bg-white p-4">
                  <p className="mb-3 text-sm font-black text-[#211D1A]">Tap every running day</p>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {DAYS.map((day) => <button key={day.value} type="button" title={day.label} onClick={() => toggleDay(day.value)} className={`min-h-11 rounded-xl border text-xs font-black ${daysOfWeek.includes(day.value) ? "border-[#7A1D1B] bg-[#7A1D1B] text-white" : "border-[#DED7D1] bg-white text-[#514A45]"}`}>{day.short}</button>)}
                  </div>
                  {daysOfWeek.length === 0 && <p className="mt-2 text-[11px] font-bold text-[#7A1D1B]">Choose at least one day.</p>}
                </section>
              )}
            </div>
          )}

          {config && step === "return" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E8E0D8] bg-[#F7F3EE] p-3 text-xs leading-5 text-[#655E58]">Every bus schedule includes its paired return journey. The return uses the separate times saved in Stops & timings.</div>
              {returning.departure && returning.arrival
                ? <JourneyTimeCard from={to} to={from} departure={returning.departure} arrival={returning.arrival} arrivalDayOffset={returning.arrivalDayOffset} label="Saved return time" />
                : <div className="rounded-xl border border-[#D9BDB7] bg-[#FAF2F0] p-3 text-sm font-bold text-[#7A1D1B]">Return timing is missing. Add it in Stops & timings first.</div>}
              <section>
                <p className="mb-2 text-sm font-black text-[#211D1A]">When does the return start?</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Choice selected={effectiveReturnMode === "SAME_DAY"} title="On the same day" disabled={!canSameDay} detail={!canSameDay ? "The bus has not arrived with enough turnaround time" : "Returns after arriving and a short turnaround"} onClick={() => setReturnMode("SAME_DAY")} />
                  <Choice selected={effectiveReturnMode === "NEXT_DAY"} title="On the next day" detail="The bus stays overnight before returning" onClick={() => setReturnMode("NEXT_DAY")} />
                </div>
              </section>
            </div>
          )}

          {config && step === "rules" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E8E0D8] bg-[#F7F3EE] p-3 text-xs leading-5 text-[#655E58]">These defaults work for most operators. Change them only if your booking policy is different.</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="rounded-2xl border border-[#E8E0D8] bg-white p-4 text-sm font-black text-[#211D1A]">Passengers can book up to
                  <select value={advanceBookingDays} onChange={(event) => setAdvanceBookingDays(Number(event.target.value))} className="mt-3 block h-11 w-full rounded-xl border border-[#DED7D1] bg-white px-3 text-sm font-bold outline-none focus:border-[#7A1D1B]">
                    {[30, 45, 60, 90, 120].map((value) => <option key={value} value={value}>{value} days ahead</option>)}
                  </select>
                </label>
                <label className="rounded-2xl border border-[#E8E0D8] bg-white p-4 text-sm font-black text-[#211D1A]">Booking closes
                  <select value={bookingCutoffHours} onChange={(event) => setBookingCutoffHours(Number(event.target.value))} className="mt-3 block h-11 w-full rounded-xl border border-[#DED7D1] bg-white px-3 text-sm font-bold outline-none focus:border-[#7A1D1B]">
                    {[0, 1, 2, 4, 12, 24].map((value) => <option key={value} value={value}>{value === 0 ? "At departure" : `${value} hours before departure`}</option>)}
                  </select>
                </label>
              </div>
              <label className="block rounded-2xl border border-[#E8E0D8] bg-white p-4 text-sm font-black text-[#211D1A]">Last service date <span className="font-semibold text-[#817A74]">(optional)</span>
                <input type="date" min={effectiveFrom || minimumDate} value={effectiveUntil} onChange={(event) => setEffectiveUntil(event.target.value)} className="mt-3 block h-11 w-full rounded-xl border border-[#DED7D1] bg-white px-3 text-sm font-bold outline-none focus:border-[#7A1D1B]" />
                <span className="mt-2 block text-[11px] font-semibold text-[#817A74]">Leave empty if this schedule has no planned end date.</span>
              </label>
            </div>
          )}

          {config && step === "review" && (
            <div className="space-y-4">
              {error && (
                <div role="alert" className="rounded-xl border border-[#DFA9A2] bg-[#FFF3F1] p-3 text-xs font-bold leading-5 text-[#9A241F]">
                  <p>{error}</p>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <ReviewCard label="First journey"><p>{from} → {to}</p><p className="text-[#655E58]">{formatTime(reviewingRecovery?.primary.departureTime || outbound.departure)} → {formatTime(reviewingRecovery?.primary.arrivalTime || outbound.arrival)}{(reviewingRecovery?.primary.arrivalDayOffset ?? outbound.arrivalDayOffset) ? " · arrives next day" : ""}</p></ReviewCard>
                <ReviewCard label="Running days"><p>Starts {formatDate((reviewingRecovery?.primary.effectiveFrom || effectiveFrom).slice(0, 10))}</p><p className="text-[#655E58]">{reviewingRecovery ? (reviewingRecovery.primary.recurrence === "DAILY" ? "Every day" : DAYS.filter(day => (reviewingRecovery.primary.daysOfWeek || []).includes(day.value)).map(day => day.short).join(", ")) : dayText}</p></ReviewCard>
                <ReviewCard label="Return journey"><p>{to} → {from}</p><p className="text-[#655E58]">{reviewingRecovery && !reviewingRecovery.returnSchedule ? "Missing — replacement required" : `Leaves ${formatTime(reviewingRecovery?.returnSchedule?.departureTime || returning.departure)} · ${((reviewingRecovery?.primary.returnMode || (reviewingRecovery?.primary.operationalModel === "RELAY" ? "NEXT_DAY" : undefined)) === "NEXT_DAY" || (!reviewingRecovery && effectiveReturnMode === "NEXT_DAY")) ? "next day" : "same day"}`}</p></ReviewCard>
                <ReviewCard label="Booking rules"><p>Book up to {reviewingRecovery?.primary.advanceBookingDays || advanceBookingDays} days ahead</p><p className="text-[#655E58]">Closes {(reviewingRecovery?.primary.bookingCutoffHours ?? bookingCutoffHours) === 0 ? "at departure" : `${reviewingRecovery?.primary.bookingCutoffHours ?? bookingCutoffHours} hours before`}</p></ReviewCard>
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-[#F3EFEB] px-4 py-3 text-xs leading-5 text-[#655E58]"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#7A1D1B]" /><span>Saving creates the schedule only. Passenger bookings remain closed until you complete the final “Start selling tickets” step.</span></div>
            </div>
          )}
        </main>

        <footer className="grid shrink-0 grid-cols-2 gap-3 border-t border-[#E8E1DB] bg-white px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex sm:items-center sm:px-6">
          {stepIndex === 0
            ? <button type="button" disabled={busy} onClick={onClose} className="w-full rounded-xl border border-[#DED7D1] px-4 py-2.5 text-xs font-black text-[#514A45] sm:w-auto">Cancel</button>
            : <button type="button" disabled={busy} onClick={back} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#DED7D1] px-3 py-2.5 text-xs font-black text-[#514A45] sm:w-auto sm:px-4"><ArrowLeft className="size-4" /> Back</button>}
          {step === "review"
            ? reviewingRecovery
              ? reviewingRecovery.pairComplete
                ? <button type="button" onClick={() => { clearScheduleRequestId(fleetId); onSaved(); }} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] px-3 py-3 text-xs font-black text-white sm:ml-auto sm:w-auto sm:px-5"><Check className="size-4" />Continue with saved schedule</button>
                : <button type="button" disabled={!reviewingRecovery.canReplace} onClick={() => beginReplacement(reviewingRecovery)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] px-3 py-3 text-xs font-black text-white disabled:opacity-50 sm:ml-auto sm:w-auto sm:px-5"><RotateCcw className="size-4" />Fix with paired schedule</button>
              : <button type="button" disabled={busy || !formReady || !requestId} onClick={() => void save()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] px-3 py-3 text-xs font-black text-white disabled:opacity-60 sm:ml-auto sm:w-auto sm:px-5">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <CalendarDays className="size-4" />} {replaceServicePlanId ? "Replace saved draft" : "Save trip schedule"}</button>
            : <button type="button" disabled={!isCurrentStepReady} onClick={next} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] px-3 py-3 text-xs font-black text-white disabled:bg-[#D8D0C9] sm:ml-auto sm:w-auto sm:px-5">Continue <ArrowRight className="size-4" /></button>}
        </footer>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, CalendarDays, Check, Loader2, MapPinned, Route, X } from "lucide-react";
import type { OwnerTrip } from "@/features/trip-seat-controls/types";
import {
  getAvailableOperatorVariants,
  getOperatorRouteConfigs,
  getRouteVariantId,
  getVariantCorridorId,
  type AvailableOperatorVariant,
  type OperatorRouteConfig,
} from "@/features/operator-dashboard/route-configuration-api";
import {
  changeFleetServiceRoute,
  clearPersistentRouteChangeRequestId,
  overrideFleetTripRoute,
  persistentRouteChangeRequestId,
  type RouteChangeScope,
} from "@/features/operator-dashboard/schedule-plan-api";

type Scope = RouteChangeScope | "ONE_TRIP";

const OPTIONS: Array<{ scope: Scope; title: string; body: string }> = [
  { scope: "TEMPORARY", title: "Temporary road change", body: "Use another road for a date range, then return automatically." },
  { scope: "PERMANENT", title: "Change from a date onward", body: "Use the new road for all future departures." },
  { scope: "SELECTED_DATES", title: "Only selected dates", body: "Change several specific departures without affecting the days between." },
  { scope: "ONE_TRIP", title: "Only this trip", body: "Change the selected departure and nothing else." },
];

const formatDate = (value: string) => value
  ? new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
  : "Not selected";

export default function TripRouteChangeModal({ trip, onClose, onSaved }: {
  trip: OwnerTrip;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const fleetId = trip.busId?._id || "";
  const brandId = typeof trip.brandId === "string" ? trip.brandId : "";
  const corridorId = trip.routeSnapshot?.corridor?.corridorId || trip.corridorId || "";
  const [step, setStep] = useState(1);
  const [scope, setScope] = useState<Scope>("TEMPORARY");
  const [variants, setVariants] = useState<AvailableOperatorVariant[]>([]);
  const [configs, setConfigs] = useState<OperatorRouteConfig[]>([]);
  const [variantId, setVariantId] = useState("");
  const [configId, setConfigId] = useState("");
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0, 10));
  const [untilDate, setUntilDate] = useState(new Date().toISOString().slice(0, 10));
  const [dateInput, setDateInput] = useState("");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [isLoading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setError] = useState<string | null>(null);
  const contextError = !fleetId || !brandId
    ? "This trip is missing its bus or operator information."
    : null;
  const error = contextError || loadError;
  const loading = !contextError && isLoading;

  useEffect(() => {
    let active = true;
    if (!fleetId || !brandId) return;
    Promise.all([
      getAvailableOperatorVariants(brandId, fleetId),
      getOperatorRouteConfigs(brandId, fleetId),
    ]).then(([variantRows, configRows]) => {
      if (!active) return;
      const sameCorridor = variantRows.filter((variant) => !corridorId || getVariantCorridorId(variant) === corridorId);
      setVariants(sameCorridor);
      setConfigs(configRows.filter((config) => config.status === "ACTIVE"));
      const currentVersion = trip.routeSnapshot?.routeVersion?.variantId;
      const firstAlternative = sameCorridor.find((variant) => variant._id !== currentVersion) || sameCorridor[0];
      if (firstAlternative) setVariantId(firstAlternative._id);
    }).catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : "Unable to load available roads.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [brandId, corridorId, fleetId, trip.routeSnapshot?.routeVersion?.variantId]);

  const selectedVariant = variants.find((variant) => variant._id === variantId) || null;
  const matchingConfigs = useMemo(() => configs.filter((config) => getRouteVariantId(config) === variantId), [configs, variantId]);
  const activeConfigId = matchingConfigs.some((config) => config._id === configId)
    ? configId
    : matchingConfigs.find((config) => config.isDefault)?._id || matchingConfigs[0]?._id || "";

  const canContinueDates = scope === "ONE_TRIP"
    || (scope === "SELECTED_DATES" ? selectedDates.length > 0
      : Boolean(fromDate && (scope !== "TEMPORARY" || untilDate)));
  const canReview = Boolean(selectedVariant && selectedVariant.returnVariantId && activeConfigId && canContinueDates && reason.trim());

  function addDate() {
    if (!dateInput || selectedDates.includes(dateInput)) return;
    setSelectedDates((current) => [...current, dateInput].sort());
    setDateInput("");
  }

  async function save() {
    if (!selectedVariant?.returnVariantId || !activeConfigId || !fleetId) return;
    setSaving(true);
    setError(null);
    const target = scope === "ONE_TRIP" ? `trip:${trip._id}` : `plan:${trip.scheduleId}`;
    const changeSignature = JSON.stringify({
      scope,
      variantId: selectedVariant._id,
      returnVariantId: selectedVariant.returnVariantId,
      configId: activeConfigId,
      fromDate: scope === "SELECTED_DATES" || scope === "ONE_TRIP" ? null : fromDate,
      untilDate: scope === "TEMPORARY" ? untilDate : null,
      selectedDates: scope === "SELECTED_DATES" ? selectedDates : [],
      reason: reason.trim(),
    });
    const routeFields = {
      requestId: persistentRouteChangeRequestId(fleetId, target, changeSignature),
      primaryVariantId: selectedVariant._id,
      returnVariantId: selectedVariant.returnVariantId,
      primaryOperatorRouteConfigId: activeConfigId,
      returnOperatorRouteConfigId: activeConfigId,
      reason: reason.trim(),
    };
    try {
      if (scope === "ONE_TRIP") {
        await overrideFleetTripRoute(fleetId, trip._id, routeFields);
      } else {
        await changeFleetServiceRoute(fleetId, {
          ...routeFields,
          scheduleId: trip.scheduleId,
          scope,
          ...(scope !== "SELECTED_DATES" ? { effectiveFrom: fromDate } : {}),
          ...(scope === "TEMPORARY" ? { effectiveUntil: untilDate } : {}),
          ...(scope === "SELECTED_DATES" ? { selectedDates } : {}),
        });
      }
      clearPersistentRouteChangeRequestId(fleetId, target);
      onSaved(scope === "ONE_TRIP"
        ? "Road changed for this trip. Existing bookings remain attached."
        : "Road change saved. Only departures in the chosen period are affected.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save this road change.");
      setStep(2);
    } finally {
      setSaving(false);
    }
  }

  const selectedLabel = selectedVariant?.name || selectedVariant?.code || "Selected road";

  return <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="Change trip road">
    <div className="flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-[#FFFCFA] shadow-2xl sm:max-h-[90dvh] sm:max-w-2xl sm:rounded-3xl">
      <header className="flex items-start gap-3 border-b border-[#E8E1DB] bg-white p-5 sm:p-6">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#F5E8E6] text-[#7A1D1B]"><Route className="size-5" /></span>
        <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7A1D1B]">Step {step} of 3</p><h2 className="mt-1 text-xl font-black text-[#211D1A]">Change the road, not the service</h2><p className="mt-1 text-xs text-[#746E69]">{trip.routeSnapshot?.corridor?.origin?.name || "Origin"} ⇄ {trip.routeSnapshot?.corridor?.destination?.name || "Destination"} stays the same.</p></div>
        <button type="button" onClick={onClose} className="rounded-xl p-2 text-[#746E69] hover:bg-[#F5F1ED]" aria-label="Close"><X className="size-5" /></button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
        {error && <div className="mb-4 flex gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{error}</div>}
        {loading ? <div className="flex h-52 items-center justify-center text-sm text-[#746E69]"><Loader2 className="mr-2 size-4 animate-spin" />Loading saved roads…</div> : step === 1 ? <div>
          <h3 className="text-base font-black text-[#211D1A]">How much should change?</h3>
          <p className="mt-1 text-sm text-[#746E69]">Choose the smallest option that solves today&apos;s problem.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">{OPTIONS.map((option) => <button type="button" key={option.scope} onClick={() => setScope(option.scope)} className={`rounded-2xl border p-4 text-left transition ${scope === option.scope ? "border-[#7A1D1B] bg-[#FFF3F0] ring-1 ring-[#7A1D1B]" : "border-[#E3DCD5] bg-white hover:border-[#C9B8AE]"}`}><div className="flex items-center gap-2"><span className={`flex size-5 items-center justify-center rounded-full border ${scope === option.scope ? "border-[#7A1D1B] bg-[#7A1D1B] text-white" : "border-[#B8AEA6]"}`}>{scope === option.scope && <Check className="size-3" />}</span><span className="text-sm font-black text-[#211D1A]">{option.title}</span></div><p className="ml-7 mt-2 text-xs leading-5 text-[#746E69]">{option.body}</p></button>)}</div>
        </div> : step === 2 ? <div className="space-y-5">
          <div><label className="text-sm font-black text-[#211D1A]">Which road should the bus use?</label><select value={variantId} onChange={(event) => setVariantId(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#DCD4CD] bg-white px-3 text-sm font-bold outline-none focus:border-[#7A1D1B]"><option value="">Choose a saved road</option>{variants.map((variant) => <option key={variant._id} value={variant._id}>{variant.name || variant.code} {variant.revisionNumber ? `· version ${variant.revisionNumber}` : ""}</option>)}</select></div>
          <div><label className="text-sm font-black text-[#211D1A]">Stops and timings</label><select value={activeConfigId} onChange={(event) => setConfigId(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#DCD4CD] bg-white px-3 text-sm font-bold outline-none focus:border-[#7A1D1B]"><option value="">Choose saved stops and timings</option>{matchingConfigs.map((config) => <option key={config._id} value={config._id}>{config.patternName || "Standard timetable"}</option>)}</select>{variantId && matchingConfigs.length === 0 && <p className="mt-2 text-xs font-bold text-amber-800">This road needs its two-way stops and timings saved before it can be used.</p>}</div>
          {scope === "ONE_TRIP" ? <div className="rounded-2xl border border-[#E3DCD5] bg-white p-4"><p className="text-[10px] font-black uppercase tracking-wider text-[#8B8179]">Only this departure</p><p className="mt-1 text-sm font-black text-[#211D1A]">{new Date(trip.tripDate).toLocaleDateString()} · {trip.departureTime}</p></div> : scope === "SELECTED_DATES" ? <div><label className="text-sm font-black text-[#211D1A]">Which dates?</label><div className="mt-2 flex gap-2"><input type="date" min={new Date().toISOString().slice(0, 10)} value={dateInput} onChange={(event) => setDateInput(event.target.value)} className="h-12 min-w-0 flex-1 rounded-xl border border-[#DCD4CD] bg-white px-3 text-sm font-bold" /><button type="button" onClick={addDate} className="rounded-xl bg-[#211D1A] px-4 text-xs font-black text-white">Add date</button></div><div className="mt-2 flex flex-wrap gap-2">{selectedDates.map((date) => <button type="button" key={date} onClick={() => setSelectedDates((current) => current.filter((item) => item !== date))} className="rounded-full bg-[#F5E8E6] px-3 py-1.5 text-xs font-bold text-[#7A1D1B]">{formatDate(date)} ×</button>)}</div></div> : <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-black text-[#211D1A]">Starts on<input type="date" min={new Date().toISOString().slice(0, 10)} value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#DCD4CD] bg-white px-3 text-sm font-bold" /></label>{scope === "TEMPORARY" && <label className="text-sm font-black text-[#211D1A]">Returns to normal after<input type="date" min={fromDate} value={untilDate} onChange={(event) => setUntilDate(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#DCD4CD] bg-white px-3 text-sm font-bold" /></label>}</div>}
          <div><label className="text-sm font-black text-[#211D1A]">Why is the road changing?</label><textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} rows={3} placeholder="Example: Landslide near Sindhuli; using Hetauda road" className="mt-2 w-full resize-none rounded-xl border border-[#DCD4CD] bg-white p-3 text-sm outline-none focus:border-[#7A1D1B]" /></div>
        </div> : <div>
          <h3 className="text-base font-black text-[#211D1A]">Check before applying</h3><p className="mt-1 text-sm text-[#746E69]">Bookings stay attached to their trips. Only the road and its saved timings change.</p>
          <div className="mt-5 overflow-hidden rounded-2xl border border-[#E3DCD5] bg-white"><div className="flex gap-3 border-b border-[#EEE8E2] p-4"><MapPinned className="size-5 text-[#7A1D1B]" /><div><p className="text-[10px] font-black uppercase tracking-wider text-[#8B8179]">New road</p><p className="mt-1 text-sm font-black">{selectedLabel}</p></div></div><div className="flex gap-3 border-b border-[#EEE8E2] p-4"><CalendarDays className="size-5 text-[#7A1D1B]" /><div><p className="text-[10px] font-black uppercase tracking-wider text-[#8B8179]">Affects</p><p className="mt-1 text-sm font-black">{scope === "ONE_TRIP" ? `Only ${new Date(trip.tripDate).toLocaleDateString()}` : scope === "SELECTED_DATES" ? selectedDates.map(formatDate).join(", ") : scope === "PERMANENT" ? `${formatDate(fromDate)} onward` : `${formatDate(fromDate)} through ${formatDate(untilDate)}`}</p></div></div><div className="p-4"><p className="text-[10px] font-black uppercase tracking-wider text-[#8B8179]">Reason passengers and staff can understand</p><p className="mt-1 text-sm font-bold text-[#4F4944]">{reason}</p></div></div>
          <div className="mt-4 rounded-2xl bg-[#F5F1ED] p-4 text-xs leading-5 text-[#655E58]"><strong>What stays unchanged:</strong> Kathmandu ⇄ Malangwa service, existing bookings, assigned seats and ticket prices.</div>
        </div>}
      </div>

      <footer className="flex gap-3 border-t border-[#E8E1DB] bg-white p-4 sm:px-6"><button type="button" onClick={step === 1 ? onClose : () => setStep((value) => value - 1)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#DCD4CD] px-4 text-sm font-black text-[#4F4944]"><ArrowLeft className="size-4" />{step === 1 ? "Cancel" : "Back"}</button>{step < 3 ? <button type="button" onClick={() => setStep((value) => value + 1)} disabled={step === 2 && !canReview} className="ml-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-[#D8D0C9]">Continue<ArrowRight className="size-4" /></button> : <button type="button" onClick={() => void save()} disabled={saving} className="ml-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] px-5 text-sm font-black text-white disabled:opacity-60">{saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Apply road change</button>}</footer>
    </div>
  </div>;
}

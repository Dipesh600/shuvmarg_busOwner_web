"use client";

import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  AlertTriangle, Armchair, ArrowLeft, ArrowRight, Ban, CalendarDays, Check,
  Clock3, IndianRupee, Loader2, MapPinned, PauseCircle, Route, UserRound,
  UsersRound, X,
} from "lucide-react";
import type { OwnerTrip, TripSeatControl } from "@/features/trip-seat-controls/types";
import { listVehicleCrewOptions, type VehicleCrewOption } from "@/features/crew-management/api";
import {
  getAvailableOperatorVariants, getOperatorRouteConfigs, getRouteVariantId,
  getVariantCorridorId, type AvailableOperatorVariant, type OperatorRouteConfig,
} from "@/features/operator-dashboard/route-configuration-api";
import { fetchFleetSetupStatus } from "@/features/operator-dashboard/operator-dashboard-api";
import {
  applyFleetOperationalChange, clearOperationalChangeRequestId,
  listFleetOperationalChanges, persistentOperationalChangeRequestId, previewFleetOperationalChange,
  type OperationalChangePreview, type OperationalChangeScope, type OperationalChangeType,
} from "@/features/operator-dashboard/schedule-plan-api";

type Choice = { type: OperationalChangeType; title: string; help: string; icon: ComponentType<{ className?: string }> };
const CHOICES: Choice[] = [
  { type: "CHANGE_ROUTE", title: "Road or route", help: "Use a diversion or replacement road.", icon: Route },
  { type: "CHANGE_STOPS", title: "Stops", help: "Use another saved two-way stop pattern.", icon: MapPinned },
  { type: "CHANGE_OUTBOUND_TIMING", title: "Outbound time", help: "Change the first journey only.", icon: Clock3 },
  { type: "CHANGE_RETURN_TIMING", title: "Return time", help: "Change the return journey only.", icon: Clock3 },
  { type: "CHANGE_FARE", title: "Fare", help: "Update the base passenger fare.", icon: IndianRupee },
  { type: "CHANGE_AVAILABLE_SEATS", title: "Available seats", help: "Choose which places can be booked.", icon: Armchair },
  { type: "CHANGE_DRIVER", title: "Driver", help: "Assign a driver to these departures.", icon: UserRound },
  { type: "CHANGE_CONDUCTOR", title: "Conductor", help: "Assign a conductor to these departures.", icon: UsersRound },
  { type: "CHANGE_OPERATING_DAYS", title: "Operating days", help: "Choose which weekdays the service runs.", icon: CalendarDays },
  { type: "CHANGE_BOOKING_CUTOFF", title: "Booking cutoff", help: "Close booking before departure.", icon: Clock3 },
  { type: "SUSPEND_SERVICE", title: "Suspend service", help: "Pause selected upcoming departures.", icon: PauseCircle },
  { type: "CANCEL_SERVICE", title: "Cancel service", help: "Cancel selected upcoming departures.", icon: Ban },
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const today = () => new Date().toISOString().slice(0, 10);

function readValue(type: OperationalChangeType, value?: Record<string, unknown> | null) {
  if (!value) return "Not recorded";
  if (type.includes("TIMING")) return `${value.departureTime || "—"} → ${value.arrivalTime || "—"}${Number(value.arrivalDayOffset || 0) ? " · next day" : ""}`;
  if (type === "CHANGE_FARE") return `NPR ${Number(value.baseFare || 0).toLocaleString()}`;
  if (type === "CHANGE_AVAILABLE_SEATS") return `${Array.isArray(value.availableElementIds) ? value.availableElementIds.length : 0} seats available`;
  if (type === "CHANGE_OPERATING_DAYS") return ((value.daysOfWeek as number[]) || []).map(day => DAYS[day]).join(", ");
  if (type === "CHANGE_BOOKING_CUTOFF") return `${value.hours ?? "—"} hours before departure`;
  if (["CHANGE_DRIVER", "CHANGE_CONDUCTOR"].includes(type)) return String(value.fullName || value.profileId || "Not assigned");
  if (type === "SUSPEND_SERVICE") return "Service will be paused";
  if (type === "CANCEL_SERVICE") return "Trips will be cancelled";
  if (type === "CHANGE_ROUTE") return String(value.routeName || "Selected saved road");
  return String(value.patternName || "Selected saved two-way stop pattern");
}

function CardButton({ selected, disabled, onClick, children }: { selected?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={`w-full rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${selected ? "border-[#A95049] bg-[#F8ECE8]" : "border-[#E5DDD6] bg-white hover:border-[#C8AAA5]"}`}>{children}</button>;
}

function timeChangeText(delta?: number | null) {
  if (!delta) return "Departure time changes";
  const absolute = Math.abs(delta);
  const hours = Math.floor(absolute / 60);
  const minutes = absolute % 60;
  const amount = [hours ? `${hours} hour${hours === 1 ? "" : "s"}` : "", minutes ? `${minutes} minutes` : ""]
    .filter(Boolean).join(" ");
  return `Departure moves ${amount} ${delta > 0 ? "later" : "earlier"}`;
}

function historyStatus(row: Record<string, unknown>) {
  const resolution = row.passengerResolution as { status?: string; unresolvedBookingCount?: number } | undefined;
  return resolution?.status === "REQUIRES_ATTENTION"
    ? `Passenger follow-up · ${resolution.unresolvedBookingCount || 0}`
    : String(row.status);
}

function PassengerProtectionSummary({ preview, confirmed, onConfirm }: {
  preview: OperationalChangePreview;
  confirmed: boolean;
  onConfirm: (value: boolean) => void;
}) {
  const protection = preview.impact.bookingProtection;
  const resolution = preview.impact.passengerResolution;
  if (!protection?.hasExistingBookings) {
    return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-900">No existing passenger booking is affected.</div>;
  }
  return <section className="space-y-3" aria-label="Passenger protection review">
    <div className="rounded-2xl border border-[#E5DDD6] bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-wider text-[#918A84]">Passenger impact</p>
      <div className="mt-3 space-y-2 text-sm font-bold text-[#514A45]">
        {protection.departure.changes && <p>{timeChangeText(protection.departure.deltaMinutes)} · {protection.departure.from} → {protection.departure.to}</p>}
        {protection.departure.arrivalChanges && <p>Arrival changes · {protection.departure.arrivalFrom} → {protection.departure.arrivalTo}</p>}
        {protection.route.significant && <p>The road or served stops change for these passengers.</p>}
        {protection.boarding.changes && <p>{protection.boarding.affectedBookingCount} booking(s) have a changed boarding setup.</p>}
        {protection.fare.changes && <p>Future fare changes from NPR {protection.fare.from?.toLocaleString()} to NPR {protection.fare.to?.toLocaleString()}. Existing passengers keep the fare they paid.</p>}
        {!protection.departure.anyTimingChanges && !protection.route.significant && !protection.boarding.changes && !protection.fare.changes && <p>Existing bookings remain unchanged by this update.</p>}
      </div>
    </div>
    {resolution.required && <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
      <input type="checkbox" checked={confirmed} onChange={event => onConfirm(event.target.checked)} className="mt-0.5 size-4 accent-[#7A1D1B]" />
      <span><span className="block text-sm font-black">Refund or rebooking support is required</span><span className="mt-1 block text-xs font-semibold">{resolution.message}</span></span>
    </label>}
  </section>;
}

export default function LiveServiceChangeModal({ trip, control, onClose, onSaved }: {
  trip: OwnerTrip;
  control: TripSeatControl | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const fleetId = trip.busId?._id || "";
  const brandId = typeof trip.brandId === "string" ? trip.brandId : "";
  const corridorId = trip.routeSnapshot?.corridor?.corridorId || trip.corridorId || "";
  const [step, setStep] = useState(1);
  const [type, setType] = useState<OperationalChangeType | null>(null);
  const [scope, setScope] = useState<OperationalChangeScope>("ONE_TRIP");
  const [effectiveFrom, setEffectiveFrom] = useState(today());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [dateInput, setDateInput] = useState("");
  const [reason, setReason] = useState("");
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [variants, setVariants] = useState<AvailableOperatorVariant[]>([]);
  const [configs, setConfigs] = useState<OperatorRouteConfig[]>([]);
  const [drivers, setDrivers] = useState<VehicleCrewOption[]>([]);
  const [conductors, setConductors] = useState<VehicleCrewOption[]>([]);
  const [setup, setSetup] = useState<Awaited<ReturnType<typeof fetchFleetSetupStatus>> | null>(null);
  const [preview, setPreview] = useState<OperationalChangePreview | null>(null);
  const [confirmResolution, setConfirmResolution] = useState(false);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setError] = useState("");
  const contextError = !fleetId || !brandId
    ? "This trip is missing its bus or operator information."
    : "";
  const error = contextError || loadError;
  const loading = !contextError && isLoading;

  useEffect(() => {
    let active = true;
    if (!fleetId || !brandId) return;
    Promise.all([
      getAvailableOperatorVariants(brandId, fleetId), getOperatorRouteConfigs(brandId, fleetId),
      listVehicleCrewOptions(fleetId, "driver"), listVehicleCrewOptions(fleetId, "conductor"),
      fetchFleetSetupStatus(fleetId), listFleetOperationalChanges(fleetId),
    ]).then(([variantRows, configRows, driverRows, conductorRows, setupRow, historyRows]) => {
      if (!active) return;
      setVariants(variantRows.filter(item => !corridorId || getVariantCorridorId(item) === corridorId));
      setConfigs(configRows.filter(item => item.status === "ACTIVE"));
      setDrivers(driverRows.options); setConductors(conductorRows.options); setSetup(setupRow);
      setHistory(historyRows);
    }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load live service details."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [brandId, corridorId, fleetId]);

  const selectedVariantId = String(values.primaryVariantId || "");
  const selectedVariant = variants.find(item => item._id === selectedVariantId);
  const matchingConfigs = useMemo(() => configs.filter(item => getRouteVariantId(item) === selectedVariantId), [configs, selectedVariantId]);
  const places = control?.layout.sections.flatMap(section => section.elements).filter(item => item.kind === "SEAT" || item.kind === "BERTH") || [];
  const choice = CHOICES.find(item => item.type === type);
  const visibleHistory = history.filter(row => ["APPLIED", "FAILED", "REVOKED"].includes(String(row.status)));

  function chooseType(next: OperationalChangeType) {
    setType(next); setPreview(null); setError("");
    if (next === "CHANGE_OUTBOUND_TIMING") setValues({ departureTime: setup?.outboundScheduleData?.departureTime || trip.departureTime, arrivalTime: setup?.outboundScheduleData?.arrivalTime || trip.arrivalTime || "", arrivalDayOffset: setup?.outboundScheduleData?.arrivalDayOffset || 0 });
    if (next === "CHANGE_RETURN_TIMING") setValues({ departureTime: setup?.returnScheduleData?.departureTime || "", arrivalTime: setup?.returnScheduleData?.arrivalTime || "", arrivalDayOffset: setup?.returnScheduleData?.arrivalDayOffset || 0 });
    if (next === "CHANGE_FARE") setValues({ baseFare: control?.pricing.defaultFare || setup?.publication?.configuration?.pricing.defaultFare || 0, fareOverrides: control?.pricing.overrides || [] });
    if (next === "CHANGE_AVAILABLE_SEATS") setValues({ availableElementIds: control?.places.filter(item => item.state === "OPEN").map(item => item.elementId) || [] });
    if (next === "CHANGE_OPERATING_DAYS") setValues({ daysOfWeek: setup?.outboundScheduleData?.recurrence === "DAILY" ? [0,1,2,3,4,5,6] : setup?.outboundScheduleData?.daysOfWeek || [] });
    if (next === "CHANGE_BOOKING_CUTOFF") setValues({ hours: setup?.outboundScheduleData?.bookingCutoffHours ?? 2 });
    if (["CHANGE_DRIVER", "CHANGE_CONDUCTOR"].includes(next)) setValues({ profileId: "" });
    if (next === "CHANGE_ROUTE") setValues({ primaryVariantId: "", returnVariantId: "", primaryOperatorRouteConfigId: "", returnOperatorRouteConfigId: "" });
    if (next === "CHANGE_STOPS") {
      const currentConfig = setup?.assignedRouteConfigs?.find(item => item.status === "ACTIVE") || setup?.assignedRouteConfigs?.[0];
      const currentVariantId = currentConfig ? getRouteVariantId(currentConfig) : null;
      const currentVariant = variants.find(item => item._id === currentVariantId);
      setValues({
        primaryVariantId: currentVariantId || "",
        returnVariantId: currentVariant?.returnVariantId || "",
        routeName: currentVariant?.name || currentVariant?.code || "Current road",
        primaryOperatorRouteConfigId: currentConfig?._id || "",
        returnOperatorRouteConfigId: currentConfig?._id || "",
        patternName: currentConfig?.patternName || "Current stop pattern",
      });
    }
    if (["SUSPEND_SERVICE", "CANCEL_SERVICE"].includes(next)) setValues({});
    setStep(2);
  }

  const scopeValid = scope === "ONE_TRIP" || (scope === "SELECTED_DATES" ? selectedDates.length > 0 : Boolean(effectiveFrom));
  const valuesValid = (() => {
    if (!type) return false;
    if (type.includes("TIMING")) return Boolean(values.departureTime && values.arrivalTime);
    if (type === "CHANGE_FARE") return Number(values.baseFare) > 0;
    if (type === "CHANGE_AVAILABLE_SEATS") return Array.isArray(values.availableElementIds) && values.availableElementIds.length > 0;
    if (["CHANGE_DRIVER", "CHANGE_CONDUCTOR"].includes(type)) return Boolean(values.profileId);
    if (type === "CHANGE_OPERATING_DAYS") return Array.isArray(values.daysOfWeek) && values.daysOfWeek.length > 0;
    if (type === "CHANGE_BOOKING_CUTOFF") return Number(values.hours) >= 0;
    if (["CHANGE_ROUTE", "CHANGE_STOPS"].includes(type)) return Boolean(values.primaryVariantId && values.returnVariantId && values.primaryOperatorRouteConfigId && values.returnOperatorRouteConfigId);
    return true;
  })();

  async function review() {
    if (!type || !scopeValid || !valuesValid || reason.trim().length < 5) return;
    setBusy(true); setError("");
    try {
      setConfirmResolution(false);
      setPreview(await previewFleetOperationalChange(fleetId, {
        changeType: type, scope, values, reason: reason.trim(),
        ...(scope === "ONE_TRIP" ? { tripId: trip._id } : {}),
        ...(scope === "SELECTED_DATES" ? { selectedDates } : {}),
        ...(scope === "ALL_FUTURE" ? { effectiveFrom } : {}),
      }));
      setStep(4);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to preview this change."); }
    finally { setBusy(false); }
  }

  async function apply() {
    if (!preview) return;
    setBusy(true); setError("");
    try {
      const requestId = persistentOperationalChangeRequestId(fleetId, preview.changeId);
      await applyFleetOperationalChange(fleetId, { impactToken: preview.impactToken, requestId, confirmImpact: true, confirmNotifications: preview.impact.notifications.required, confirmPassengerResolution: confirmResolution });
      clearOperationalChangeRequestId(fleetId, preview.changeId);
      onSaved("Live service updated. The change and its impact were saved in history.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to apply this change."); }
    finally { setBusy(false); }
  }

  function editor() {
    if (!type) return null;
    if (["CHANGE_ROUTE", "CHANGE_STOPS"].includes(type)) return <div className="space-y-4"><label className="block text-sm font-black">{type === "CHANGE_ROUTE" ? "New road" : "Road (kept the same)"}<select disabled={type === "CHANGE_STOPS"} value={selectedVariantId} onChange={event => { const variant = variants.find(item => item._id === event.target.value); setValues({ primaryVariantId: event.target.value, returnVariantId: variant?.returnVariantId || "", routeName: variant?.name || variant?.code || "Selected road", primaryOperatorRouteConfigId: "", returnOperatorRouteConfigId: "" }); }} className="mt-2 h-12 w-full rounded-xl border bg-white px-3 disabled:bg-[#F3EFEB] disabled:text-[#655E58]"><option value="">Choose a route version</option>{variants.map(item => <option key={item._id} value={item._id}>{item.name || item.code} · v{item.revisionNumber || 1}</option>)}</select></label><label className="block text-sm font-black">Stops and two-way timetable<select value={String(values.primaryOperatorRouteConfigId || "")} onChange={event => { const config = matchingConfigs.find(item => item._id === event.target.value); setValues(current => ({ ...current, primaryOperatorRouteConfigId: event.target.value, returnOperatorRouteConfigId: event.target.value, patternName: config?.patternName || "Standard service" })); }} className="mt-2 h-12 w-full rounded-xl border bg-white px-3"><option value="">Choose saved setup</option>{matchingConfigs.map(item => <option key={item._id} value={item._id}>{item.patternName || "Standard service"}</option>)}</select></label>{!variants.length && <p className="rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-900">No approved road version is available for this corridor yet.</p>}{selectedVariant && !matchingConfigs.length && <p className="rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-900">Save an active two-way stops and timings setup for this road first.</p>}</div>;
    if (type.includes("TIMING")) return <div className="grid gap-3 sm:grid-cols-3"><label className="text-sm font-black">Departure<input type="time" value={String(values.departureTime || "")} onChange={event => setValues(current => ({ ...current, departureTime: event.target.value }))} className="mt-2 h-12 w-full rounded-xl border bg-white px-3" /></label><label className="text-sm font-black">Arrival<input type="time" value={String(values.arrivalTime || "")} onChange={event => setValues(current => ({ ...current, arrivalTime: event.target.value }))} className="mt-2 h-12 w-full rounded-xl border bg-white px-3" /></label><label className="text-sm font-black">Arrival day<select value={Number(values.arrivalDayOffset || 0)} onChange={event => setValues(current => ({ ...current, arrivalDayOffset: Number(event.target.value) }))} className="mt-2 h-12 w-full rounded-xl border bg-white px-3"><option value={0}>Same day</option><option value={1}>Next day</option><option value={2}>2 days later</option></select></label></div>;
    if (type === "CHANGE_FARE") return <label className="block text-sm font-black">New base fare<div className="mt-2 flex h-12 max-w-sm items-center rounded-xl border bg-white px-3"><span className="mr-2 text-xs text-[#746E69]">NPR</span><input type="number" min={1} value={Number(values.baseFare || 0) || ""} onChange={event => setValues(current => ({ ...current, baseFare: Number(event.target.value) }))} className="min-w-0 flex-1 bg-transparent text-lg font-black outline-none" /></div></label>;
    if (type === "CHANGE_AVAILABLE_SEATS") { if (!places.length) return <p className="rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-900">Publish a passenger seat layout before changing availability.</p>; const available = new Set((values.availableElementIds as string[]) || []); return <div><div className="mb-3 flex items-center justify-between"><p className="text-sm font-black">{available.size} of {places.length} seats available</p><button type="button" onClick={() => setValues({ availableElementIds: places.map(item => item.elementId) })} className="rounded-xl border px-3 py-2 text-xs font-black">Select all</button></div><div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{places.map(place => <button type="button" key={place.elementId} onClick={() => { const next = new Set(available); next.has(place.elementId) ? next.delete(place.elementId) : next.add(place.elementId); setValues({ availableElementIds: [...next] }); }} className={`rounded-xl border p-2 text-xs font-black ${available.has(place.elementId) ? "border-[#A95049] bg-[#F8ECE8] text-[#7A1D1B]" : "border-dashed bg-white text-[#918A84]"}`}>{place.label || place.elementId}</button>)}</div></div>; }
    if (["CHANGE_DRIVER", "CHANGE_CONDUCTOR"].includes(type)) { const rows = type === "CHANGE_DRIVER" ? drivers : conductors; if (!rows.length) return <p className="rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-900">Connect an eligible {type === "CHANGE_DRIVER" ? "driver" : "conductor"} to this operator first.</p>; return <label className="block text-sm font-black">Choose {type === "CHANGE_DRIVER" ? "driver" : "conductor"}<select value={String(values.profileId || "")} onChange={event => { const person = rows.find(item => item.profileId === event.target.value); setValues({ profileId: event.target.value, fullName: person?.fullName }); }} className="mt-2 h-12 w-full rounded-xl border bg-white px-3"><option value="">Choose eligible crew</option>{rows.map(person => <option key={person.profileId} value={person.profileId} disabled={!person.eligible}>{person.fullName}{person.eligible ? "" : ` · ${person.blockingReason || "not available"}`}</option>)}</select></label>; }
    if (type === "CHANGE_OPERATING_DAYS") { const selected = new Set((values.daysOfWeek as number[]) || []); return <div><p className="mb-3 text-sm font-black">Bus runs on</p><div className="grid grid-cols-4 gap-2 sm:grid-cols-7">{DAYS.map((day, index) => <button type="button" key={day} onClick={() => { const next = new Set(selected); next.has(index) ? next.delete(index) : next.add(index); setValues({ daysOfWeek: [...next].sort() }); }} className={`h-11 rounded-xl border text-xs font-black ${selected.has(index) ? "border-[#A95049] bg-[#F8ECE8] text-[#7A1D1B]" : "bg-white text-[#746E69]"}`}>{day}</button>)}</div></div>; }
    if (type === "CHANGE_BOOKING_CUTOFF") return <label className="block text-sm font-black">Close bookings<input type="number" min={0} max={168} value={Number(values.hours ?? 2)} onChange={event => setValues({ hours: Number(event.target.value) })} className="mx-2 h-11 w-24 rounded-xl border bg-white px-3" />hours before departure</label>;
    return <div className="rounded-2xl border bg-white p-4 text-sm text-[#655E58]">No extra fields are needed. The next screen shows exactly which trips and passengers are affected.</div>;
  }

  function firstStep() {
    return <div className="space-y-6">
      <div className="grid gap-2 sm:grid-cols-2">{CHOICES.map(item => {
        const Icon = item.icon;
        return <CardButton key={item.type} onClick={() => chooseType(item.type)}><span className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F8ECE8] text-[#7A1D1B]"><Icon className="size-4" /></span><span><span className="block text-sm font-black">{item.title}</span><span className="mt-1 block text-xs text-[#746E69]">{item.help}</span></span></span></CardButton>;
      })}</div>
      {visibleHistory.length > 0 && <section>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#918A84]">Recent change history</p>
        <div className="overflow-hidden rounded-2xl border bg-white">{visibleHistory.slice(0, 5).map(row => <div key={String(row._id)} className="flex items-start justify-between gap-3 border-b p-3 last:border-b-0"><div><p className="text-xs font-black text-[#302923]">{CHOICES.find(item => item.type === row.changeType)?.title || String(row.changeType)}</p><p className="mt-1 text-xs text-[#746E69]">{String(row.reason || "No reason recorded")}</p></div><span className="rounded-full bg-[#F3EFEB] px-2 py-1 text-[9px] font-black uppercase text-[#655E58]">{historyStatus(row)}</span></div>)}</div>
      </section>}
    </div>;
  }

  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#211D1A]/65 sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="live-change-title"><div className="flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[28px] border border-[#E8E0D8] bg-[#FDFAF6] shadow-2xl sm:max-h-[94dvh] sm:rounded-3xl"><header className="border-b border-[#E8E0D8] bg-white p-4 sm:px-6"><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7A1D1B]">Step {step} of 4</p><h2 id="live-change-title" className="mt-1 text-xl font-black text-[#211D1A]">{step === 1 ? "What needs to change?" : step === 2 ? "Which trips should change?" : step === 3 ? choice?.title : "Check the impact"}</h2><p className="mt-1 text-xs text-[#746E69]">One operational decision at a time. Nothing changes before confirmation.</p></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-[#746E69] hover:bg-[#F3EFEB]" aria-label="Close"><X className="size-5" /></button></div><div className="mt-4 grid grid-cols-4 gap-1.5">{[1,2,3,4].map(number => <span key={number} className={`h-1.5 rounded-full ${number <= step ? "bg-[#7A1D1B]" : "bg-[#E7E0DA]"}`} />)}</div></header><main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">{error && <div className="mb-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800"><AlertTriangle className="size-4 shrink-0" />{error}</div>}{loading ? <div className="flex min-h-72 items-center justify-center"><Loader2 className="mr-2 size-5 animate-spin" />Loading live service…</div> : step === 1 ? firstStep() : step === 2 ? <div className="space-y-3"><CardButton selected={scope === "ONE_TRIP"} onClick={() => setScope("ONE_TRIP")}><p className="font-black">This trip only</p><p className="mt-1 text-xs text-[#746E69]">{new Date(trip.tripDate).toLocaleDateString()} · {trip.departureTime}</p></CardButton><CardButton selected={scope === "SELECTED_DATES"} onClick={() => setScope("SELECTED_DATES")}><p className="font-black">Selected dates</p><p className="mt-1 text-xs text-[#746E69]">Choose several specific service dates.</p></CardButton>{scope === "SELECTED_DATES" && <div className="rounded-2xl border bg-white p-4"><div className="flex gap-2"><input type="date" min={today()} value={dateInput} onChange={event => setDateInput(event.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border px-3" /><button type="button" onClick={() => { if (dateInput && !selectedDates.includes(dateInput)) setSelectedDates(current => [...current, dateInput].sort()); setDateInput(""); }} className="rounded-xl bg-[#211D1A] px-4 text-xs font-black text-white">Add</button></div><div className="mt-3 flex flex-wrap gap-2">{selectedDates.map(date => <button type="button" key={date} onClick={() => setSelectedDates(current => current.filter(item => item !== date))} className="rounded-full bg-[#F8ECE8] px-3 py-1 text-xs font-black text-[#7A1D1B]">{date} ×</button>)}</div></div>}<CardButton selected={scope === "ALL_FUTURE"} onClick={() => setScope("ALL_FUTURE")}><p className="font-black">All future trips from a date</p><p className="mt-1 text-xs text-[#746E69]">Past trips stay unchanged.</p></CardButton>{scope === "ALL_FUTURE" && <label className="block rounded-2xl border bg-white p-4 text-sm font-black">Starts on<input type="date" min={today()} value={effectiveFrom} onChange={event => setEffectiveFrom(event.target.value)} className="mt-2 h-11 w-full rounded-xl border px-3" /></label>}</div> : step === 3 ? <div className="space-y-5">{editor()}<label className="block text-sm font-black">Why is this changing?<textarea rows={3} maxLength={500} value={reason} onChange={event => setReason(event.target.value)} placeholder="Example: road closure near Sindhuli" className="mt-2 w-full resize-none rounded-xl border bg-white p-3 font-medium" /></label><p className="text-xs text-[#746E69]">This reason is saved in the audit history.</p></div> : preview && <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border bg-white p-4"><p className="text-[10px] font-black uppercase tracking-wider text-[#918A84]">Current</p><p className="mt-2 text-sm font-black">{readValue(preview.changeType, preview.impact.currentValues)}</p></div><div className="rounded-2xl border border-[#D9B9B5] bg-[#FFF8F6] p-4"><p className="text-[10px] font-black uppercase tracking-wider text-[#7A1D1B]">After change</p><p className="mt-2 text-sm font-black text-[#7A1D1B]">{readValue(preview.changeType, preview.impact.requestedValues)}</p></div></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Trips", preview.impact.affectedTrips.count], ["Bookings", preview.impact.bookings.count], ["Passengers", preview.impact.bookings.passengerCount], ["Active holds", preview.impact.activeHolds]].map(([label, count]) => <div key={String(label)} className="rounded-2xl border bg-white p-4"><p className="text-2xl font-black">{count}</p><p className="mt-1 text-[10px] font-black uppercase tracking-wider text-[#918A84]">{label}</p></div>)}</div><PassengerProtectionSummary preview={preview} confirmed={confirmResolution} onConfirm={setConfirmResolution} />{preview.impact.notifications.required && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="font-black text-amber-900">Passengers must be notified</p><p className="mt-1 text-xs text-amber-800">{preview.impact.notifications.bookingCount} booking(s) will receive a service-change notice.</p></div>}{preview.impact.protectedConflicts.map(item => <div key={item.code} className="rounded-2xl border border-red-200 bg-red-50 p-4"><p className="font-black text-red-800">Cannot apply yet</p><p className="mt-1 text-xs text-red-700">{item.message} ({item.count})</p></div>)}</div>}</main><footer className="flex gap-3 border-t border-[#E8E0D8] bg-white p-4 sm:px-6"><button type="button" disabled={busy} onClick={step === 1 ? onClose : () => { setError(""); setStep(current => current - 1); }} className="inline-flex h-11 items-center rounded-xl border px-4 text-sm font-black"><ArrowLeft className="mr-2 size-4" />{step === 1 ? "Cancel" : "Back"}</button>{step < 4 ? <button type="button" disabled={(step === 1 && !type) || (step === 2 && !scopeValid) || (step === 3 && (!valuesValid || reason.trim().length < 5)) || busy} onClick={step === 3 ? () => void review() : () => setStep(current => current + 1)} className="ml-auto inline-flex h-11 items-center rounded-xl bg-[#7A1D1B] px-5 text-sm font-black text-white disabled:bg-[#D8D0C9]">{busy && <Loader2 className="mr-2 size-4 animate-spin" />}{step === 3 ? "Preview impact" : "Continue"}<ArrowRight className="ml-2 size-4" /></button> : <button type="button" disabled={busy || !preview?.impact.canApply || Boolean(preview?.impact.passengerResolution.required && !confirmResolution)} onClick={() => void apply()} className="ml-auto inline-flex h-11 items-center rounded-xl bg-[#7A1D1B] px-5 text-sm font-black text-white disabled:bg-[#D8D0C9]">{busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}Confirm change</button>}</footer></div></div>;
}

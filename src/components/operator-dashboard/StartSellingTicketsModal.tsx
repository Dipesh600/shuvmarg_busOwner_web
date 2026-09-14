"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Info,
  LoaderCircle,
  Radio,
  Route,
  Sparkles,
  UserCheck,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { OperatorFleetSetupStatus } from "@/features/operator-dashboard/operator-dashboard-contract";
import {
  PublicationError,
  persistentPublicationRequestId,
  publishFleetSchedulePlan,
} from "@/features/operator-dashboard/schedule-plan-api";
import { getFleetAssignment } from "@/features/seat-layout-v3/api";
import type { LayoutElement, SeatLayoutV3 } from "@/features/seat-layout-v3/types";

interface Props {
  fleetId: string;
  busName: string;
  busNumber: string;
  setup: OperatorFleetSetupStatus;
  onClose: () => void;
  onPublished: () => void;
}

type ModalStep = "readiness" | "seats" | "pricing" | "review";

const EMPTY_PUBLICATION = {
  state: "DRAFT" as const,
  requestId: null,
  fingerprint: null,
  lastError: null,
  updatedAt: null,
  configuration: null,
};

function nameOf(value: unknown) {
  return value && typeof value === "object" && "fullName" in value && typeof value.fullName === "string"
    ? value.fullName : "Not selected";
}

function timeOf(value?: string) {
  if (!value) return "—";
  const [hour, minute] = value.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

export default function StartSellingTicketsModal({
  fleetId,
  busName,
  busNumber,
  setup,
  onClose,
  onPublished,
}: Props) {
  const setupPublication = setup.publication || EMPTY_PUBLICATION;
  const [step, setStep] = useState<ModalStep>("readiness");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [publication, setPublication] = useState(setupPublication);
  const [publicationRequestId] = useState(() =>
    persistentPublicationRequestId(fleetId, setupPublication.requestId)
  );

  // Layout and Seat Selection State
  const [layoutLoading, setLayoutLoading] = useState(true);
  const [layout, setLayout] = useState<SeatLayoutV3 | null>(null);
  const [availableIds, setAvailableIds] = useState<Set<string>>(new Set());

  // Pricing State
  const initialBaseFare = setupPublication.configuration?.pricing.defaultFare
    || setup.outboundScheduleData?.fareOverride
    || 1150;
  const [baseFare, setBaseFare] = useState<number>(initialBaseFare);
  const [seatOverrides, setSeatOverrides] = useState<Map<string, number>>(
    () => new Map(
      setupPublication.configuration?.pricing.overrides
        .map(item => [item.elementId, item.fare] as const) || []
    )
  );
  const [selectedForOverride, setSelectedForOverride] = useState<Set<string>>(new Set());
  const [customFareInput, setCustomFareInput] = useState<string>("");

  const route = setup.assignedRoute?.label
    || [setup.assignedRoute?.origin, setup.assignedRoute?.destination].filter(Boolean).join(" → ")
    || "Route not ready";
  const schedule = setup.outboundScheduleData;
  const returning = setup.returnScheduleData;
  const hasPairedJourney = Boolean(
    setup.steps.scheduleCreated
    && setup.returnScheduleId
    && returning?.departureTime
  );

  const readinessRows = [
    { icon: Route, label: "Route", value: route, ready: Boolean(setup.steps.routeConfigured) },
    {
      icon: CalendarDays,
      label: "Journey",
      value: `${timeOf(schedule?.departureTime)} → ${timeOf(schedule?.arrivalTime)}${hasPairedJourney ? ` · return ${timeOf(returning?.departureTime)}` : " · return missing"}`,
      ready: hasPairedJourney,
    },
    { icon: UserCheck, label: "Driver", value: nameOf(setup.assignedDriver), ready: Boolean(setup.steps.driverAssigned) },
    { icon: UsersRound, label: "Conductor", value: nameOf(setup.assignedConductor), ready: Boolean(setup.steps.conductorAssigned) },
  ];
  const readinessComplete = readinessRows.every((row) => row.ready);

  // Fetch Bus Seat Layout on Mount
  useEffect(() => {
    let active = true;
    async function fetchLayout() {
      setLayoutLoading(true);
      try {
        const response = await getFleetAssignment(fleetId);
        if (!active) return;
        const rev = response.assignment?.activeRevision;
        if (rev?.layout) {
          setLayout(rev.layout);
          const passengerElements = rev.layout.sections.flatMap((s) => s.elements)
            .filter((e) => e.kind === "SEAT" || e.kind === "BERTH");
          const savedAvailable = setupPublication.configuration?.availableElementIds;
          setAvailableIds(new Set(
            savedAvailable?.length
              ? savedAvailable
              : passengerElements.map((e) => e.elementId)
          ));
        }
      } catch (err) {
        console.warn("Could not load seat layout for start selling modal:", err);
      } finally {
        if (active) setLayoutLoading(false);
      }
    }
    void fetchLayout();
    return () => {
      active = false;
    };
  }, [fleetId, setupPublication.configuration]);

  const restoreSavedPublication = () => {
    const saved = publication.configuration;
    if (!saved) return;
    setAvailableIds(new Set(saved.availableElementIds));
    setBaseFare(saved.pricing.defaultFare);
    setSeatOverrides(new Map(saved.pricing.overrides.map(item => [item.elementId, item.fare])));
    setSelectedForOverride(new Set());
    setCustomFareInput("");
    setError("");
    setStep("review");
  };

  // Extract all reservable places in the bus
  const allPassengerPlaces: LayoutElement[] = useMemo(() => {
    if (!layout?.sections) return [];
    return layout.sections.flatMap((s) => s.elements)
      .filter((e) => e.kind === "SEAT" || e.kind === "BERTH");
  }, [layout]);

  // Filter places that are marked available
  const availablePlaces = useMemo(() => {
    return allPassengerPlaces.filter((p) => availableIds.has(p.elementId));
  }, [allPassengerPlaces, availableIds]);

  const matchesSavedPublication = useMemo(() => {
    const saved = publication.configuration;
    if (!saved) return true;
    const currentAvailable = [...availableIds].sort();
    const savedAvailable = [...saved.availableElementIds].sort();
    const currentOverrides = [...seatOverrides.entries()]
      .map(([elementId, fare]) => ({ elementId, fare }))
      .sort((left, right) => left.elementId.localeCompare(right.elementId));
    const savedOverrides = [...saved.pricing.overrides]
      .sort((left, right) => left.elementId.localeCompare(right.elementId));
    return baseFare === saved.pricing.defaultFare
      && JSON.stringify(currentAvailable) === JSON.stringify(savedAvailable)
      && JSON.stringify(currentOverrides) === JSON.stringify(savedOverrides);
  }, [availableIds, baseFare, publication.configuration, seatOverrides]);

  // Toggle seat availability
  const toggleSeatAvailability = (elementId: string) => {
    setAvailableIds((current) => {
      const next = new Set(current);
      if (next.has(elementId)) {
        next.delete(elementId);
        // Also remove override if seat becomes unavailable
        setSeatOverrides((prev) => {
          const updated = new Map(prev);
          updated.delete(elementId);
          return updated;
        });
      } else {
        next.add(elementId);
      }
      return next;
    });
  };

  const selectAllSeats = () => {
    setAvailableIds(new Set(allPassengerPlaces.map((p) => p.elementId)));
  };

  const deselectAllSeats = () => {
    setAvailableIds(new Set());
    setSeatOverrides(new Map());
  };

  // Pricing handlers
  const applyCustomOverride = () => {
    const parsed = Number(customFareInput);
    if (!parsed || parsed <= 0 || selectedForOverride.size === 0) return;
    setSeatOverrides((current) => {
      const next = new Map(current);
      for (const id of selectedForOverride) {
        next.set(id, parsed);
      }
      return next;
    });
    setSelectedForOverride(new Set());
    setCustomFareInput("");
  };

  const toggleSelectForOverride = (elementId: string) => {
    setSelectedForOverride((current) => {
      const next = new Set(current);
      if (next.has(elementId)) next.delete(elementId);
      else next.add(elementId);
      return next;
    });
  };

  const getSeatFare = (elementId: string) => {
    return seatOverrides.get(elementId) ?? baseFare;
  };

  // Publish Action
  const publish = async () => {
    if (!readinessComplete || availableIds.size === 0 || baseFare <= 0) return;
    setBusy(true);
    setError("");
    try {
      const overridesArray = Array.from(seatOverrides.entries()).map(([elementId, fare]) => ({
        elementId,
        fare,
      }));

      await publishFleetSchedulePlan(fleetId, setup.scheduleId, {
        requestId: publicationRequestId,
        availableElementIds: Array.from(availableIds),
        pricing: {
          defaultFare: baseFare,
          overrides: overridesArray,
        },
      });
      onPublished();
    } catch (failure) {
      if (failure instanceof PublicationError && failure.publication) {
        setPublication(failure.publication);
        persistentPublicationRequestId(fleetId, failure.publication.requestId);
      }
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Step Validation Checkers
  const canGoToSeats = readinessComplete;
  const canGoToPricing = availableIds.size > 0;
  const canGoToReview = baseFare > 0 && availableIds.size > 0;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[#211D1A]/65 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-title"
    >
      <div className="flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border border-[#E8E0D8] bg-[#FDFAF6] shadow-[0_24px_70px_rgba(42,31,25,0.22)] sm:max-h-[92vh] sm:rounded-3xl">
        {/* Header */}
        <header className="border-b border-[#E8E0D8] bg-white px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F8ECE8] text-[#7A1D1B]">
                <Radio className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-black uppercase tracking-[0.14em] text-[#7A1D1B]">
                  {busName} · {busNumber}
                </p>
                <h2 id="publish-title" className="mt-1 text-lg font-bold text-[#211D1A] sm:text-xl">
                  Open ticket sales?
                </h2>
                <p className="mt-0.5 text-xs text-[#746E69]">
                  Configure seat availability, fares, and open bookings for passengers.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="shrink-0 rounded-xl p-2 text-[#746E69] hover:bg-[#F3EFEB]"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Stepper Navigation */}
          <div className="mt-4 flex items-center gap-1.5 border-t border-[#F0EBE6] pt-3 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setStep("readiness")}
              className={`rounded-lg px-2.5 py-1 transition ${
                step === "readiness"
                  ? "bg-[#7A1D1B] text-white"
                  : "text-[#746E69] hover:bg-[#F3EFEB]"
              }`}
            >
              1. Readiness
            </button>
            <span className="text-[#C9BDB4]">/</span>
            <button
              type="button"
              disabled={!canGoToSeats}
              onClick={() => setStep("seats")}
              className={`rounded-lg px-2.5 py-1 transition disabled:opacity-40 ${
                step === "seats"
                  ? "bg-[#7A1D1B] text-white"
                  : "text-[#746E69] hover:bg-[#F3EFEB]"
              }`}
            >
              2. Available Seats ({availableIds.size})
            </button>
            <span className="text-[#C9BDB4]">/</span>
            <button
              type="button"
              disabled={!canGoToPricing}
              onClick={() => setStep("pricing")}
              className={`rounded-lg px-2.5 py-1 transition disabled:opacity-40 ${
                step === "pricing"
                  ? "bg-[#7A1D1B] text-white"
                  : "text-[#746E69] hover:bg-[#F3EFEB]"
              }`}
            >
              3. Fares & Pricing
            </button>
            <span className="text-[#C9BDB4]">/</span>
            <button
              type="button"
              disabled={!canGoToReview}
              onClick={() => setStep("review")}
              className={`rounded-lg px-2.5 py-1 transition disabled:opacity-40 ${
                step === "review"
                  ? "bg-[#7A1D1B] text-white"
                  : "text-[#746E69] hover:bg-[#F3EFEB]"
              }`}
            >
              4. Review
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {publication.state !== "DRAFT" && publication.state !== "ACTIVE" && (
            <div className="mb-4 rounded-xl border border-[#D9C8BC] bg-[#FFF9F5] p-3.5">
              <div className="flex items-start gap-2.5">
                {publication.state === "PREPARING"
                  ? <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin text-[#7A1D1B]" />
                  : <AlertCircle className="mt-0.5 size-4 shrink-0 text-[#9A3A32]" />}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-[#302923]">
                    {publication.state === "PREPARING"
                      ? "Ticket sales are being prepared"
                      : publication.state === "FAILED"
                        ? "The last publication did not finish"
                        : "The submitted settings need review"}
                  </p>
                  <p className="mt-1 text-xs text-[#655E58]">
                    {publication.state === "PREPARING"
                      ? "The backend is preparing trips. Do not change the seats or fares while this finishes."
                      : "Nothing from this attempt is live. You can safely retry the settings saved by the backend."}
                  </p>
                  {publication.configuration && publication.state !== "PREPARING" && (
                    <button
                      type="button"
                      onClick={restoreSavedPublication}
                      className="mt-2 rounded-lg border border-[#7A1D1B]/30 bg-white px-3 py-1.5 text-[11px] font-black text-[#7A1D1B]"
                    >
                      Use saved seats and fares
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-700"
            >
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: READINESS CHECK */}
          {step === "readiness" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#E8E1DB] bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#918A84]">
                  Pre-Flight Checklist
                </p>
                <p className="mt-1 text-sm font-black text-[#211D1A]">
                  Verify that the vehicle has an approved route, schedule, and operating crew.
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-[#E8E1DB] bg-white">
                {readinessRows.map((row, index) => {
                  const Icon = row.icon;
                  return (
                    <div
                      key={row.label}
                      className={`flex items-center gap-3 p-4 ${
                        index ? "border-t border-[#EEE8E2]" : ""
                      }`}
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF3F0] text-[#7A1D1B]">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#918A84]">
                          {row.label}
                        </p>
                        <p className="mt-0.5 truncate text-xs font-black text-[#342E2A]" title={row.value}>
                          {row.value}
                        </p>
                      </div>
                      <span
                        className={`flex size-5 items-center justify-center rounded-full ${
                          row.ready ? "bg-[#7A1D1B] text-white" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {row.ready ? <Check className="size-3" /> : "!"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {readinessComplete ? (
                <div className="flex gap-3 rounded-2xl border-l-4 border-[#7A1D1B] bg-emerald-50/60 p-4">
                  <BadgeCheck className="mt-0.5 size-5 shrink-0 text-[#7A1D1B]" />
                  <div>
                    <p className="text-xs font-black text-[#211D1A]">Operational Setup Ready</p>
                    <p className="mt-0.5 text-xs text-[#514A45]">
                      All prerequisites are verified. Continue to choose which seats are open to sell and assign fares.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 rounded-2xl border-l-4 border-amber-500 bg-amber-50 p-4">
                  <Info className="mt-0.5 size-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-xs font-black text-[#211D1A]">Missing Setup Items</p>
                    <p className="mt-0.5 text-xs text-[#514A45]">
                      Please complete missing items marked above before opening ticket sales.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: AVAILABLE SEATS SELECTION */}
          {step === "seats" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E8E1DB] bg-white p-4">
                <div>
                  <h3 className="text-sm font-black text-[#211D1A]">Select Seats Available to Sell</h3>
                  <p className="mt-0.5 text-xs text-[#746E69]">
                    Click seats to toggle availability. Unselected seats remain blocked for counter/offline use.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllSeats}
                    className="rounded-xl border border-[#DCD4CD] bg-white px-3 py-1.5 text-xs font-bold text-[#514A45] hover:bg-[#F3EFEB]"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllSeats}
                    className="rounded-xl border border-[#DCD4CD] bg-white px-3 py-1.5 text-xs font-bold text-[#514A45] hover:bg-[#F3EFEB]"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Live Count Badge */}
              <div className="flex items-center justify-between rounded-xl bg-[#F8ECE8] px-4 py-2.5 text-xs font-black text-[#7A1D1B]">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4" />
                  {availableIds.size} of {allPassengerPlaces.length} seats marked available to sell
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A2622]">
                  {allPassengerPlaces.length - availableIds.size} Blocked
                </span>
              </div>

              {/* Interactive Cabin Layout */}
              {layoutLoading ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#DCD4CD] bg-white p-12 text-center">
                  <LoaderCircle className="size-6 animate-spin text-[#7A1D1B]" />
                  <p className="mt-3 text-xs font-bold text-[#746E69]">Loading bus cabin layout…</p>
                </div>
              ) : allPassengerPlaces.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-red-300 bg-red-50 p-6 text-center text-xs font-bold text-red-700">
                  No seats found for this vehicle. Please assign an approved seat layout first.
                </div>
              ) : (
                <div className="rounded-2xl border border-[#E8E1DB] bg-white p-4 sm:p-6">
                  {/* Front Driver & Door indicator */}
                  <div className="mb-4 flex items-center justify-between border-b border-[#F0EBE6] pb-3 text-[10px] font-black uppercase tracking-wider text-[#918A84]">
                    <span>Entrance / Door</span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block size-2 rounded-full bg-[#7A1D1B]" />
                      Front Driver Cabin
                    </span>
                  </div>

                  {/* Grid of Seats */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                    {allPassengerPlaces.map((place) => {
                      const isAvailable = availableIds.has(place.elementId);
                      return (
                        <button
                          key={place.elementId}
                          type="button"
                          onClick={() => toggleSeatAvailability(place.elementId)}
                          className={`flex flex-col items-center justify-between rounded-xl border p-2.5 transition ${
                            isAvailable
                              ? "border-[#B66B63] bg-[#F8ECE8] shadow-sm text-[#7A1D1B]"
                              : "border-dashed border-[#D8D0C9] bg-[#FAF8F5] text-[#918A84] hover:border-[#B7AEA7]"
                          }`}
                        >
                          <div className="flex w-full items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-wider">
                              {place.kind === "BERTH" ? "Berth" : "Seat"}
                            </span>
                            <span
                              className={`flex size-4 items-center justify-center rounded-full text-[9px] ${
                                isAvailable ? "bg-[#7A1D1B] text-white" : "bg-neutral-200 text-neutral-500"
                              }`}
                            >
                              {isAvailable ? <Check className="size-2.5" /> : "×"}
                            </span>
                          </div>
                          <p className="my-1.5 text-base font-black tracking-tight">{place.label}</p>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                              isAvailable ? "bg-white text-[#7A1D1B]" : "bg-neutral-200/60 text-neutral-500"
                            }`}
                          >
                            {isAvailable ? "Available" : "Blocked"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: PRICING & FARES */}
          {step === "pricing" && (
            <div className="space-y-4">
              {/* Base Fare Controller */}
              <div className="rounded-2xl border border-[#E8E1DB] bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-[#211D1A]">Base Fare for All Available Seats</h3>
                    <p className="mt-0.5 text-xs text-[#746E69]">
                      Standard default fare applied to all open passenger seats.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-xl border border-[#DCD4CD] bg-[#FAF8F5] px-3 py-1.5 text-xs font-bold">
                      <span className="mr-1 text-[#746E69]">Rs.</span>
                      <input
                        type="number"
                        min="1"
                        value={baseFare || ""}
                        onChange={(e) => setBaseFare(Math.max(0, Number(e.target.value)))}
                        className="w-20 bg-transparent text-sm font-black text-[#211D1A] outline-none"
                        aria-label="Base fare"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seat-Specific Fare Overrides */}
              <div className="rounded-2xl border border-[#E8E1DB] bg-white p-4 sm:p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#F0EBE6] pb-3">
                  <div>
                    <p className="text-xs font-black text-[#211D1A]">Available Seats Pricing Preview</p>
                    <p className="text-[11px] text-[#746E69]">
                      Select individual seats below to apply custom premium fares (e.g. VIP front seats).
                    </p>
                  </div>
                  {selectedForOverride.size > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-xl border border-[#B66B63] bg-[#F8ECE8] px-2.5 py-1 text-xs">
                        <span className="mr-1 font-bold text-[#7A1D1B]">Rs.</span>
                        <input
                          type="number"
                          placeholder="Fare"
                          value={customFareInput}
                          onChange={(e) => setCustomFareInput(e.target.value)}
                          className="w-16 bg-transparent text-xs font-black text-[#7A1D1B] outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={applyCustomOverride}
                        className="rounded-xl bg-[#7A1D1B] px-3 py-1 text-xs font-bold text-white hover:bg-[#5C1414]"
                      >
                        Set ({selectedForOverride.size})
                      </button>
                    </div>
                  )}
                </div>

                {/* Grid of Available Seats with Prices */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                  {availablePlaces.map((place) => {
                    const isSelected = selectedForOverride.has(place.elementId);
                    const currentFare = getSeatFare(place.elementId);
                    const isOverridden = seatOverrides.has(place.elementId);
                    return (
                      <button
                        key={place.elementId}
                        type="button"
                        onClick={() => toggleSelectForOverride(place.elementId)}
                        className={`flex flex-col items-center justify-between rounded-xl border p-2.5 transition ${
                          isSelected
                            ? "border-[#7A1D1B] bg-[#F8ECE8] ring-2 ring-[#7A1D1B]/20"
                            : "border-[#E4DDD6] bg-[#FAF8F5] hover:border-[#B66B63]"
                        }`}
                      >
                        <span className="text-[9px] font-black uppercase text-[#918A84]">{place.label}</span>
                        <p className="my-1 text-xs font-black text-[#211D1A]">
                          Rs. {currentFare.toLocaleString()}
                        </p>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${
                            isOverridden
                              ? "bg-amber-100 text-amber-800"
                              : "bg-neutral-200/60 text-neutral-600"
                          }`}
                        >
                          {isOverridden ? "Override" : "Standard"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & CONFIRM */}
          {step === "review" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#E8E1DB] bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#918A84]">Ready to Launch</p>
                <h3 className="mt-1 text-base font-black text-[#211D1A]">
                  Review Ticket Sales Configuration
                </h3>
                <p className="mt-0.5 text-xs text-[#746E69]">
                  Passengers can search, select open seats, and book tickets immediately after continuing.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#E8E1DB] bg-white p-4">
                  <p className="text-[9px] font-black uppercase tracking-wider text-[#918A84]">Corridor & Times</p>
                  <p className="mt-1 font-black text-sm text-[#211D1A]">{route}</p>
                  <p className="mt-0.5 text-xs font-bold text-[#7A1D1B]">
                    {timeOf(schedule?.departureTime)} → {timeOf(schedule?.arrivalTime)}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#E8E1DB] bg-white p-4">
                  <p className="text-[9px] font-black uppercase tracking-wider text-[#918A84]">Assigned Crew</p>
                  <p className="mt-1 text-xs font-black text-[#211D1A]">Driver: {nameOf(setup.assignedDriver)}</p>
                  <p className="mt-0.5 text-xs font-black text-[#211D1A]">
                    Conductor: {nameOf(setup.assignedConductor)}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#E8E1DB] bg-white p-4">
                  <p className="text-[9px] font-black uppercase tracking-wider text-[#918A84]">Available Inventory</p>
                  <p className="mt-1 text-lg font-black text-[#7A1D1B]">{availableIds.size} Seats</p>
                  <p className="mt-0.5 text-[11px] text-[#746E69]">
                    {allPassengerPlaces.length - availableIds.size} blocked from online sales
                  </p>
                </div>

                <div className="rounded-2xl border border-[#E8E1DB] bg-white p-4">
                  <p className="text-[9px] font-black uppercase tracking-wider text-[#918A84]">Fare Configuration</p>
                  <p className="mt-1 text-lg font-black text-[#211D1A]">Rs. {baseFare.toLocaleString()}</p>
                  <p className="mt-0.5 text-[11px] text-[#746E69]">
                    {seatOverrides.size > 0 ? `${seatOverrides.size} custom seat override(s)` : "Uniform pricing"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 rounded-2xl border-l-4 border-[#7A1D1B] bg-white p-4 shadow-sm">
                <Sparkles className="mt-0.5 size-5 shrink-0 text-[#7A1D1B]" />
                <div>
                  <p className="text-xs font-black text-[#211D1A]">Master Blueprint Preserved</p>
                  <p className="mt-0.5 text-xs text-[#746E69]">
                    The bus&apos;s physical seat layout build remains unchanged as the fleet master reference.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <footer className="grid grid-cols-2 gap-3 border-t border-[#E8E1DB] bg-white px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex sm:items-center sm:px-6">
          {step === "readiness" ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={onClose}
                className="w-full rounded-xl border border-[#DED7D1] px-3 py-2.5 text-xs font-black text-[#514A45] sm:w-auto sm:px-4 hover:bg-[#FAF8F5]"
              >
                Not yet
              </button>
              <button
                type="button"
                disabled={!canGoToSeats}
                onClick={() => setStep("seats")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] px-3 py-3 text-xs font-black text-white disabled:bg-[#D8D0C9] sm:ml-auto sm:w-auto sm:px-5 hover:bg-[#5C1414]"
              >
                Configure Seats <ArrowRight className="size-4" />
              </button>
            </>
          ) : step === "seats" ? (
            <>
              <button
                type="button"
                onClick={() => setStep("readiness")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#DED7D1] px-3 py-2.5 text-xs font-black text-[#514A45] hover:bg-[#FAF8F5]"
              >
                <ArrowLeft className="size-4" /> Back
              </button>
              <button
                type="button"
                disabled={!canGoToPricing}
                onClick={() => setStep("pricing")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] px-3 py-3 text-xs font-black text-white disabled:bg-[#D8D0C9] sm:ml-auto sm:w-auto sm:px-5 hover:bg-[#5C1414]"
              >
                Set Fares ({availableIds.size} seats) <ArrowRight className="size-4" />
              </button>
            </>
          ) : step === "pricing" ? (
            <>
              <button
                type="button"
                onClick={() => setStep("seats")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#DED7D1] px-3 py-2.5 text-xs font-black text-[#514A45] hover:bg-[#FAF8F5]"
              >
                <ArrowLeft className="size-4" /> Back
              </button>
              <button
                type="button"
                disabled={!canGoToReview}
                onClick={() => setStep("review")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] px-3 py-3 text-xs font-black text-white disabled:bg-[#D8D0C9] sm:ml-auto sm:w-auto sm:px-5 hover:bg-[#5C1414]"
              >
                Review Summary <ArrowRight className="size-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => setStep("pricing")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#DED7D1] px-3 py-2.5 text-xs font-black text-[#514A45] hover:bg-[#FAF8F5]"
              >
                <ArrowLeft className="size-4" /> Back
              </button>
              <button
                type="button"
                disabled={busy
                  || publication.state === "PREPARING"
                  || ((publication.state === "FAILED" || publication.state === "REQUIRES_ATTENTION")
                    && !matchesSavedPublication)
                  || !readinessComplete
                  || availableIds.size === 0
                  || baseFare <= 0}
                onClick={() => void publish()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] px-3 py-3 text-xs font-black text-white disabled:bg-[#D8D0C9] sm:ml-auto sm:w-auto sm:px-5 hover:bg-[#5C1414]"
              >
                {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Radio className="size-4" />}
                {(publication.state === "FAILED" || publication.state === "REQUIRES_ATTENTION")
                  && !matchesSavedPublication
                  ? "Restore saved settings first"
                  : publication.state === "FAILED" || publication.state === "REQUIRES_ATTENTION"
                    ? "Retry saved publication"
                    : "Start selling tickets"}
              </button>
            </>
          )}
        </footer>
      </div>

    </div>
  );
}

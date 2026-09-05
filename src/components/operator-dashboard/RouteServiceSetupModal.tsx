"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Coffee,
  Loader2,
  MapPin,
  Route,
  ShieldCheck,
  X,
} from "lucide-react";
import { ApiResponseError } from "@/lib/api-error";
import type {
  OperatorFleetListItem,
  OperatorFleetSetupStatus,
} from "@/features/operator-dashboard/operator-dashboard-contract";
import {
  getAvailableOperatorVariants,
  getBoardingPointId,
  getOperatorRouteConfigs,
  getRouteVariantId,
  getVariantCorridorId,
  getVariantStopsWithConfig,
  saveOperatorRouteConfig,
  updateOperatorRouteConfig,
  type AvailableOperatorVariant,
  type OperatorRouteConfig,
  type OperatorRouteStop,
  type OperatorRouteTiming,
  type OperatorStopBehavior,
} from "@/features/operator-dashboard/route-configuration-api";
import {
  buildInitialTiming,
  calculateDeparture,
  calculateDurationMinutes,
  formatDuration,
  getInitialActiveStopIds,
} from "@/features/operator-dashboard/route-timing-helpers";

interface RouteServiceSetupModalProps {
  fleet: OperatorFleetListItem;
  setup: OperatorFleetSetupStatus;
  onClose: () => void;
  onSaved: () => void;
}

const STOP_BEHAVIOR_LABELS: Record<OperatorStopBehavior, string> = {
  BOTH: "Boarding & Dropping (Both)",
  BOARDING_ONLY: "Boarding Only (Pickup)",
  DROPPING_ONLY: "Dropping Only",
  REST_STOP: "Rest Stop (Meal/Tea Break)",
};

const SERVICE_TYPE_OPTIONS = [
  "Standard",
  "Deluxe",
  "Express",
  "Night Bus",
  "Local / All-stop",
] as const;

type ServiceType = (typeof SERVICE_TYPE_OPTIONS)[number];

const HALT_DURATION_OPTIONS = [
  { value: 0, label: "No halt (0 min)" },
  { value: 5, label: "5 mins" },
  { value: 10, label: "10 mins" },
  { value: 15, label: "15 mins" },
  { value: 30, label: "30 mins (Meal break)" },
  { value: 45, label: "45 mins" },
  { value: 60, label: "1 Hour" },
] as const;

type EmptyRouteState = {
  title: string;
  body: string;
};

function displayError(error: unknown, fallback: string): string {
  if (error instanceof ApiResponseError) return error.message || fallback;
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

function routeLabel(variant: AvailableOperatorVariant): string {
  const origin = variant.corridorId?.originId?.name || "Origin";
  const destination = variant.corridorId?.destinationId?.name || "Destination";
  return `${origin} → ${destination}`;
}

function getStopId(stop: OperatorRouteStop): string {
  return stop.stopId._id;
}

function getStopName(stop?: OperatorRouteStop | null): string {
  return stop?.stopId.name || "this stop";
}

function normalizeServiceType(value?: string | null): ServiceType {
  return SERVICE_TYPE_OPTIONS.includes(value as ServiceType) ? (value as ServiceType) : "Standard";
}

function findPreferredConfig(
  configs: OperatorRouteConfig[],
  variantId: string,
): OperatorRouteConfig | null {
  const matching = configs.filter((config) => getRouteVariantId(config) === variantId);
  return (
    matching.find((config) => config.status === "ACTIVE") ||
    matching.find((config) => config.status === "DRAFT") ||
    matching[0] ||
    null
  );
}

function getEmptyRouteState({
  brandId,
  hasVariants,
  assignedRouteLabel,
}: {
  brandId: string | null;
  hasVariants: boolean;
  assignedRouteLabel?: string | null;
}): EmptyRouteState {
  if (!brandId) {
    return {
      title: "Unable to load bus details",
      body: "Could not load route settings. Please refresh or contact Shuvmarg support if this persists.",
    };
  }
  if (!hasVariants) {
    return {
      title: "Route path not ready yet",
      body: assignedRouteLabel
        ? `${assignedRouteLabel} is approved, but the stops list is being finalized.`
        : "This route is approved, but the stops list is being finalized.",
    };
  }
  return {
    title: "Stops not configured yet",
    body: "The route exists, but the list of stops has not been assigned yet.",
  };
}

/**
 * Shuvmarg Design System Custom Time Picker
 * Uses 3 clean segmented dropdowns for Hour, Minute, and AM/PM matching the design constitution.
 */
function ShuvmargTimePicker({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const match = value?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  const h = match ? match[1].padStart(2, "0") : "";
  const m = match ? match[2] : "";
  const a = match ? match[3].toUpperCase() : "";

  const handleUpdate = (part: "h" | "m" | "a", val: string) => {
    const nextH = part === "h" ? val : h || "07";
    const nextM = part === "m" ? val : m || "00";
    const nextA = part === "a" ? val : a || "AM";
    if (!nextH || !nextM || !nextA) return;
    onChange(`${nextH}:${nextM} ${nextA}`);
  };

  return (
    <div className="flex items-center gap-1 w-full">
      {/* Hour */}
      <div className="relative flex-1 min-w-0">
        <select
          value={h}
          onChange={(e) => handleUpdate("h", e.target.value)}
          disabled={disabled}
          className="h-10 w-full appearance-none rounded-xl border border-[#D9D0C7] bg-[#FAFAF8] pl-2 pr-6 text-center font-mono text-xs font-bold text-[#111111] outline-none transition hover:border-[#B5AAA0] focus:border-[#7A1D1B] focus:bg-white focus:ring-1 focus:ring-[#7A1D1B] disabled:opacity-50"
        >
          <option value="">HH</option>
          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((str) => (
            <option key={str} value={str}>
              {str}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 size-3 text-[#888888]" />
      </div>

      <span className="font-mono text-xs font-bold text-[#888888] select-none shrink-0">:</span>

      {/* Minute */}
      <div className="relative flex-1 min-w-0">
        <select
          value={m}
          onChange={(e) => handleUpdate("m", e.target.value)}
          disabled={disabled}
          className="h-10 w-full appearance-none rounded-xl border border-[#D9D0C7] bg-[#FAFAF8] pl-2 pr-6 text-center font-mono text-xs font-bold text-[#111111] outline-none transition hover:border-[#B5AAA0] focus:border-[#7A1D1B] focus:bg-white focus:ring-1 focus:ring-[#7A1D1B] disabled:opacity-50"
        >
          <option value="">MM</option>
          {Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0")).map((str) => (
            <option key={str} value={str}>
              {str}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 size-3 text-[#888888]" />
      </div>

      {/* AM/PM */}
      <div className="relative w-[68px] shrink-0">
        <select
          value={a}
          onChange={(e) => handleUpdate("a", e.target.value)}
          disabled={disabled}
          className="h-10 w-full appearance-none rounded-xl border border-[#D9D0C7] bg-[#FAFAF8] pl-2 pr-6 text-center text-xs font-bold text-[#7A1D1B] outline-none transition hover:border-[#B5AAA0] focus:border-[#7A1D1B] focus:bg-white focus:ring-1 focus:ring-[#7A1D1B] disabled:opacity-50"
        >
          <option value="">--</option>
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 size-3 text-[#888888]" />
      </div>
    </div>
  );
}

export default function RouteServiceSetupModal({
  fleet,
  setup,
  onClose,
  onSaved,
}: RouteServiceSetupModalProps) {
  const brandId = fleet.brandId || setup.brandId || null;
  const fleetId = fleet.fleetId;
  const preferredCorridorId = setup.assignedRoute?.corridorId || null;

  const [variants, setVariants] = useState<AvailableOperatorVariant[]>([]);
  const [configs, setConfigs] = useState<OperatorRouteConfig[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [patternName, setPatternName] = useState<string>("Standard");
  const [configId, setConfigId] = useState<string | null>(null);
  const [stops, setStops] = useState<OperatorRouteStop[]>([]);
  const [activeStops, setActiveStops] = useState<string[]>([]);
  const [timingConfig, setTimingConfig] = useState<OperatorRouteTiming[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStops, setLoadingStops] = useState(false);
  const [savingMode, setSavingMode] = useState<"draft" | "complete" | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveState, setAutoSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!brandId) {
        setLoading(false);
        setError("Unable to load bus setup. Please refresh or contact Shuvmarg support.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [variantItems, configItems] = await Promise.all([
          getAvailableOperatorVariants(brandId, fleetId),
          getOperatorRouteConfigs(brandId, fleetId),
        ]);
        if (!alive) return;
        const scopedVariants = preferredCorridorId
          ? variantItems.filter((variant) => getVariantCorridorId(variant) === preferredCorridorId)
          : variantItems;
        const visibleVariants = scopedVariants.length ? scopedVariants : variantItems;
        const matchingConfigs = configItems.filter((config) => {
          const variantId = getRouteVariantId(config);
          return visibleVariants.some((variant) => variant._id === variantId);
        });
        const existingConfig =
          matchingConfigs.find((config) => config.status === "ACTIVE") ||
          matchingConfigs.find((config) => config.status === "DRAFT") ||
          matchingConfigs[0];
        const selected = existingConfig
          ? visibleVariants.find((variant) => variant._id === getRouteVariantId(existingConfig))
          : visibleVariants[0];
        setVariants(visibleVariants);
        setConfigs(configItems);
        setConfigId(existingConfig?._id || null);
        setPatternName(normalizeServiceType(existingConfig?.patternName));
        setSelectedVariantId(selected?._id || "");
      } catch (err) {
        if (alive) setError(displayError(err, "Unable to load route configuration options."));
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [brandId, fleetId, preferredCorridorId]);

  useEffect(() => {
    let alive = true;
    async function loadStops() {
      if (!brandId || !selectedVariantId) {
        setStops([]);
        return;
      }
      setLoadingStops(true);
      setError(null);
      try {
        const selectedConfig = findPreferredConfig(configs, selectedVariantId);
        const nextConfigId = selectedConfig?._id || null;
        const stopItems = await getVariantStopsWithConfig(
          brandId,
          selectedVariantId,
          nextConfigId,
          fleetId,
        );
        if (!alive) return;
        setConfigId(nextConfigId);
        setPatternName(normalizeServiceType(selectedConfig?.patternName));
        setStops(stopItems);
        setActiveStops(getInitialActiveStopIds(stopItems));
        setTimingConfig(buildInitialTiming(stopItems));
        setHasUnsavedChanges(false);
      } catch (err) {
        if (alive) setError(displayError(err, "Unable to load stops for this route."));
      } finally {
        if (alive) setLoadingStops(false);
      }
    }
    void loadStops();
    return () => {
      alive = false;
    };
  }, [brandId, configs, fleetId, selectedVariantId]);

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant._id === selectedVariantId) || null,
    [selectedVariantId, variants],
  );
  const firstStopId = stops[0] ? getStopId(stops[0]) : null;
  const lastStopId = stops.length ? getStopId(stops[stops.length - 1]) : null;
  const selectedConfig = useMemo(
    () => findPreferredConfig(configs, selectedVariantId),
    [configs, selectedVariantId],
  );
  const servedStopItems = useMemo(
    () => stops.filter((stop) => activeStops.includes(getStopId(stop))),
    [activeStops, stops],
  );
  const firstServedStop = servedStopItems[0] || null;
  const lastServedStop = servedStopItems.length ? servedStopItems[servedStopItems.length - 1] : null;

  const firstDeparture = firstServedStop
    ? timingConfig.find((item) => item.stopId === getStopId(firstServedStop))?.estimatedDeparture || ""
    : "";
  const finalArrival = lastServedStop
    ? timingConfig.find((item) => item.stopId === getStopId(lastServedStop))?.estimatedArrival || ""
    : "";

  const totalDurationMinutes = useMemo(() => {
    if (!firstDeparture || !finalArrival) return null;
    return calculateDurationMinutes(firstDeparture, finalArrival);
  }, [firstDeparture, finalArrival]);

  const isCompletedSetup = selectedConfig?.status === "ACTIVE";
  const emptyRouteState = getEmptyRouteState({
    brandId,
    hasVariants: variants.length > 0,
    assignedRouteLabel: setup.assignedRoute?.label,
  });

  const missingTimingCount = useMemo(() => {
    let count = 0;
    if (!firstDeparture) count++;
    for (const stop of servedStopItems) {
      const stopId = getStopId(stop);
      if (stopId === firstStopId) continue;
      const timing = timingConfig.find((item) => item.stopId === stopId);
      if (!timing?.estimatedArrival) count++;
    }
    return count;
  }, [firstDeparture, firstStopId, servedStopItems, timingConfig]);

  function updateTiming(stopId: string, patch: Partial<OperatorRouteTiming>) {
    setHasUnsavedChanges(true);
    setAutoSaveState("idle");
    setTimingConfig((current) =>
      current.map((timing) => (timing.stopId === stopId ? { ...timing, ...patch } : timing)),
    );
  }

  function handleArrivalChange(stopId: string, newArrival12h: string) {
    const timing = timingConfig.find((item) => item.stopId === stopId);
    const halt = timing?.haltDuration ?? 5;
    const isLast = stopId === lastStopId;
    const computedDep = isLast ? "" : calculateDeparture(newArrival12h, halt);

    updateTiming(stopId, {
      estimatedArrival: newArrival12h,
      ...(isLast ? {} : { estimatedDeparture: computedDep }),
    });
  }

  function handleHaltChange(stopId: string, haltMinutes: number) {
    const timing = timingConfig.find((item) => item.stopId === stopId);
    const arrival = timing?.estimatedArrival || "";
    const isLast = stopId === lastStopId;
    const computedDep = isLast || !arrival ? "" : calculateDeparture(arrival, haltMinutes);

    updateTiming(stopId, {
      haltDuration: haltMinutes,
      ...(isLast ? {} : { estimatedDeparture: computedDep }),
    });
  }

  function toggleStop(stopId: string, checked: boolean) {
    if (stopId === firstStopId || stopId === lastStopId) return;
    setHasUnsavedChanges(true);
    setAutoSaveState("idle");
    setActiveStops((current) =>
      checked ? [...new Set([...current, stopId])] : current.filter((id) => id !== stopId),
    );
  }

  const buildPayload = useCallback(() => {
    const activeStopSet = new Set(activeStops);
    const activeStopItems = stops.filter((stop) => activeStopSet.has(getStopId(stop)));
    const realFirst = activeStopItems[0] ? getStopId(activeStopItems[0]) : null;
    const realLast = activeStopItems.length ? getStopId(activeStopItems[activeStopItems.length - 1]) : null;

    return {
      activeStops: activeStopItems.map(getStopId),
      boardingConfig: activeStopItems.map((stop) => ({
        stopId: getStopId(stop),
        boardingPointIds: (stop.boardingPoints || [])
          .map(getBoardingPointId)
          .filter((pointId): pointId is string => Boolean(pointId)),
      })),
      timingConfig: activeStopItems.map((stop) => {
        const stopId = getStopId(stop);
        const timing = timingConfig.find((item) => item.stopId === stopId) || {
          stopId,
          estimatedArrival: "",
          estimatedDeparture: "",
          haltDuration: 5,
          dayOffset: 0,
          stopBehavior: "BOTH" as OperatorStopBehavior,
        };
        const isFirst = stopId === realFirst;
        const isLast = stopId === realLast;
        const haltDuration = timing.haltDuration ?? 5;
        return {
          ...timing,
          haltDuration,
          estimatedArrival: isFirst ? "" : timing.estimatedArrival,
          estimatedDeparture: isLast
            ? ""
            : isFirst
              ? timing.estimatedDeparture
              : calculateDeparture(timing.estimatedArrival, haltDuration),
          stopBehavior: isFirst
            ? "BOARDING_ONLY"
            : isLast
              ? "DROPPING_ONLY"
              : timing.stopBehavior,
        };
      }),
    };
  }, [activeStops, stops, timingConfig]);

  // Automatic background draft saver (runs 1.5s after user stops editing)
  useEffect(() => {
    if (!hasUnsavedChanges || isCompletedSetup || !brandId || !selectedVariantId || stops.length === 0) {
      return;
    }
    const timer = setTimeout(() => {
      void (async () => {
        setAutoSaveState("saving");
        try {
          const payload = buildPayload();
          const cleanPatternName = normalizeServiceType(patternName);
          if (configId || selectedConfig?._id) {
            const saved = await updateOperatorRouteConfig(configId || selectedConfig?._id || "", {
              patternName: cleanPatternName,
              fleetId,
              status: "DRAFT",
              ...payload,
            });
            if (saved?._id) setConfigId(saved._id);
          } else {
            const saved = await saveOperatorRouteConfig({
              brandId,
              variantId: selectedVariantId,
              fleetId,
              patternName: cleanPatternName,
              status: "DRAFT",
              ...payload,
            });
            if (saved?._id) setConfigId(saved._id);
          }
          setHasUnsavedChanges(false);
          setAutoSaveState("saved");
        } catch (err) {
          setAutoSaveState("error");
          setError(displayError(err, "Draft could not be saved. Keep this window open and retry."));
        }
      })();
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    hasUnsavedChanges,
    isCompletedSetup,
    brandId,
    selectedVariantId,
    stops,
    patternName,
    configId,
    selectedConfig,
    fleetId,
    activeStops,
    timingConfig,
    buildPayload,
  ]);

  function getCompletionError(): string | null {
    if (activeStops.length < 2 || !firstStopId || !lastStopId) {
      return "Please keep at least the starting and destination stops in your schedule.";
    }
    if (!activeStops.includes(firstStopId)) return `Please keep ${getStopName(stops[0])} as the starting stop.`;
    if (!activeStops.includes(lastStopId)) return `Please keep ${getStopName(stops[stops.length - 1])} as the final stop.`;
    const firstTiming = timingConfig.find((item) => item.stopId === firstStopId);
    if (!firstTiming?.estimatedDeparture) return `Please enter the departure time from ${getStopName(stops[0])}.`;
    for (const stop of servedStopItems) {
      const stopId = getStopId(stop);
      if (stopId === firstStopId) continue;
      const timing = timingConfig.find((item) => item.stopId === stopId);
      if (!timing?.estimatedArrival) return `Please set the arrival time for ${getStopName(stop)}.`;
    }
    return null;
  }

  async function handleSave(mode: "draft" | "complete"): Promise<boolean> {
    if (!brandId || !selectedVariantId) return false;
    const cleanPatternName = normalizeServiceType(patternName);
    if (mode === "complete") {
      const completionError = getCompletionError();
      if (completionError) {
        setError(completionError);
        return false;
      }
    }
    setSavingMode(mode);
    setError(null);
    try {
      const payload = buildPayload();
      const status = mode === "draft" ? "DRAFT" : "ACTIVE";
      if (configId || selectedConfig?._id) {
        const saved = await updateOperatorRouteConfig(configId || selectedConfig?._id || "", {
          patternName: cleanPatternName,
          fleetId,
          status,
          ...payload,
        });
        if (saved?._id) setConfigId(saved._id);
      } else {
        const saved = await saveOperatorRouteConfig({
          brandId,
          variantId: selectedVariantId,
          fleetId,
          patternName: cleanPatternName,
          status,
          ...payload,
        });
        if (saved?._id) setConfigId(saved._id);
      }
      setHasUnsavedChanges(false);
      setAutoSaveState("saved");
      if (mode === "complete") onSaved();
      return true;
    } catch (err) {
      setError(
        displayError(
          err,
          mode === "draft" ? "Unable to save draft." : "Unable to save route timetable.",
        ),
      );
      return false;
    } finally {
      setSavingMode(null);
    }
  }

  async function handleBack() {
    if (hasUnsavedChanges && !isCompletedSetup && brandId && selectedVariantId && stops.length > 0) {
      const saved = await handleSave("draft");
      if (!saved) return;
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-[#111111]/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4 md:p-6 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="route-service-setup-title"
    >
      <div className="flex h-[96svh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-[#E8E0D4] bg-[#FAF8F5] shadow-2xl sm:h-[820px] sm:max-h-[94svh] sm:rounded-2xl">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-[#E8E0D4] bg-white px-5 py-3.5 sm:px-7 sm:py-4">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#7A1D1B]">
              <span>Bus Route Setup</span>
              <span className="text-[#CCCCCC]">·</span>
              <span className="text-[#666666]">Daily Timetable</span>
            </div>
            <h2 id="route-service-setup-title" className="text-lg font-bold text-[#111111] sm:text-xl">
              Set Stops & Daily Timings
            </h2>
            <p className="text-xs text-[#666666]">
              {fleet.busName} · <span className="font-mono text-[#333333] font-semibold">{fleet.busNumber}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleBack()}
            className="flex size-9 items-center justify-center rounded-xl border border-[#E8E0D4] bg-[#FAFAF8] text-[#555555] transition hover:bg-white hover:text-[#111111]"
            aria-label="Close setup modal"
            disabled={Boolean(savingMode)}
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Responsive Content Area: Left Settings Rail + Right Stops List */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          {/* Left Sidebar: Route Details */}
          <aside className="w-full shrink-0 border-b border-[#E8E0D4] bg-[#FAF8F5] p-4 sm:p-5 lg:w-[300px] lg:border-b-0 lg:border-r overflow-y-auto max-h-[220px] lg:max-h-none">
            <div className="space-y-3.5">
              {/* Approved Route Card */}
              <div className="rounded-xl border border-[#E8E0D4] bg-white p-3.5 shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">
                  Approved Route
                </p>
                <div className="mt-1.5 flex items-start gap-2 text-sm font-bold text-[#111111]">
                  <Route className="mt-0.5 size-4 shrink-0 text-[#7A1D1B]" />
                  <span>{setup.assignedRoute?.label || "Corridor approved for vehicle"}</span>
                </div>
                {setup.assignedRoute?.code && (
                  <div className="mt-2 inline-flex items-center rounded-md bg-[#FAF8F5] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#666666] border border-[#E8E0D4]">
                    Route Code: {setup.assignedRoute.code}
                  </div>
                )}
              </div>

              {/* Service / Bus Category */}
              <div className="rounded-xl border border-[#E8E0D4] bg-white p-3.5 shadow-2xs">
                <label
                  htmlFor="route-pattern-name"
                  className="block text-[10px] font-bold uppercase tracking-wider text-[#888888]"
                >
                  Bus Category
                </label>
                <div className="relative mt-1.5">
                  <select
                    id="route-pattern-name"
                    value={normalizeServiceType(patternName)}
                    onChange={(event) => {
                      setPatternName(event.target.value);
                      setHasUnsavedChanges(true);
                      setAutoSaveState("idle");
                    }}
                    className="h-10 w-full appearance-none rounded-xl border border-[#D9D0C7] bg-[#FAFAF8] pl-3.5 pr-9 text-xs font-semibold text-[#111111] outline-none transition focus:border-[#7A1D1B] focus:bg-white focus:ring-1 focus:ring-[#7A1D1B]"
                  >
                    {SERVICE_TYPE_OPTIONS.map((serviceType) => (
                      <option key={serviceType} value={serviceType}>
                        {serviceType}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#7A736C]" />
                </div>
                <p className="mt-1 text-[11px] text-[#666666]">
                  Shown to passengers when booking seats.
                </p>
              </div>

              {/* Route Variant / Highway */}
              <div className="rounded-xl border border-[#E8E0D4] bg-white p-3.5 shadow-2xs">
                <label
                  htmlFor="route-variant"
                  className="block text-[10px] font-bold uppercase tracking-wider text-[#888888]"
                >
                  Route Path (Highway)
                </label>
                <div className="relative mt-1.5">
                  <select
                    id="route-variant"
                    value={selectedVariantId}
                    onChange={(event) => {
                      setSelectedVariantId(event.target.value);
                      setHasUnsavedChanges(false);
                    }}
                    disabled={loading || variants.length === 0}
                    className="h-10 w-full appearance-none rounded-xl border border-[#D9D0C7] bg-[#FAFAF8] pl-3.5 pr-9 text-xs font-semibold text-[#111111] outline-none transition focus:border-[#7A1D1B] focus:bg-white focus:ring-1 focus:ring-[#7A1D1B] disabled:opacity-50"
                  >
                    {variants.length === 0 ? (
                      <option value="">No route path available</option>
                    ) : (
                      variants.map((variant) => (
                        <option key={variant._id} value={variant._id}>
                          {variant.name || variant.code || routeLabel(variant)}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#7A736C]" />
                </div>
              </div>

              {/* Verified Permit Notice */}
              <div className="flex items-start gap-2 rounded-xl border border-[#E8E0D4] bg-[#FAF8F5] p-3 text-[11px] text-[#555555]">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#2E7D32]" />
                <span className="leading-snug">
                  Official route permit verified. Stops follow the authorized highway path.
                </span>
              </div>
            </div>
          </aside>

          {/* Right Main Canvas: Daily Stops & Timetable */}
          <main className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-white p-4 sm:p-6 lg:p-7">
            {/* Top Journey Summary Ribbon */}
            <div className="border-b border-[#E8E0D4] pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#111111]">
                    Passenger Stops & Timetable
                  </h3>
                  <p className="text-xs text-[#666666]">
                    Set what time the bus reaches and departs from each stop along the trip.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-[#E8E0D4] bg-[#FAF8F5] px-3 py-1 text-xs font-semibold text-[#444444]">
                    {servedStopItems.length} of {stops.length || selectedVariant?.stopCount || 0} stops active
                  </span>
                  {missingTimingCount === 0 && servedStopItems.length >= 2 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                      <Check className="size-3" />
                      All stop timings set
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
                      {missingTimingCount} time{missingTimingCount === 1 ? "" : "s"} missing
                    </span>
                  )}
                </div>
              </div>

              {/* Trip Ribbon (Origin -> Duration -> Destination) */}
              {firstServedStop && lastServedStop && (
                <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E8E0D4] bg-[#FAF8F5] p-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="size-2.5 rounded-full bg-[#7A1D1B]" />
                    <div className="truncate">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#888888] block">
                        Starts From
                      </span>
                      <span className="truncate text-xs font-bold text-[#111111]">
                        {getStopName(firstServedStop)}
                      </span>
                    </div>
                    <span className="ml-1 rounded-lg bg-white px-2 py-0.5 font-mono text-xs font-bold text-[#7A1D1B] border border-[#E8E0D4]">
                      {firstDeparture || "Time needed"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#666666]">
                    <div className="h-px w-6 bg-[#CCCCCC] sm:w-12" />
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#333333] border border-[#E8E0D4]">
                      <Clock3 className="size-3 text-[#7A1D1B]" />
                      {totalDurationMinutes ? `~${formatDuration(totalDurationMinutes)} trip` : "Trip duration"}
                    </span>
                    <ArrowRight className="size-3.5 text-[#888888]" />
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    <div className="truncate text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#888888] block">
                        Reaches
                      </span>
                      <span className="truncate text-xs font-bold text-[#111111]">
                        {getStopName(lastServedStop)}
                      </span>
                    </div>
                    <span className="rounded-lg bg-white px-2 py-0.5 font-mono text-xs font-bold text-[#111111] border border-[#E8E0D4]">
                      {finalArrival || "Time needed"}
                    </span>
                    <div className="size-2.5 rounded-full bg-[#7A1D1B]" />
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Stops Timeline */}
            {loading || loadingStops ? (
              <div className="my-8 flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-[#E8E0D4] bg-[#FAF8F5] text-[#666666]">
                <Loader2 className="size-7 animate-spin text-[#7A1D1B]" />
                <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#888888]">
                  Loading route stops...
                </p>
              </div>
            ) : stops.length === 0 ? (
              <div className="my-8 rounded-xl border border-dashed border-[#E8E0D4] bg-[#FAF8F5] p-8 text-center">
                <p className="text-sm font-bold text-[#111111]">{emptyRouteState.title}</p>
                <p className="mt-1 text-xs text-[#666666]">{emptyRouteState.body}</p>
              </div>
            ) : (
              <div className="relative mt-5 space-y-3.5 pb-6">
                {/* Continuous Vertical Journey Line */}
                <div
                  className="absolute bottom-6 left-[19px] top-6 w-0.5 bg-[#E8E0D4]"
                  aria-hidden="true"
                />

                {stops.map((stop, index) => {
                  const stopId = getStopId(stop);
                  const isFirst = stopId === firstStopId;
                  const isLast = stopId === lastStopId;
                  const isEndpoint = isFirst || isLast;
                  const isActive = activeStops.includes(stopId);
                  const timing = timingConfig.find((item) => item.stopId === stopId);
                  const isRestStop = timing?.stopBehavior === "REST_STOP";
                  const haltDuration = timing?.haltDuration ?? 5;
                  const computedDep = isFirst
                    ? timing?.estimatedDeparture || ""
                    : timing?.estimatedArrival
                      ? calculateDeparture(timing.estimatedArrival, haltDuration)
                      : "";

                  const hasMissingTime =
                    isActive && (isFirst ? !timing?.estimatedDeparture : !timing?.estimatedArrival);

                  return (
                    <div
                      key={stop._id || stopId}
                      className={`relative flex items-start gap-3 transition ${
                        !isActive ? "opacity-75" : ""
                      }`}
                    >
                      {/* Milestone Node */}
                      <div className="relative z-10 shrink-0">
                        {isEndpoint ? (
                          <div className="flex size-10 items-center justify-center rounded-full bg-[#7A1D1B] text-white shadow-xs ring-4 ring-white">
                            <MapPin className="size-4" />
                          </div>
                        ) : isActive ? (
                          <div
                            className={`flex size-10 items-center justify-center rounded-full border-2 bg-white text-xs font-bold shadow-xs ring-4 ring-white ${
                              isRestStop
                                ? "border-[#C99A4A] text-[#C99A4A]"
                                : "border-[#7A1D1B] text-[#7A1D1B]"
                            }`}
                          >
                            {isRestStop ? <Coffee className="size-3.5" /> : index + 1}
                          </div>
                        ) : (
                          <div className="flex size-10 items-center justify-center rounded-full border border-dashed border-[#CCCCCC] bg-[#F5F5F5] text-xs font-semibold text-[#888888] ring-4 ring-white">
                            {index + 1}
                          </div>
                        )}
                      </div>

                      {/* Stop Content Card */}
                      <div
                        className={`min-w-0 flex-1 rounded-xl border transition ${
                          hasMissingTime
                            ? "border-amber-300 bg-amber-50/15"
                            : isActive
                              ? "border-[#E8E0D4] bg-white shadow-2xs hover:border-[#D0C8BC]"
                              : "border-dashed border-[#DCD5CE] bg-[#FAF8F5]"
                        } p-4`}
                      >
                        {/* Stop Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <h4 className="truncate text-sm font-bold text-[#111111]">
                              {stop.stopId.name || "Unnamed Stop"}
                            </h4>
                            {stop.stopId.code && (
                              <span className="rounded-md bg-[#FAF8F5] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-[#666666] border border-[#E8E0D4]">
                                {stop.stopId.code}
                              </span>
                            )}
                            {isFirst && (
                              <span className="rounded-full bg-[#7A1D1B]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#7A1D1B]">
                                Starting Point · Boarding Only
                              </span>
                            )}
                            {isLast && (
                              <span className="rounded-full bg-[#7A1D1B]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#7A1D1B]">
                                Final Destination · Drop-off Only
                              </span>
                            )}
                          </div>

                          {/* Toggle Active / Skip */}
                          {!isEndpoint && (
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#E8E0D4] bg-white px-2.5 py-1 text-xs font-semibold text-[#444444] hover:bg-[#FAF8F5]">
                              <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => toggleStop(stopId, e.target.checked)}
                                className="size-3.5 rounded border-[#CCCCCC] accent-[#7A1D1B]"
                              />
                              <span>{isActive ? "Serving this stop" : "Skip stop"}</span>
                            </label>
                          )}
                        </div>

                        {/* Controls in a Single Clean Unified Grid */}
                        {isActive ? (
                          <div className="mt-3.5 grid gap-3 border-t border-[#F0EAE4] pt-3.5 sm:grid-cols-2 lg:grid-cols-3">
                            {/* Origin Stop: Departure Time & Fixed Behavior */}
                            {isFirst && (
                              <>
                                <div className="space-y-1.5 sm:col-span-1 lg:col-span-1">
                                  <label className="text-[11px] font-bold text-[#444444] flex items-center gap-1">
                                    <Clock3 className="size-3.5 text-[#7A1D1B]" />
                                    Est. Departure <span className="text-[#7A1D1B]">*</span>
                                  </label>
                                  <ShuvmargTimePicker
                                    value={timing?.estimatedDeparture || ""}
                                    onChange={(val) => updateTiming(stopId, { estimatedDeparture: val })}
                                  />
                                </div>

                                <div className="space-y-1.5 sm:col-span-1 lg:col-span-1">
                                  <label className="text-[11px] font-bold text-[#444444]">
                                    Stop Behavior
                                  </label>
                                  <div className="flex h-10 items-center rounded-xl border border-[#E8E0D4] bg-[#FAF8F5] px-3 text-xs font-semibold text-[#666666]">
                                    Boarding Only (Starting stop)
                                  </div>
                                </div>
                              </>
                            )}

                            {/* Intermediate Stop: Arrival, Halt Duration & Stop Behavior */}
                            {!isFirst && !isLast && (
                              <>
                                {/* Column 1: Est. Arrival with Live Departure Preview */}
                                <div className="space-y-1.5">
                                  <label className="text-[11px] font-bold text-[#444444] flex items-center gap-1">
                                    <Clock3 className="size-3.5 text-[#7A1D1B]" />
                                    Est. Arrival <span className="text-[#7A1D1B]">*</span>
                                  </label>
                                  <ShuvmargTimePicker
                                    value={timing?.estimatedArrival || ""}
                                    onChange={(val) => handleArrivalChange(stopId, val)}
                                  />
                                  {computedDep ? (
                                    <p className="mt-1 text-[11px] font-semibold text-[#7A1D1B] flex items-center gap-1">
                                      <ArrowRight className="size-3 shrink-0" />
                                      Departs at {computedDep}
                                    </p>
                                  ) : null}
                                </div>

                                {/* Column 2: Halt Duration Dropdown */}
                                <div className="space-y-1.5">
                                  <label className="text-[11px] font-bold text-[#444444] flex items-center gap-1">
                                    <Clock3 className="size-3.5 text-[#666666]" />
                                    Halt Duration
                                  </label>
                                  <div className="relative">
                                    <select
                                      value={String(timing?.haltDuration ?? 5)}
                                      onChange={(event) => handleHaltChange(stopId, Number(event.target.value))}
                                      className="h-10 w-full appearance-none rounded-xl border border-[#D9D0C7] bg-[#FAFAF8] pl-3 pr-8 text-xs font-semibold text-[#111111] outline-none transition hover:border-[#B5AAA0] focus:border-[#7A1D1B] focus:bg-white focus:ring-1 focus:ring-[#7A1D1B]"
                                    >
                                      {HALT_DURATION_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#7A736C]" />
                                  </div>
                                </div>

                                {/* Column 3: Stop Behavior Dropdown */}
                                <div className="space-y-1.5">
                                  <label className="text-[11px] font-bold text-[#444444]">
                                    Stop Behavior
                                  </label>
                                  <div className="relative">
                                    <select
                                      value={timing?.stopBehavior || "BOTH"}
                                      onChange={(event) =>
                                        updateTiming(stopId, {
                                          stopBehavior: event.target.value as OperatorStopBehavior,
                                        })
                                      }
                                      className="h-10 w-full appearance-none rounded-xl border border-[#D9D0C7] bg-[#FAFAF8] pl-3 pr-8 text-xs font-semibold text-[#111111] outline-none transition hover:border-[#B5AAA0] focus:border-[#7A1D1B] focus:bg-white focus:ring-1 focus:ring-[#7A1D1B]"
                                    >
                                      {(Object.keys(STOP_BEHAVIOR_LABELS) as OperatorStopBehavior[]).map(
                                        (behavior) => (
                                          <option key={behavior} value={behavior}>
                                            {STOP_BEHAVIOR_LABELS[behavior]}
                                          </option>
                                        ),
                                      )}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#7A736C]" />
                                  </div>
                                </div>
                              </>
                            )}

                            {/* Destination Stop: Est. Arrival & Fixed Behavior */}
                            {isLast && (
                              <>
                                <div className="space-y-1.5 sm:col-span-1 lg:col-span-1">
                                  <label className="text-[11px] font-bold text-[#444444] flex items-center gap-1">
                                    <Clock3 className="size-3.5 text-[#7A1D1B]" />
                                    Est. Arrival <span className="text-[#7A1D1B]">*</span>
                                  </label>
                                  <ShuvmargTimePicker
                                    value={timing?.estimatedArrival || ""}
                                    onChange={(val) => handleArrivalChange(stopId, val)}
                                  />
                                </div>

                                <div className="space-y-1.5 sm:col-span-1 lg:col-span-1">
                                  <label className="text-[11px] font-bold text-[#444444]">
                                    Stop Behavior
                                  </label>
                                  <div className="flex h-10 items-center rounded-xl border border-[#E8E0D4] bg-[#FAF8F5] px-3 text-xs font-semibold text-[#666666]">
                                    Dropping Only (Final destination)
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          /* Compact View for Skipped Stop */
                          <div className="mt-2 flex items-center justify-between text-xs text-[#888888]">
                            <span>Bus passes through without stopping.</span>
                            <button
                              type="button"
                              onClick={() => toggleStop(stopId, true)}
                              className="font-bold text-[#7A1D1B] hover:underline"
                            >
                              + Add stop to schedule
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>

        {/* Footer (Automatic Draft Saving - No Manual Save Draft Button) */}
        <footer className="flex shrink-0 flex-col gap-3 border-t border-[#E8E0D4] bg-white px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          {/* Live Automatic Draft Status */}
          <div className="flex items-center gap-2">
            {autoSaveState === "saving" || savingMode === "draft" ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A1D1B]">
                <Loader2 className="size-3.5 animate-spin" />
                Saving draft automatically...
              </span>
            ) : autoSaveState === "saved" ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <Check className="size-3.5" />
                Draft saved automatically
              </span>
            ) : autoSaveState === "error" ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700">
                <AlertTriangle className="size-3.5" />
                Draft not saved — keep this window open
              </span>
            ) : (
              <span className="text-xs text-[#666666]">
                All edits are saved to draft automatically
              </span>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => void handleSave("complete")}
            disabled={
              !brandId ||
              !selectedVariantId ||
              stops.length === 0 ||
              Boolean(savingMode) ||
              loading ||
              loadingStops ||
              autoSaveState === "saving"
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] px-6 text-xs font-bold text-white shadow-sm transition hover:bg-[#5C1414] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingMode === "complete" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            {isCompletedSetup ? "Save Changes" : "Complete Stops & Timings"}
          </button>
        </footer>
      </div>
    </div>
  );
}

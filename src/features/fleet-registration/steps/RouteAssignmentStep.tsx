"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Loader2, Map as MapIcon, Plus, RotateCcw, Route } from "lucide-react";
import { getFleetRouteOptions, getReusableRouteSetup } from "../api-route-setup";
import AddedRoutePlaces from "../components/AddedRoutePlaces";
import AddServedPlaceDialog from "../components/AddServedPlaceDialog";
import RouteEndpointPicker from "../components/RouteEndpointPicker";
import RouteOverviewMap from "../components/RouteOverviewMap";
import RoutePathCard from "../components/RoutePathCard";
import ServedStopTimeline, { defaultServedStops } from "../components/ServedStopTimeline";
import type { FleetRegistrationDraft } from "../types";
import type { FleetRouteStop, FleetServedStop } from "../route-types";

export default function RouteAssignmentStep({
  draft,
  update,
  readOnly = false,
}: {
  draft: FleetRegistrationDraft;
  update: (next: FleetRegistrationDraft) => void;
  readOnly?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variants, setVariants] = useState(draft.route.selectedVariant ? [draft.route.selectedVariant] : []);
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [initialAddCoords, setInitialAddCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [reusableResult, setReusableResult] = useState<{
    variantId: string;
    servedStops: FleetServedStop[];
    returnEnabled: boolean;
  } | null>(null);

  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const originId = draft.route.originStop?.id;
  const destinationId = draft.route.destinationStop?.id;

  const unresolvedStops: FleetRouteStop[] = useMemo(() => {
    if (!draft.route.originStop || !draft.route.destinationStop) return [];
    return [
      {
        ...draft.route.originStop,
        sequence: 1,
        distanceFromOriginKm: 0,
        durationFromOriginMins: 0,
        isMajor: true,
      },
      {
        ...draft.route.destinationStop,
        sequence: 2,
        distanceFromOriginKm: null,
        durationFromOriginMins: 0,
        isMajor: true,
      },
    ];
  }, [draft.route.originStop, draft.route.destinationStop]);

  // Unified list of active stops (from official variant OR origin + added places + destination)
  const activeStops: FleetRouteStop[] = useMemo(() => {
    if (draft.route.selectedVariant) {
      return draft.route.selectedVariant.stops;
    }
    if (unresolvedStops.length >= 2) {
      return [
        unresolvedStops[0],
        ...draft.route.addedPlaces.map((p, idx) => ({
          id: p.clientKey,
          name: p.name,
          code: null,
          parentStop: null,
          district: null,
          municipality: null,
          province: null,
          isRouteStop: true,
          sequence: idx + 2,
          distanceFromOriginKm: null,
          durationFromOriginMins: 0,
          coordinates: p.coordinates || null,
          isMajor: true,
        })),
        {
          ...unresolvedStops[1],
          sequence: draft.route.addedPlaces.length + 2,
        },
      ];
    }
    return [];
  }, [draft.route.selectedVariant, unresolvedStops, draft.route.addedPlaces]);

  function patchRoute(patch: Partial<FleetRegistrationDraft["route"]>) {
    update({ ...draftRef.current, route: { ...draftRef.current.route, ...patch } });
  }

  // Fetch corridor options when endpoints change
  useEffect(() => {
    if (!originId || !destinationId) return;
    let active = true;

    // If either is custom, immediately set NEEDS_PLATFORM_REVIEW without network query
    if (draftRef.current.route.originStop?.isCustom || draftRef.current.route.destinationStop?.isCustom) {
      setVariants([]);
      const currentServed = draftRef.current.route.servedStops;
      const fallbackServed = currentServed && currentServed.length > 0 ? currentServed : defaultServedStops(unresolvedStops);
      patchRoute({
        corridorId: null,
        corridorCode: null,
        direction: null,
        resolutionStatus: "NEEDS_PLATFORM_REVIEW",
        selectedVariant: null,
        servedStops: fallbackServed,
      });
      return;
    }

    void Promise.resolve()
      .then(() => {
        if (active) {
          setLoading(true);
          setError(null);
        }
        return getFleetRouteOptions(originId, destinationId);
      })
      .then((result) => {
        if (!active) return;
        setVariants(result.variants);

        const currentRoute = draftRef.current.route;
        const selected =
          result.variants.find((item) => item.id === currentRoute.selectedVariant?.id) ||
          (result.variants.length === 1 ? result.variants[0] : null);

        const currentServed = currentRoute.servedStops || [];
        const isSameVariant = currentRoute.selectedVariant?.id === selected?.id;

        let preservedServed: FleetServedStop[];
        if (isSameVariant && currentServed.length > 0) {
          preservedServed = currentServed;
        } else if (selected && selected.stops.length > 0) {
          preservedServed = defaultServedStops(selected.stops);
        } else {
          preservedServed = currentServed.length > 0 ? currentServed : defaultServedStops(unresolvedStops);
        }

        patchRoute({
          corridorId: result.corridor?.id || null,
          corridorCode: result.corridor?.code || null,
          direction: result.direction || null,
          resolutionStatus: result.status,
          selectedVariant: selected || currentRoute.selectedVariant || null,
          servedStops: preservedServed,
        });
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to find routes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originId, destinationId]);

  // Reusable brand setup check
  useEffect(() => {
    const variant = draft.route.selectedVariant;
    if (!variant || !draft.vehicle.brandId) return;
    let active = true;

    void getReusableRouteSetup(draft.vehicle.brandId, variant.id)
      .then((result) => {
        if (!active || !result) return;
        const stopById = new Map(variant.stops.map((stop) => [stop.id, stop]));
        setReusableResult({
          variantId: variant.id,
          ...result,
          servedStops: result.servedStops.map((item) => ({
            ...item,
            name: item.name || stopById.get(item.stopId)?.name || "Route stop",
            meetingDetails: {
              displayName: item.meetingDetails?.displayName || "",
              counterNumber: item.meetingDetails?.counterNumber || "",
              contactName: item.meetingDetails?.contactName || "",
              contactPhone: item.meetingDetails?.contactPhone || "",
              reportingInstructions: item.meetingDetails?.reportingInstructions || "",
            },
          })),
        });
      })
      .catch(() => {
        if (active) setReusableResult(null);
      });

    return () => {
      active = false;
    };
  }, [draft.route.selectedVariant, draft.vehicle.brandId]);

  const reusable =
    reusableResult?.variantId === draft.route.selectedVariant?.id ? reusableResult : null;

  function handleToggleStop(stop: FleetRouteStop) {
    const currentServed = draftRef.current.route.servedStops || [];
    const stopNameNorm = (stop.name || "").toLowerCase().trim();
    const existingIndex = currentServed.findIndex(
      (s) => s.stopId === stop.id || (stopNameNorm && (s.name || "").toLowerCase().trim() === stopNameNorm)
    );

    if (existingIndex >= 0) {
      if (stop.sequence === activeStops[0]?.sequence || stop.sequence === activeStops.at(-1)?.sequence) return;
      patchRoute({
        servedStops: currentServed.filter(
          (s) => s.stopId !== stop.id && (!stopNameNorm || (s.name || "").toLowerCase().trim() !== stopNameNorm)
        ),
      });
    } else {
      const nextServed: FleetServedStop = {
        stopId: stop.id,
        name: stop.name,
        sequence: stop.sequence,
        usage: "BOTH",
        boardingMode: "STOP_FALLBACK",
        boardingLocationIds: [],
        customBoardingPoints: [],
        meetingDetails: {
          displayName: "",
          counterNumber: "",
          contactName: "",
          contactPhone: "",
          reportingInstructions: "",
        },
      };
      patchRoute({
        servedStops: [...currentServed, nextServed].sort((a, b) => a.sequence - b.sequence),
      });
    }
  }

  function handleMapClickAdd(point: { lat: number; lng: number }) {
    setInitialAddCoords(point);
    setShowAddPlace(true);
  }

  function handleSwapEndpoints() {
    const nextOrigin = draft.route.destinationStop;
    const nextDest = draft.route.originStop;
    patchRoute({
      originStop: nextOrigin,
      origin: nextOrigin?.name || "",
      destinationStop: nextDest,
      destination: nextDest?.name || "",
      corridorId: null,
      selectedVariant: null,
      servedStops: [],
      addedPlaces: [],
      resolutionStatus: "UNRESOLVED",
    });
  }

  const servedCount = draft.route.servedStops.length;
  const totalStopsCount = activeStops.length;

  return (
    <div className={`mx-auto max-w-7xl space-y-6${readOnly ? " pointer-events-none select-none opacity-75" : ""}`}>
      {/* ── Polished Clean Header (No Verbose Paragraphs or Cluttered Tab Switchers) ── */}
      <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-4">
        <div>
          <h4 className="text-xl font-black tracking-tight text-[#211D1A]">Where does this bus operate?</h4>
          <p className="mt-1 text-xs text-[#776F68]">
            Configure origin, destination, served highway stops, and boarding counter locations.
          </p>
        </div>
        {servedCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F8F1E3] px-3.5 py-1.5 text-xs font-black text-[#7A1D1B] border border-[#ECD9BD]">
            <CheckCircle2 className="size-3.5 text-[#7A1D1B]" />
            {servedCount} of {totalStopsCount} Stops Served
          </span>
        )}
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="grid gap-8 xl:grid-cols-12">
        {/* Left Column: Endpoints, Highway Variants, Stops & Counters */}
        <div className="space-y-6 xl:col-span-7">
          {/* Endpoints Picker Card */}
          <div className="grid items-end gap-3 rounded-3xl border border-[#E8E1DB] bg-white p-5 shadow-2xs md:grid-cols-[1fr_auto_1fr]">
            <RouteEndpointPicker
              label="From (Origin Endpoint)"
              value={draft.route.originStop}
              excludeId={destinationId}
              onChange={(stop) =>
                patchRoute({
                  originStop: stop,
                  origin: stop?.name || "",
                  corridorId: null,
                  selectedVariant: null,
                  servedStops: [],
                  addedPlaces: [],
                  resolutionStatus: "UNRESOLVED",
                })
              }
            />

            <button
              type="button"
              onClick={handleSwapEndpoints}
              className="hidden size-10 items-center justify-center rounded-full bg-[#F3EFEB] text-[#7A1D1B] transition hover:bg-[#FFF4F1] hover:border-[#7A1D1B] active:scale-95 md:flex"
              title="Swap origin and destination endpoints"
            >
              <RotateCcw className="size-4" />
            </button>

            <RouteEndpointPicker
              label="To (Destination Endpoint)"
              value={draft.route.destinationStop}
              excludeId={originId}
              onChange={(stop) =>
                patchRoute({
                  destinationStop: stop,
                  destination: stop?.name || "",
                  corridorId: null,
                  selectedVariant: null,
                  servedStops: [],
                  addedPlaces: [],
                  resolutionStatus: "UNRESOLVED",
                })
              }
            />
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center gap-2 rounded-2xl bg-[#F8F5F2] px-4 py-3.5 text-xs font-bold text-[#746C65]">
              <Loader2 className="size-4 animate-spin text-[#7A1D1B]" />
              Finding approved road paths…
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
              {error}
            </div>
          )}

          {/* Road Path Variants (If Available) */}
          {!loading && originId && destinationId && draft.route.resolutionStatus === "AVAILABLE" && (
            <section className="space-y-3">
              <h5 className="text-xs font-black uppercase tracking-wider text-[#756E67]">
                Select Official Highway Path
              </h5>
              <div className="grid gap-3 sm:grid-cols-2">
                {variants.map((variant) => (
                  <RoutePathCard
                    key={variant.id}
                    variant={variant}
                    selected={draft.route.selectedVariant?.id === variant.id}
                    onSelect={() => {
                      const isSameVariant = draft.route.selectedVariant?.id === variant.id;
                      const hasConfiguredStops = Array.isArray(draft.route.servedStops) && draft.route.servedStops.length > 0;
                      patchRoute({
                        selectedVariant: variant,
                        servedStops: isSameVariant && hasConfiguredStops
                          ? draft.route.servedStops
                          : defaultServedStops(variant.stops),
                        addedPlaces: isSameVariant ? draft.route.addedPlaces : [],
                      });
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Reusable Setup Banner */}
          {draft.route.selectedVariant && reusable && (
            <div className="flex flex-col gap-3 rounded-2xl border border-[#D9E7DD] bg-[#F3FAF5] p-4 sm:flex-row sm:items-center">
              <CheckCircle2 className="size-5 shrink-0 text-emerald-700" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-[#203126]">
                  Your brand already uses this road path
                </p>
                <p className="text-[11px] text-[#617067]">
                  Reuse {reusable.servedStops.length} served stops &amp; counters from existing fleets.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  patchRoute({
                    servedStops: reusable.servedStops,
                    returnEnabled: reusable.returnEnabled,
                  })
                }
                className="h-8 rounded-xl bg-[#244C32] px-3.5 text-xs font-black text-white transition hover:bg-[#1C3B27]"
              >
                Use this setup
              </button>
            </div>
          )}

          {/* Uncataloged / Platform Review State */}
          {!loading && originId && destinationId && draft.route.resolutionStatus === "NEEDS_PLATFORM_REVIEW" && (
            <div className="space-y-3 rounded-2xl border border-[#E5CDA7] bg-[#FFF9EF] p-4">
              <div className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F8E8CA] text-[#8A5C16]">
                  <Route className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-black text-[#30261B]">
                    We&rsquo;ll verify this custom road path with your fleet
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#7D6A50]">
                    Add the places and counters this bus serves below. Everything is reviewed and activated together.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Served Stop Timeline */}
          {activeStops.length >= 2 && (
            <ServedStopTimeline
              stops={activeStops}
              value={
                draft.route.servedStops.length > 0
                  ? draft.route.servedStops
                  : defaultServedStops(activeStops)
              }
              onChange={(servedStops) => patchRoute({ servedStops })}
            />
          )}

          {/* Action Cards: Add Custom Stop & Round-Trip Return Route */}
          {activeStops.length >= 2 && (
            <div className="space-y-3.5">
              {/* Card 1: Add Custom Stop / Missing Place */}
              <div className="flex flex-col gap-3.5 rounded-2xl border border-[#E3DBD4] bg-[#FAF8F5] p-4 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#7A1D1B] border border-[#E0D7CE] shadow-xs">
                    <MapIcon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <h6 className="text-xs font-black text-[#211D1A]">
                      Missing an intermediate chowk, junction, or village?
                    </h6>
                    <p className="text-[11px] text-[#7A726A]">
                      Add unlisted junction, resort, or local landmark pickup along this corridor.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setInitialAddCoords(null);
                    setShowAddPlace(true);
                  }}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-black text-[#7A1D1B] border border-[#D9D0C7] shadow-xs transition hover:border-[#7A1D1B] hover:bg-[#FFF4F1] active:scale-95"
                >
                  <Plus className="size-3.5 text-[#7A1D1B]" />
                  <span>+ Add Custom Stop</span>
                </button>
              </div>

              {/* Card 2: Return Journey (Round-Trip Operation) */}
              <div className="flex flex-col gap-3 rounded-2xl border border-[#E3DBD4] bg-white p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF4F1] text-[#7A1D1B] border border-[#F0A09B]">
                    <RotateCcw className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h6 className="text-xs font-black text-[#211D1A]">
                        Round-Trip Service (Return Journey)
                      </h6>
                      {draft.route.returnEnabled && (
                        <span className="rounded-md bg-emerald-50 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-800 border border-emerald-200">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#7D756E]">
                      {draft.route.selectedVariant?.returnVariantId
                        ? "Approved return highway variant is linked and verified automatically."
                        : "This vehicle returns along the same road. We'll include the return route in review."}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center self-start sm:self-center shrink-0">
                  <input
                    type="checkbox"
                    checked={draft.route.returnEnabled}
                    onChange={(event) => patchRoute({ returnEnabled: event.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="h-6 w-11 rounded-full bg-[#DDD5CD] peer-focus:outline-none peer-checked:bg-[#7A1D1B] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner" />
                </label>
              </div>
            </div>
          )}

          {/* Added Custom Places List */}
          <AddedRoutePlaces
            places={draft.route.addedPlaces}
            onRemove={(clientKey) =>
              patchRoute({
                addedPlaces: draft.route.addedPlaces.filter((item) => item.clientKey !== clientKey),
              })
            }
          />
        </div>

        {/* Right Column: Sticky Live Interactive Google Map */}
        <div className="xl:col-span-5">
          <div className="sticky top-6 h-[calc(100vh-160px)] min-h-[520px] max-h-[760px] overflow-hidden rounded-3xl border border-[#DDD5CD] shadow-sm">
            <RouteOverviewMap
              origin={draft.route.originStop}
              destination={draft.route.destinationStop}
              variantStops={activeStops}
              servedStops={
                draft.route.servedStops.length > 0
                  ? draft.route.servedStops
                  : defaultServedStops(activeStops)
              }
              addedPlaces={draft.route.addedPlaces}
              onToggleStop={handleToggleStop}
              onMapClickAdd={handleMapClickAdd}
            />
          </div>
        </div>
      </div>

      {/* Add Served Place Dialog */}
      {showAddPlace && (
        <AddServedPlaceDialog
          stops={activeStops}
          onClose={() => {
            setShowAddPlace(false);
            setInitialAddCoords(null);
          }}
          onAdd={(place) => {
            if (initialAddCoords && !place.coordinates) {
              place.coordinates = initialAddCoords;
            }
            patchRoute({ addedPlaces: [...draft.route.addedPlaces, place] });
            setShowAddPlace(false);
            setInitialAddCoords(null);
          }}
        />
      )}
    </div>
  );
}

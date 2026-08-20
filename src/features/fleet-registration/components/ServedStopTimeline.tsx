"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Lock,
  MapPin,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import StopMeetingEditor from "./StopMeetingEditor";
import type { FleetRouteStop, FleetServedStop, StopUsage } from "../route-types";

const EMPTY_DETAILS = {
  displayName: "",
  counterNumber: "",
  contactName: "",
  contactPhone: "",
  reportingInstructions: "",
};

export function defaultServedStops(stops: FleetRouteStop[]): FleetServedStop[] {
  return stops.map((s, idx) => ({
    stopId: s.id,
    name: s.name,
    sequence: s.sequence || idx + 1,
    usage: (idx === 0 ? "PICKUP" : idx === stops.length - 1 ? "DROP" : "BOTH") as StopUsage,
    boardingMode: "STOP_FALLBACK",
    boardingLocationIds: [],
    customBoardingPoints: [],
    meetingDetails: { ...EMPTY_DETAILS },
  }));
}

export default function ServedStopTimeline({
  stops,
  value,
  onChange,
}: {
  stops: FleetRouteStop[];
  value: FleetServedStop[];
  onChange: (next: FleetServedStop[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"ALL" | "SERVED" | "UNSERVED">("ALL");

  const byId = useMemo(() => {
    const map = new Map<string, FleetServedStop>();
    for (const item of value) {
      map.set(item.stopId, item);
      if (item.name) {
        map.set(`name:${item.name.toLowerCase().trim()}`, item);
      }
    }
    return map;
  }, [value]);

  function getServed(stop: FleetRouteStop): FleetServedStop | undefined {
    return byId.get(stop.id) || (stop.name ? byId.get(`name:${stop.name.toLowerCase().trim()}`) : undefined);
  }

  function replace(next: FleetServedStop) {
    onChange(
      value
        .map((item) => (item.stopId === next.stopId ? next : item))
        .sort((a, b) => a.sequence - b.sequence)
    );
  }

  function addStop(stop: FleetRouteStop) {
    if (getServed(stop)) return;
    const next: FleetServedStop = {
      stopId: stop.id,
      name: stop.name,
      sequence: stop.sequence || value.length + 1,
      usage: "BOTH",
      boardingMode: "STOP_FALLBACK",
      boardingLocationIds: [],
      customBoardingPoints: [],
      meetingDetails: { ...EMPTY_DETAILS },
    };
    onChange([...value, next].sort((a, b) => a.sequence - b.sequence));
  }

  function removeStop(stop: FleetRouteStop) {
    if (stops.length > 0 && (stop.id === stops[0].id || stop.id === stops.at(-1)?.id)) return;
    const stopNameNorm = (stop.name || "").toLowerCase().trim();
    onChange(
      value.filter(
        (item) => item.stopId !== stop.id && (!stopNameNorm || (item.name || "").toLowerCase().trim() !== stopNameNorm)
      )
    );
    if (editingId === stop.id) setEditingId(null);
  }

  function toggle(stop: FleetRouteStop) {
    if (getServed(stop)) {
      removeStop(stop);
    } else {
      addStop(stop);
    }
  }

  function setUsage(item: FleetServedStop, usage: StopUsage) {
    replace({ ...item, usage });
  }

  function handleServeAll() {
    const allServed = stops.map((stop, idx) => {
      const existing = byId.get(stop.id);
      if (existing) return existing;
      const isOrigin = idx === 0;
      const isDestination = idx === stops.length - 1;
      return {
        stopId: stop.id,
        name: stop.name,
        sequence: stop.sequence || idx + 1,
        usage: (isOrigin ? "PICKUP" : isDestination ? "DROP" : "BOTH") as StopUsage,
        boardingMode: "STOP_FALLBACK" as const,
        boardingLocationIds: [],
        customBoardingPoints: [],
        meetingDetails: { ...EMPTY_DETAILS },
      };
    });
    onChange(allServed.sort((a, b) => a.sequence - b.sequence));
  }

  function handleResetToTerminals() {
    onChange(defaultServedStops(stops));
    setEditingId(null);
  }

  // Filtered stops based on search query and active tab
  const visibleStops = useMemo(() => {
    return stops.filter((stop) => {
      const isServed = Boolean(byId.get(stop.id) || (stop.name ? byId.get(`name:${stop.name.toLowerCase().trim()}`) : undefined));
      if (filterTab === "SERVED" && !isServed) return false;
      if (filterTab === "UNSERVED" && isServed) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = stop.name.toLowerCase().includes(q);
        const matchesDistrict = (stop.district || "").toLowerCase().includes(q);
        return matchesName || matchesDistrict;
      }
      return true;
    });
  }, [stops, byId, filterTab, searchQuery]);

  return (
    <section className="space-y-3.5">
      {/* Header & Summary */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h5 className="text-sm font-black text-[#211D1A]">Highway Stops &amp; Counter Setup</h5>
          <p className="text-xs text-[#7D756E]">
            Add or remove stops your bus serves directly below or from the map.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F8F1E3] px-3 py-1 text-xs font-black text-[#7A1D1B] border border-[#ECD9BD] shadow-2xs">
            <CheckCircle2 className="size-3.5 text-[#7A1D1B]" />
            {value.length} of {stops.length} Stops Served
          </span>
        </div>
      </div>

      {/* Quick Filter, Search & Bulk Actions Bar */}
      <div className="flex flex-col gap-2.5 rounded-2xl border border-[#E3DBD4] bg-[#FAF8F5] p-3 sm:flex-row sm:flex-wrap lg:flex-nowrap sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#8C847D]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stops along highway…"
            className="h-9 w-full rounded-xl border border-[#E0D8D0] bg-white pl-9 pr-8 text-xs font-medium text-[#211D1A] outline-none placeholder:text-[#9A9188] transition focus:border-[#7A1D1B] focus:ring-1 focus:ring-[#7A1D1B]/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C847D] hover:text-[#211D1A]"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterTab("ALL")}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
              filterTab === "ALL"
                ? "bg-[#7A1D1B] text-white shadow-xs"
                : "text-[#6B635B] hover:bg-white hover:text-[#211D1A]"
            }`}
          >
            All ({stops.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("SERVED")}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
              filterTab === "SERVED"
                ? "bg-[#7A1D1B] text-white shadow-xs"
                : "text-[#6B635B] hover:bg-white hover:text-[#211D1A]"
            }`}
          >
            Served ({value.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("UNSERVED")}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
              filterTab === "UNSERVED"
                ? "bg-[#7A1D1B] text-white shadow-xs"
                : "text-[#6B635B] hover:bg-white hover:text-[#211D1A]"
            }`}
          >
            Unserved ({Math.max(0, stops.length - value.length)})
          </button>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleServeAll}
            className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-[#7A1D1B] border border-[#E0D8D0] shadow-2xs transition hover:bg-[#FFF4F1] hover:border-[#7A1D1B]"
          >
            + Serve All
          </button>
          <button
            type="button"
            onClick={handleResetToTerminals}
            className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-[#6D655E] border border-[#E0D8D0] shadow-2xs transition hover:bg-[#F3ECE5]"
          >
            Terminals Only
          </button>
        </div>
      </div>

      {/* Stop Collection List */}
      <div className="space-y-3">
        {visibleStops.length === 0 ? (
          <div className="rounded-2xl border border-[#E3DBD4] bg-white p-10 text-center shadow-xs">
            <p className="text-sm font-bold text-[#756E67]">No matching stops found.</p>
            <p className="mt-1 text-xs text-[#9E958D]">
              Try searching with a different town name or clear your filters.
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#FAF8F5] px-3.5 py-1.5 text-xs font-black text-[#7A1D1B] border border-[#E0D8D0] hover:bg-[#FFF4F1]"
              >
                Clear search query
              </button>
            )}
          </div>
        ) : (
          visibleStops.map((stop) => {
            const selected = getServed(stop);
            const isOrigin = stop.id === stops[0]?.id || stop.sequence === 1;
            const isDestination = stop.id === stops.at(-1)?.id || stop.sequence === stops.length;
            const locked = isOrigin || isDestination;
            const customCount = selected?.customBoardingPoints?.length || 0;
            const canonicalCount = selected?.boardingLocationIds?.length || 0;
            const totalMeetingCount = customCount + canonicalCount;

            return (
              <div
                key={stop.id}
                className={`overflow-hidden rounded-2xl border transition-all ${
                  selected
                    ? "border-[#DED5CC] bg-white shadow-xs"
                    : "border-[#EBE4DD] bg-[#FAF8F5]/60 opacity-85 hover:border-[#D8CEC4] hover:opacity-100 hover:bg-white"
                }`}
              >
                {/* Main Stop Summary Row */}
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left: Sequence Pin + Stop Names + District Tags */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => toggle(stop)}
                      disabled={locked}
                      className={`flex size-9 shrink-0 items-center justify-center rounded-xl border text-xs font-black transition ${
                        isOrigin || isDestination
                          ? "border-[#C99A4A] bg-[#7A1D1B] text-[#C99A4A] shadow-xs"
                          : selected
                          ? "border-[#7A1D1B] bg-[#7A1D1B] text-white shadow-xs"
                          : "border-[#D5CCC3] bg-white text-[#787068] hover:border-[#7A1D1B] hover:text-[#7A1D1B]"
                      } ${locked ? "cursor-default" : "cursor-pointer"}`}
                      title={locked ? "Mandatory endpoint" : selected ? "Remove stop" : "Serve stop"}
                    >
                      {isOrigin ? "A" : isDestination ? "B" : selected ? <Check className="size-4" /> : stop.sequence}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black text-[#211D1A] tracking-tight">{stop.name}</p>
                        {isOrigin && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#FFF4F1] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#7A1D1B] border border-[#F0A09B]">
                            <Lock className="size-2.5" /> Origin
                          </span>
                        )}
                        {isDestination && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#F4FAF5] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-emerald-800 border border-[#B8E0C4]">
                            <Lock className="size-2.5" /> Destination
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] font-medium text-[#837B73]">
                        {[stop.district, stop.province].filter(Boolean).join(", ") ||
                          (stop.distanceFromOriginKm != null
                            ? `${stop.distanceFromOriginKm} km · ~${stop.durationFromOriginMins || 0} mins from origin`
                            : "Highway Waypoint")}
                      </p>
                    </div>
                  </div>

                  {/* Right: Usage Switcher (Pickup/Drop/Both) + Direct Action */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    {selected ? (
                      <>
                        {/* Segmented Usage Toggle */}
                        <div className="flex rounded-xl bg-[#F3EFEB] p-0.5 border border-[#E0D7CE]">
                          {(["PICKUP", "DROP", "BOTH"] as StopUsage[]).map((usage) => (
                            <button
                              key={usage}
                              type="button"
                              onClick={() => setUsage(selected, usage)}
                              className={`rounded-lg px-2.5 py-1 text-[10px] font-black tracking-wide transition ${
                                selected.usage === usage
                                  ? "bg-white text-[#7A1D1B] shadow-xs"
                                  : "text-[#7D756E] hover:text-[#211D1A]"
                              }`}
                            >
                              {usage === "PICKUP" ? "Pickup" : usage === "DROP" ? "Drop" : "Both"}
                            </button>
                          ))}
                        </div>

                        {/* Remove Action (for non-terminals) */}
                        {!locked && (
                          <button
                            type="button"
                            onClick={() => removeStop(stop)}
                            className="flex size-8 items-center justify-center rounded-xl text-[#948B83] border border-transparent transition hover:border-[#F0A09B] hover:bg-[#FBEAE8] hover:text-red-700"
                            title="Remove from served stops"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </>
                    ) : (
                      /* Direct "Add Stop to Route" Button */
                      <button
                        type="button"
                        onClick={() => addStop(stop)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#D5CCC3] bg-white px-3.5 py-1.5 text-xs font-black text-[#7A1D1B] shadow-2xs transition hover:border-[#7A1D1B] hover:bg-[#FFF4F1] active:scale-95"
                      >
                        <Plus className="size-3.5 text-[#7A1D1B]" />
                        Serve this stop
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Counter & Boarding Config Bar for Served Stops */}
                {selected && (
                  <div className="border-t border-[#F2ECE6] bg-[#FAF8F5]/80 px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => setEditingId(editingId === stop.id ? null : stop.id)}
                      className={`group flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        editingId === stop.id
                          ? "bg-[#FFF4F1] text-[#7A1D1B] border border-[#F0A09B]"
                          : "bg-white text-[#5D554E] border border-[#E5DDD5] hover:border-[#7A1D1B] hover:text-[#7A1D1B] shadow-2xs"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="size-3.5 shrink-0 text-[#7A1D1B]" />
                        <span className="truncate">
                          {totalMeetingCount === 0 ? (
                            <span className="text-[#7A1D1B] font-extrabold">
                              + Set up Ticket Counter / Boarding Points at {stop.name}
                            </span>
                          ) : (
                            <span>
                              <strong>{totalMeetingCount}</strong> Boarding Location
                              {totalMeetingCount === 1 ? "" : "s"} &amp; Counters Configured
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                        <span className="text-[#8D847B] group-hover:text-[#7A1D1B]">
                          {editingId === stop.id ? "Hide details" : "Configure"}
                        </span>
                        <ChevronDown
                          className={`size-3.5 transition-transform duration-200 ${
                            editingId === stop.id ? "rotate-180 text-[#7A1D1B]" : "text-[#8D847B]"
                          }`}
                        />
                      </div>
                    </button>

                    {editingId === stop.id && (
                      <div className="mt-3">
                        <StopMeetingEditor
                          stop={stop}
                          value={selected}
                          onChange={replace}
                          onClose={() => setEditingId(null)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

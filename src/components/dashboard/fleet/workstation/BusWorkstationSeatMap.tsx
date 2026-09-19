"use client";

import React, { useMemo, useState } from "react";
import { DoorClosed, Layers } from "lucide-react";
import type { LayoutElement, SeatLayoutV3 } from "@/features/seat-layout-v3/types";
import type { TripSeatControl } from "@/features/trip-seat-controls/types";
import type { TripManifest } from "@/features/owner-workspace/api";
import { BusWorkstationSeatCard } from "./BusWorkstationSeatCard";
import { SteeringWheelIcon, generateFallbackLayout, findAisleColumns } from "./seat-map-helpers";

interface BusWorkstationSeatMapProps {
  layout?: SeatLayoutV3 | null;
  control?: TripSeatControl | null;
  totalSeats: number;
  ticketsSold?: number;
  manifest?: TripManifest | null;
  tripFare?: number | null;
}

export function BusWorkstationSeatMap({
  layout,
  control,
  totalSeats,
  ticketsSold = 0,
  manifest,
  tripFare,
}: BusWorkstationSeatMapProps) {
  const [selectedElement, setSelectedElement] = useState<LayoutElement | null>(null);

  // 1. Resolve active layout: priority = trip snapshot control -> fleet layout -> fallback
  const activeLayout = useMemo<SeatLayoutV3>(() => {
    if (control?.layout?.sections && control.layout.sections.length > 0) return control.layout;
    if (layout?.sections && layout.sections.length > 0) return layout;
    return generateFallbackLayout(totalSeats > 0 ? totalSeats : 21);
  }, [control?.layout, layout, totalSeats]);

  const [activeSectionId, setActiveSectionId] = useState<string>(() => activeLayout.sections[0]?.sectionId || "lower");
  const section = activeLayout.sections.find((s) => s.sectionId === activeSectionId) || activeLayout.sections[0];

  // 2. Extract booked seats from live passenger manifest
  const bookedSeatMap = useMemo(() => {
    const map = new Map<string, { passengerName?: string; ticketId?: string }>();
    if (manifest?.items) {
      for (const item of manifest.items) {
        for (const seatNo of item.seats) {
          const norm = seatNo.toUpperCase().trim();
          const p = item.passengerDetails?.find((pd) => pd.seatNo.toUpperCase().trim() === norm);
          map.set(norm, { passengerName: p?.name, ticketId: item.ticketId });
        }
      }
    }
    return map;
  }, [manifest]);

  // 3. Map element open/withdrawn states & overrides from control
  const placeStateMap = useMemo(() => {
    const map = new Map<string, "OPEN" | "WITHDRAWN">();
    if (control?.places) {
      for (const p of control.places) map.set(p.elementId, p.state);
    }
    return map;
  }, [control]);

  const pricingOverrideMap = useMemo(() => {
    const map = new Map<string, number>();
    if (control?.pricing?.overrides) {
      for (const o of control.pricing.overrides) map.set(o.elementId, o.fare);
    }
    return map;
  }, [control]);

  const defaultFare = control?.pricing?.defaultFare ?? tripFare ?? null;

  // 4. Calculate metrics across all sections
  const allPlaces = useMemo(() => {
    return activeLayout.sections.flatMap((s) => s.elements).filter((el) => el.kind === "SEAT" || el.kind === "BERTH");
  }, [activeLayout]);

  const metrics = useMemo(() => {
    let booked = 0;
    let open = 0;
    let withdrawn = 0;

    allPlaces.forEach((el, idx) => {
      const labelKey = (el.label || "").toUpperCase().trim();
      const isBooked = bookedSeatMap.has(labelKey) || (bookedSeatMap.size === 0 && idx < ticketsSold);
      const isWithdrawn = placeStateMap.get(el.elementId) === "WITHDRAWN";

      if (isBooked) booked++;
      else if (isWithdrawn) withdrawn++;
      else open++;
    });

    return { total: allPlaces.length, booked, open, withdrawn };
  }, [allPlaces, bookedSeatMap, placeStateMap, ticketsSold]);

  const aisleColumns = useMemo(() => findAisleColumns(section), [section]);

  if (!section) return null;
  const isUpperDeck = section.role.includes("UPPER");

  return (
    <div className="space-y-3.5 select-none">
      {/* ── Operational Capacity & Pricing Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E6F4EA] text-[#065F46] font-bold">
            <span className="size-1.5 rounded-full bg-[#065F46]" />
            {metrics.open} Open to sell
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFF5F4] text-[#7A1D1B] font-bold border border-[#F8C9C7]">
            <span className="size-1.5 rounded-full bg-[#7A1D1B]" />
            {metrics.booked} Booked
          </span>
          {metrics.withdrawn > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F0ECE7] text-[#746E69] font-medium">
              {metrics.withdrawn} Held
            </span>
          )}
        </div>
        {defaultFare !== null && defaultFare !== undefined && defaultFare > 0 && (
          <span className="text-[#554E48] font-bold">
            Base Fare: <strong className="text-[#191512]">NPR {defaultFare.toLocaleString()}</strong>
          </span>
        )}
      </div>

      {/* ── Multi-deck switcher (if double deck) ── */}
      {activeLayout.sections.length > 1 && (
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#FAF8F5] border border-[#EDE7E0]">
          {activeLayout.sections.map((s) => (
            <button
              key={s.sectionId}
              type="button"
              onClick={() => setActiveSectionId(s.sectionId)}
              className={`flex-1 py-1 text-xs font-bold rounded-lg transition ${
                activeSectionId === s.sectionId ? "bg-white text-[#7A1D1B] shadow-2xs" : "text-[#746E69]"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Authentic Bus Body Frame ── */}
      <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[370px]">
        {/* Side Mirrors */}
        {!isUpperDeck && (
          <>
            <div className="absolute -left-2 top-6 z-20 h-7 w-2 rounded-l-md bg-[#B8B2AA] border border-[#A69F97] shadow-2xs" />
            <div className="absolute -right-2 top-6 z-20 h-7 w-2 rounded-r-md bg-[#B8B2AA] border border-[#A69F97] shadow-2xs" />
          </>
        )}

        {/* Bus Coach Shell */}
        <div className="overflow-hidden rounded-[26px] border-2 border-[#D5CEC5] bg-white shadow-md">
          {/* Front Cockpit */}
          <div className="border-b border-[#E8E3DC] bg-[#FAF8F5] px-4 py-2.5">
            <div className="flex items-center justify-between">
              {!isUpperDeck ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <div className="flex size-7 items-center justify-center rounded-lg border border-[#E0D8CE] bg-white text-[#7A1D1B]">
                      <DoorClosed className="size-3.5" />
                    </div>
                    <span className="text-xs font-bold text-[#3E3832]">Entry</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#3E3832]">Driver</span>
                    <div className="flex size-7 items-center justify-center rounded-lg border border-[#F0D4D4] bg-[#FDF0F0] text-[#7A1D1B]">
                      <SteeringWheelIcon className="size-3.5" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex w-full items-center justify-center gap-1 text-xs font-bold text-[#655E58]">
                  <Layers className="size-3.5 text-[#7A1D1B]" />
                  <span>Upper Deck Cabin</span>
                </div>
              )}
            </div>
          </div>

          {/* Passenger Cabin Seating Grid */}
          <div className="p-3 sm:p-4 bg-white">
            <div
              className="relative grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${section.widthUnits}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${section.heightUnits}, minmax(46px, 50px))`,
              }}
            >
              {/* Dashed Center Aisle */}
              {aisleColumns.map((col) => (
                <div
                  key={`aisle-${col}`}
                  className="pointer-events-none z-0 flex items-center justify-center"
                  style={{ gridColumn: `${col + 1} / span 1`, gridRow: `1 / span ${section.heightUnits}` }}
                >
                  <div className="h-full w-0 border-l-2 border-dashed border-[#E5E0D8]" />
                </div>
              ))}

              {/* Passenger Seats & Berths */}
              {section.elements.map((el, idx) => {
                if (el.kind !== "SEAT" && el.kind !== "BERTH") return null;
                const normLabel = (el.label || "").toUpperCase().trim();
                const booking = bookedSeatMap.get(normLabel);
                const isBooked = booking !== undefined || (bookedSeatMap.size === 0 && idx < ticketsSold);
                const isOpenToSell = placeStateMap.get(el.elementId) !== "WITHDRAWN";
                const fare = pricingOverrideMap.get(el.elementId) ?? defaultFare;

                return (
                  <BusWorkstationSeatCard
                    key={el.elementId}
                    element={el}
                    isBooked={isBooked}
                    isOpenToSell={isOpenToSell}
                    passengerName={booking?.passengerName}
                    ticketId={booking?.ticketId}
                    fare={fare}
                    isSelected={selectedElement?.elementId === el.elementId}
                    onSelect={setSelectedElement}
                  />
                );
              })}
            </div>
          </div>

          {/* Bus Rear Bumper */}
          <div className="h-3 rounded-b-[24px] bg-[#FAF8F5] border-t border-[#E8E3DC]" />
        </div>
      </div>
    </div>
  );
}

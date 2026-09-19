"use client";

import React from "react";
import { Route, Clock, Users, SlidersHorizontal, User, Phone } from "lucide-react";
import type { OwnerTrip, TripSeatControl } from "@/features/trip-seat-controls/types";

import type { SeatLayoutV3 } from "@/features/seat-layout-v3/types";
import type { TripManifest } from "@/features/owner-workspace/api";
import { BusWorkstationSeatMap } from "./BusWorkstationSeatMap";

interface BusWorkstationDrawerDetailsTabProps {
  trip: OwnerTrip;
  totalSeats: number;
  fallbackRouteText?: string;
  layout?: SeatLayoutV3 | null;
  control?: TripSeatControl | null;
  manifest?: TripManifest | null;
  onSwitchToManifest: () => void;
  onManageService: (tripId: string) => void;
}

function extractPhone(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === "string") return /^[+0-9\s-]{7,16}$/.test(val.trim()) ? val.trim() : null;
  if (typeof val === "object") {
    const o = val as Record<string, unknown>;
    const p = o.phone || o.phoneNumber || (o.profile as Record<string, unknown> | undefined)?.phone;
    return typeof p === "string" && p.trim() ? p.trim() : null;
  }
  return null;
}

export function BusWorkstationDrawerDetailsTab({
  trip,
  totalSeats,
  fallbackRouteText,
  layout,
  control,
  manifest,
  onSwitchToManifest,
  onManageService,
}: BusWorkstationDrawerDetailsTabProps) {
  const booked = trip.ticketsSold || 0;
  const capacity = totalSeats > 0 ? totalSeats : 21;

  const driverPhone = extractPhone(trip.driverId);
  const conductorPhone = extractPhone(trip.conductorId);
  const effectiveTripFare =
    trip.tripFare ??
    trip.routeId?.basePrice ??
    manifest?.trip?.tripFare ??
    manifest?.trip?.routeId?.basePrice ??
    null;

  return (
    <div className="space-y-4">
      {/* Route & Timings Bar */}
      <div className="rounded-2xl bg-[#FAF8F5] border border-[#EDE7E0] p-3.5 space-y-1.5">
        <div className="flex items-center gap-2">
          <Route className="size-4 text-[#7A1D1B] shrink-0" />
          <h4 className="text-sm font-bold text-[#191512]">
            {trip.directionLabel || fallbackRouteText || "Corridor Route"}
          </h4>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#554E48]">
          <span className="font-mono font-bold text-[#191512]">
            {trip.departureTime}
          </span>
          <span className="text-[#746E69]">
            {trip.tripDate ? trip.tripDate.slice(0, 10) : "Upcoming"}
          </span>
        </div>
      </div>

      {/* Active Bus Seat Map with Booked Markings */}
      <BusWorkstationSeatMap
        layout={layout}
        control={control}
        totalSeats={capacity}
        ticketsSold={booked}
        manifest={manifest}
        tripFare={effectiveTripFare}
      />

      {/* Crew Info if present */}
      {(trip.driverName || trip.conductorName) && (
        <div className="rounded-2xl border border-[#EDE7E0] bg-[#FAF8F5]/60 p-4 space-y-2 text-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#746E69]">
            Assigned Crew
          </span>
          {trip.driverName && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#554E48]">
                <User className="size-3.5 text-[#7A1D1B]" />
                Driver: <strong className="text-[#191512]">{trip.driverName}</strong>
              </span>
              {driverPhone && (
                <span className="text-[#746E69] flex items-center gap-1">
                  <Phone className="size-3" />
                  {driverPhone}
                </span>
              )}
            </div>
          )}
          {trip.conductorName && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#554E48]">
                <Users className="size-3.5 text-[#7A1D1B]" />
                Conductor: <strong className="text-[#191512]">{trip.conductorName}</strong>
              </span>
              {conductorPhone && (
                <span className="text-[#746E69] flex items-center gap-1">
                  <Phone className="size-3" />
                  {conductorPhone}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2.5 pt-2">
        <button
          type="button"
          onClick={onSwitchToManifest}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-[#EDE7E0] text-[#191512] hover:bg-[#FAF8F5] transition shadow-2xs cursor-pointer"
        >
          <Users className="size-3.5 text-[#7A1D1B]" />
          <span>View Manifest</span>
        </button>
        <button
          type="button"
          onClick={() => onManageService(trip._id)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#7A1D1B] text-white hover:bg-[#5C1414] transition shadow-2xs cursor-pointer"
        >
          <SlidersHorizontal className="size-3.5" />
          <span>Manage Service</span>
        </button>
      </div>
    </div>
  );
}

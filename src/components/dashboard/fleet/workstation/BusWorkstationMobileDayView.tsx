"use client";

import React from "react";
import { Route, Clock, Users, SlidersHorizontal } from "lucide-react";
import type { OwnerTrip } from "@/features/trip-seat-controls/types";
import { isPastTrip } from "./calendar-helpers";

interface BusWorkstationMobileDayViewProps {
  dateStr: string;
  trips: OwnerTrip[];
  totalSeats: number;
  fallbackRouteText?: string;
  onSelectTrip?: (trip: OwnerTrip) => void;
  onOpenManifest: (tripId: string) => void;
  onManageService: (tripId: string) => void;
}

export function BusWorkstationMobileDayView({
  dateStr,
  trips,
  totalSeats,
  fallbackRouteText,
  onSelectTrip,
  onOpenManifest,
  onManageService,
}: BusWorkstationMobileDayViewProps) {
  return (
    <div className="sm:hidden rounded-2xl bg-white border border-[#EDE7E0] p-4 shadow-2xs space-y-3">
      <div className="border-b border-[#EDE7E0] pb-2.5 space-y-0.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#746E69]">Departures for</span>
        <h4 className="text-sm sm:text-base font-black text-[#191512]">
          {dateStr}
        </h4>
        <p className="text-[11px] text-[#746E69]">
          {trips.length} {trips.length === 1 ? "departure scheduled" : "departures scheduled"}
        </p>
      </div>

      {trips.length === 0 ? (
        <p className="text-xs text-[#746E69] py-3 text-center">
          No departures on this date.
        </p>
      ) : (
        <div className="space-y-2.5">
          {trips.map((trip) => {
            const label = trip.directionLabel || fallbackRouteText || "Corridor Route";
            const isLive = ["in-transit", "boarding"].includes((trip.status || "").toLowerCase());
            const isPast = isPastTrip(trip.tripDate, trip.departureTime, trip.status);

            return (
              <div
                key={trip._id}
                onClick={() => onSelectTrip?.(trip)}
                className="rounded-xl border border-[#EDE7E0] bg-[#FAF8F5]/80 hover:bg-[#F5EFEA] p-3 space-y-2 cursor-pointer transition-colors shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-[#7A1D1B]" />
                    <span className="font-mono font-bold text-sm text-[#191512]">
                      {trip.departureTime}
                    </span>
                  </div>
                  {isLive && (
                    <span className="text-[10px] font-bold uppercase bg-[#ECFDF5] text-[#065F46] px-2 py-0.5 rounded-md border border-[#A7F3D0]">
                      Live
                    </span>
                  )}
                  {isPast && (
                    <span className="text-[10px] font-bold uppercase text-[#746E69] bg-[#EDE7E0]/60 px-1.5 py-0.5 rounded border border-[#D5CDC5] tracking-wider">
                      Departed
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[#554E48]">
                  <Route className="size-3 text-[#7A1D1B] shrink-0" />
                  <span className="font-bold text-[#191512] truncate">{label}</span>
                </div>

                <div className="text-[11px] text-[#746E69]">
                  Seats booked: <strong className="text-[#191512]">{trip.ticketsSold || 0}</strong> / {totalSeats}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#EDE7E0]/70" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onOpenManifest(trip._id)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white border border-[#EDE7E0] text-[#191512] hover:bg-[#FAF8F5] transition shadow-2xs cursor-pointer"
                  >
                    <Users className="size-3.5 text-[#7A1D1B]" />
                    <span>View Manifest</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onManageService(trip._id)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#7A1D1B] text-white hover:bg-[#5C1414] transition shadow-2xs cursor-pointer"
                  >
                    <SlidersHorizontal className="size-3.5" />
                    <span>Manage Service</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import type { OwnerTrip } from "./types";
import { Bus, Clock } from "lucide-react";

const routeName = (trip: OwnerTrip) =>
  trip.routeSnapshot?.routeVersion?.name ||
  trip.routeId?.routeName ||
  [trip.routeId?.fromCity, trip.routeId?.toCity].filter(Boolean).join(" → ") ||
  "Scheduled route";

export default function TripList({
  trips,
  selectedId,
  onSelect,
}: {
  trips: OwnerTrip[];
  selectedId?: string;
  onSelect: (trip: OwnerTrip) => void;
}) {
  return (
    <aside className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-2xs space-y-2">
      <div className="flex items-center justify-between px-2 py-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
          Departures ({trips.length})
        </p>
      </div>

      <div className="space-y-2">
        {trips.map((trip) => {
          const isSelected = selectedId === trip._id;
          const formattedDate = trip.tripDate
            ? new Date(trip.tripDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : "";

          return (
            <button
              key={trip._id}
              type="button"
              onClick={() => onSelect(trip)}
              className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                isSelected
                  ? "border-[#7A1D1B] bg-[#FDFAF6] shadow-2xs"
                  : "border-neutral-200/80 bg-white hover:border-neutral-300 hover:bg-neutral-50/60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-bold text-neutral-900 line-clamp-1">
                  {routeName(trip)}
                </p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize flex-shrink-0 ${
                    trip.status === "scheduled"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                      : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                  }`}
                >
                  {trip.status}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-3 text-[11px] text-neutral-500">
                <span className="inline-flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  {formattedDate} · {trip.departureTime}
                </span>
              </div>

              <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
                <span className="inline-flex items-center gap-1 font-mono font-medium truncate text-neutral-700">
                  <Bus className="w-3 h-3 text-neutral-400" />
                  {trip.busId?.busNumber || trip.busId?.busName || "Assigned bus"}
                </span>
                {typeof trip.tripFare === "number" && (
                  <span className="font-semibold text-neutral-900">
                    NPR {trip.tripFare.toLocaleString()}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

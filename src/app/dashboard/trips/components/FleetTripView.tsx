"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Bus,
  RefreshCw,
  ChevronDown,
  ExternalLink,
  Clock,
  Users,
  X,
  Calendar,
} from "lucide-react";
import type { OwnerTrip } from "@/features/trip-seat-controls/types";
import {
  fmtDate,
  fmtCurrency,
  getDirection,
  getBrandName,
  groupByBus,
} from "./fleet-trip-grouping";

// ── Status Badge ─────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status?: string }) {
  const s = (status || "scheduled").toLowerCase();
  let style = "bg-neutral-100 text-neutral-600 border-neutral-200";

  if (s === "scheduled") {
    style = "bg-emerald-50 text-emerald-800 border-emerald-200";
  } else if (s === "boarding") {
    style = "bg-blue-50 text-blue-800 border-blue-200";
  } else if (s === "in-transit") {
    style = "bg-purple-50 text-purple-800 border-purple-200";
  } else if (s === "completed") {
    style = "bg-neutral-100 text-neutral-700 border-neutral-200";
  } else if (s === "cancelled") {
    style = "bg-rose-50 text-rose-800 border-rose-200";
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style}`}
    >
      {s.replace("-", " ")}
    </span>
  );
}

// ── Trip Details Modal ────────────────────────────────────────────────────────

interface TripDetailsModalProps {
  trip: OwnerTrip;
  onClose: () => void;
  onManageLiveService: (trip: OwnerTrip) => void;
}

export function TripDetailsModal({
  trip,
  onClose,
  onManageLiveService,
}: TripDetailsModalProps) {
  const tripDateIso = trip.tripDate ? trip.tripDate.slice(0, 10) : "";
  const direction = getDirection(trip);
  const busName = trip.busId?.busName || trip.busId?.busNumber || "Assigned bus";
  const busNum = trip.busId?.busNumber || "";
  const totalSeats = trip.busId?.totalSeats || 0;
  const sold = trip.ticketsSold || trip.occupiedPlaces || 0;
  const occPct =
    totalSeats > 0 ? Math.round((sold / totalSeats) * 100) : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trip-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#EDE7E0] bg-white p-6 sm:p-7 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#EDE7E0] pb-4">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#7A1D1B]">
              Trip details
            </p>
            <h2
              id="trip-modal-title"
              className="text-lg sm:text-xl font-black text-[#111111]"
            >
              {direction}
            </h2>
            <p className="text-xs text-[#554E48]">
              {fmtDate(trip.tripDate)} · {trip.departureTime}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[#746E69] transition hover:bg-[#FAF8F5] hover:text-[#111111]"
            aria-label="Close details"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Metrics & Info */}
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[#EDE7E0] bg-[#FAF8F5] p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#746E69]">
                Status
              </p>
              <div className="mt-1.5">
                <StatusBadge status={trip.status} />
              </div>
            </div>
            <div className="rounded-2xl border border-[#EDE7E0] bg-[#FAF8F5] p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#746E69]">
                Occupancy
              </p>
              <p className="mt-1 text-sm font-bold text-[#111111]">
                {sold} / {totalSeats || "—"}{" "}
                <span className="text-xs font-semibold text-[#554E48]">
                  ({occPct}%)
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-[#EDE7E0] bg-[#FAF8F5] p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#746E69]">
                Revenue
              </p>
              <p className="mt-1 text-sm font-bold text-[#111111]">
                {fmtCurrency(trip.totalRevenue)}
              </p>
            </div>
            <div className="rounded-2xl border border-[#EDE7E0] bg-[#FAF8F5] p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#746E69]">
                Vehicle
              </p>
              <p className="mt-1 text-xs font-bold text-[#111111] truncate">
                {busName} {busNum && busNum !== busName ? `(${busNum})` : ""}
              </p>
            </div>
          </div>

          {typeof trip.tripFare === "number" && (
            <div className="rounded-2xl border border-[#EDE7E0] bg-white p-3.5 text-xs text-[#554E48] flex justify-between items-center">
              <span>Standard ticket fare:</span>
              <span className="font-bold text-[#111111]">
                {fmtCurrency(trip.tripFare)}
              </span>
            </div>
          )}

          <p className="text-[11px] text-[#746E69]">
            Values reflect active passenger reservations recorded in Nepal. Use
            Manage live service to inspect date scope and passenger impact
            before making service adjustments.
          </p>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 border-t border-[#EDE7E0] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#DCD5CD] bg-white px-4 py-2 text-xs font-semibold text-[#191512] transition hover:bg-[#FAF8F5] active:scale-[0.98]"
          >
            Done
          </button>
          <Link
            href={`/dashboard/bookings?tripId=${trip._id}&from=${tripDateIso}&to=${tripDateIso}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#7A1D1B] bg-white px-4 py-2 text-xs font-bold text-[#7A1D1B] transition hover:bg-[#7A1D1B]/5 active:scale-[0.98]"
          >
            <Users className="size-3.5" />
            <span>Bookings & manifest</span>
          </Link>
          <button
            type="button"
            disabled={trip.status !== "scheduled"}
            onClick={() => {
              onClose();
              onManageLiveService(trip);
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#7A1D1B] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#641715] active:scale-[0.98] disabled:opacity-40"
          >
            <span>Manage live service</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Single Bus Card ──────────────────────────────────────────────────────────

interface BusAccordionGroupProps {
  busId: string;
  trips: OwnerTrip[];
  onOpenDetails: (trip: OwnerTrip) => void;
}

export function BusAccordionGroup({
  busId: _busId,
  trips,
  onOpenDetails,
}: BusAccordionGroupProps) {
  const [open, setOpen] = useState(false);

  const ref = trips[0];
  const busName = ref.busId?.busName || ref.busId?.busNumber || "Assigned Bus";
  const busNum = ref.busId?.busNumber || "";
  const route = getDirection(ref);
  const brand = getBrandName(ref);
  const departs = ref.departureTime;
  const totalSeats = ref.busId?.totalSeats || 0;

  // Aggregate stats across trips
  const totalTrips = trips.length;
  const totalRevenue = trips.reduce((s, t) => s + (t.totalRevenue || 0), 0);
  const totalSold = trips.reduce(
    (s, t) => s + (t.ticketsSold || t.occupiedPlaces || 0),
    0
  );
  const avgOcc =
    totalSeats > 0 && totalTrips > 0
      ? Math.round((totalSold / (totalSeats * totalTrips)) * 100)
      : 0;

  // Today's departure (or closest upcoming)
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayTrip =
    trips.find((t) => t.tripDate?.slice(0, 10) === todayIso) ??
    trips.find((t) => (t.tripDate?.slice(0, 10) || "") >= todayIso) ??
    trips[0];

  const fleetWorkstationId = ref.busId?._id;

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#EDE7E0] bg-white shadow-xs hover:border-[#DCD5CD] transition-all overflow-hidden">
      {/* Bus Header Card Summary */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((prev) => !prev);
          }
        }}
        className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 hover:bg-[#FAF8F5]/50 transition-colors cursor-pointer text-left select-none"
      >
        {/* Left Side: Bus Identification & Route */}
        <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
          {/* Bus Emblem */}
          <div className="size-11 sm:size-12 rounded-2xl bg-[#7A1D1B]/8 border border-[#7A1D1B]/12 flex items-center justify-center shrink-0">
            <Bus className="size-5 text-[#7A1D1B]" />
          </div>

          <div className="space-y-1 min-w-0">
            {/* Badges & Name */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base sm:text-lg text-[#111111] tracking-tight truncate">
                {busName}
              </h3>
              {busNum && busNum !== busName && (
                <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-[#FAF8F5] border border-[#EDE7E0] text-[#554E48] tracking-wider">
                  {busNum}
                </span>
              )}
              {brand && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#EDE7E0] text-[#746E69]">
                  {brand}
                </span>
              )}
              {todayTrip?.status && <StatusBadge status={todayTrip.status} />}
            </div>

            {/* Route & Departure Details */}
            <p className="text-xs sm:text-sm text-[#554E48] flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-[#111111]">{route}</span>
              {departs && (
                <span className="text-[#746E69]">· Departs {departs}</span>
              )}
              {totalSeats > 0 && (
                <span className="text-[#746E69]">· {totalSeats} seats</span>
              )}
            </p>
          </div>
        </div>

        {/* Right Side: Key Performance Metrics & Action Buttons */}
        <div className="flex items-center justify-between lg:justify-end gap-5 sm:gap-7 shrink-0 pt-2 lg:pt-0 border-t border-[#EDE7E0]/60 lg:border-t-0">
          {/* Metrics Cluster */}
          <div className="flex items-center gap-4 sm:gap-6 text-right">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#746E69]">
                Trips
              </p>
              <p className="font-black text-sm text-[#111111]">{totalTrips}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#746E69]">
                Avg Occ
              </p>
              <p
                className={`font-black text-sm ${
                  avgOcc >= 70
                    ? "text-emerald-700"
                    : avgOcc >= 35
                    ? "text-amber-700"
                    : "text-[#554E48]"
                }`}
              >
                {avgOcc}%
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#746E69]">
                Revenue
              </p>
              <p className="font-black text-sm text-[#111111]">
                {fmtCurrency(totalRevenue)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {fleetWorkstationId && (
              <Link
                href={`/dashboard/fleet/${fleetWorkstationId}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#EDE7E0] bg-[#FAF8F5] px-3 sm:px-3.5 text-xs font-semibold text-[#111111] transition hover:bg-white hover:border-[#7A1D1B]/30 active:scale-[0.98] shadow-2xs"
              >
                <ExternalLink className="size-3.5 text-[#7A1D1B]" />
                <span>Workstation</span>
              </Link>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((prev) => !prev);
              }}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#EDE7E0] bg-white px-3 sm:px-3.5 text-xs font-semibold text-[#111111] transition hover:bg-[#FAF8F5] active:scale-[0.98] shadow-2xs"
            >
              <span>{open ? "Hide trips" : "View trips"}</span>
              <ChevronDown
                className={`size-3.5 text-[#746E69] transition-transform duration-200 ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Departure Timetable */}
      {open && (
        <div className="border-t border-[#EDE7E0] bg-[#FAF8F5]/60 px-5 py-4 sm:px-7 sm:py-5">
          {/* Subheader */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#EDE7E0]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#746E69]">
              Scheduled departures ({trips.length})
            </p>
            <p className="text-xs text-[#746E69]">
              Sorted chronologically
            </p>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EDE7E0] text-[11px] font-bold uppercase tracking-wider text-[#746E69]">
                  <th className="pb-3 pt-2 font-bold">Date & Departure</th>
                  <th className="pb-3 pt-2 font-bold">Route</th>
                  <th className="pb-3 pt-2 font-bold text-center">Status</th>
                  <th className="pb-3 pt-2 font-bold text-center">Occupancy</th>
                  <th className="pb-3 pt-2 font-bold text-right">Revenue</th>
                  <th className="pb-3 pt-2 font-bold text-right pr-1">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE7E0]/60">
                {trips.map((trip) => {
                  const tripDateIso = trip.tripDate
                    ? trip.tripDate.slice(0, 10)
                    : "";
                  const sold =
                    trip.ticketsSold || trip.occupiedPlaces || 0;
                  const tripTotalSeats =
                    trip.busId?.totalSeats || totalSeats || 0;
                  const tripOccPct =
                    tripTotalSeats > 0
                      ? Math.round((sold / tripTotalSeats) * 100)
                      : 0;

                  return (
                    <tr
                      key={trip._id}
                      className="hover:bg-white/80 transition-colors"
                    >
                      {/* Date & Departure */}
                      <td className="py-3.5 font-medium text-[#111111]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-[#746E69]" />
                          <span className="font-semibold">
                            {fmtDate(trip.tripDate)}
                          </span>
                          <span className="text-[#746E69]">·</span>
                          <Clock className="size-3 text-[#746E69]" />
                          <span>{trip.departureTime}</span>
                        </div>
                      </td>

                      {/* Route */}
                      <td className="py-3.5 text-[#554E48] font-medium">
                        {getDirection(trip)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 text-center">
                        <StatusBadge status={trip.status} />
                      </td>

                      {/* Occupancy */}
                      <td className="py-3.5 text-center">
                        <span className="font-bold text-[#111111]">{sold}</span>
                        <span className="text-[#746E69]">
                          {" "}
                          / {tripTotalSeats || "—"} ({tripOccPct}%)
                        </span>
                      </td>

                      {/* Revenue */}
                      <td className="py-3.5 text-right font-bold text-[#111111]">
                        {fmtCurrency(trip.totalRevenue)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 text-right pr-1">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/bookings?tripId=${trip._id}&from=${tripDateIso}&to=${tripDateIso}`}
                            className="inline-flex h-7 items-center justify-center gap-1 rounded-lg border border-[#EDE7E0] bg-white px-2.5 text-xs font-semibold text-[#554E48] transition hover:bg-[#FAF8F5] hover:text-[#111111] active:scale-[0.98] shadow-2xs"
                            title="View passenger manifest"
                          >
                            <Users className="size-3 text-[#7A1D1B]" />
                            <span>Manifest</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => onOpenDetails(trip)}
                            className="inline-flex h-7 items-center justify-center rounded-lg border border-[#DCD5CD] bg-white px-3 text-xs font-semibold text-[#191512] transition hover:bg-[#FAF8F5] hover:border-[#7A1D1B]/40 active:scale-[0.98] shadow-2xs"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Master Buses & Scheduled Trips Component ─────────────────────────────────

export interface FleetTripViewProps {
  trips: OwnerTrip[];
  loading?: boolean;
  onRefresh?: () => void;
  onManageLiveService: (trip: OwnerTrip) => void;
}

export function FleetTripView({
  trips,
  loading = false,
  onManageLiveService,
}: FleetTripViewProps) {
  const [selectedTrip, setSelectedTrip] = useState<OwnerTrip | null>(null);

  // Group by bus
  const busGroups = useMemo(() => {
    return groupByBus(trips);
  }, [trips]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-1">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A1D1B]">
            Fleet timetable
          </p>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111]">
            Buses & Scheduled Trips
          </h2>
          <p className="text-xs sm:text-sm text-[#554E48] mt-0.5">
            Select any vehicle to inspect upcoming departures, seat occupancy, and passenger manifests.
          </p>
        </div>
      </div>

      {/* Bus Cards List */}
      <div>
        {loading && !trips.length ? (
          <div className="rounded-3xl border border-[#EDE7E0] bg-white p-12 text-center shadow-xs">
            <div className="size-10 rounded-2xl bg-[#7A1D1B]/10 flex items-center justify-center mx-auto mb-3">
              <Bus className="size-5 text-[#7A1D1B]" />
            </div>
            <p className="text-sm font-bold text-[#111111]">Loading departures…</p>
            <p className="text-xs text-[#746E69] mt-1">
              Retrieving live timetable from operator schedule.
            </p>
          </div>
        ) : busGroups.size === 0 ? (
          <div className="rounded-3xl border border-[#EDE7E0] bg-white p-12 text-center shadow-xs">
            <div className="size-12 rounded-2xl bg-[#FAF8F5] border border-[#EDE7E0] flex items-center justify-center mx-auto mb-3">
              <Bus className="size-6 text-[#746E69]" />
            </div>
            <p className="text-base font-bold text-[#111111]">No scheduled departures</p>
            <p className="text-xs sm:text-sm text-[#746E69] mt-1 max-w-sm mx-auto">
              There are currently no active departures scheduled for your fleet. Trips will appear here automatically once created.
            </p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-4">
            {Array.from(busGroups.entries()).map(([busId, busTrips]) => (
              <BusAccordionGroup
                key={busId}
                busId={busId}
                trips={busTrips}
                onOpenDetails={(trip) => setSelectedTrip(trip)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedTrip && (
        <TripDetailsModal
          trip={selectedTrip}
          onClose={() => setSelectedTrip(null)}
          onManageLiveService={onManageLiveService}
        />
      )}
    </div>
  );
}

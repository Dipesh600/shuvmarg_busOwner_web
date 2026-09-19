"use client";

import React, { useMemo, useState } from "react";
import {
  Clock,
  Route,
  User,
  Users,
  Search,
  CalendarX,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import type { OwnerTrip } from "@/features/trip-seat-controls/types";
import {
  isToday,
  isPastTrip,
  extractPersonPhone,
  todayCardGradient,
  dateKey,
  MONTH_NAMES,
} from "./calendar-helpers";

interface BusWorkstationTripListViewProps {
  trips: OwnerTrip[];
  totalSeats?: number;
  fallbackRouteText?: string;
  onSelectTrip: (trip: OwnerTrip, defaultDrawerTab?: "details" | "manifest") => void;
  onOpenManifest: (tripId: string) => void;
  onManageService: (tripId: string) => void;
}

type FilterScope = "all" | "upcoming" | "past";

function formatTripDateHeader(dateStr: string): { title: string; subtitle: string; isTodayDate: boolean } {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) {
    return { title: dateStr, subtitle: "", isTodayDate: false };
  }
  const y = d.getFullYear();
  const m = d.getMonth();
  const date = d.getDate();
  const isTodayDate = isToday(y, m, date);

  const dayOfWeek = d.toLocaleDateString("en-US", { weekday: "short" });
  const monthName = MONTH_NAMES[m];

  if (isTodayDate) {
    return {
      title: "Today",
      subtitle: `${dayOfWeek}, ${date} ${monthName} ${y}`,
      isTodayDate: true,
    };
  }

  // Check tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (tomorrow.getFullYear() === y && tomorrow.getMonth() === m && tomorrow.getDate() === date) {
    return {
      title: "Tomorrow",
      subtitle: `${dayOfWeek}, ${date} ${monthName} ${y}`,
      isTodayDate: false,
    };
  }

  return {
    title: `${dayOfWeek}, ${date} ${monthName}`,
    subtitle: `${y}`,
    isTodayDate: false,
  };
}

export function BusWorkstationTripListView({
  trips,
  totalSeats = 21,
  fallbackRouteText,
  onSelectTrip,
  onOpenManifest,
  onManageService,
}: BusWorkstationTripListViewProps) {
  const [filterScope, setFilterScope] = useState<FilterScope>("upcoming");
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Categorize counts
  const counts = useMemo(() => {
    let upcoming = 0;
    let past = 0;
    for (const t of trips) {
      if (isPastTrip(t.tripDate, t.departureTime, t.status)) {
        past++;
      } else {
        upcoming++;
      }
    }
    return { all: trips.length, upcoming, past };
  }, [trips]);

  // 2. Filter & Search
  const filteredTrips = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return trips.filter((t) => {
      const isPast = isPastTrip(t.tripDate, t.departureTime, t.status);
      if (filterScope === "upcoming" && isPast) return false;
      if (filterScope === "past" && !isPast) return false;

      if (!q) return true;

      const routeName = (
        t.directionLabel ||
        t.routeSnapshot?.routeVersion?.name ||
        t.routeId?.routeName ||
        fallbackRouteText ||
        ""
      ).toLowerCase();
      const driver = (t.driverName || "").toLowerCase();
      const conductor = (t.conductorName || "").toLowerCase();
      const busNo = (t.busId?.busNumber || "").toLowerCase();
      const time = (t.departureTime || "").toLowerCase();
      const date = (t.tripDate || "").toLowerCase();
      const status = (t.status || "").toLowerCase();

      return (
        routeName.includes(q) ||
        driver.includes(q) ||
        conductor.includes(q) ||
        busNo.includes(q) ||
        time.includes(q) ||
        date.includes(q) ||
        status.includes(q)
      );
    });
  }, [trips, filterScope, searchQuery, fallbackRouteText]);

  // 3. Group by date chronologically
  const groupedTrips = useMemo(() => {
    // Sort: if upcoming or all, ascending date then time. If past, descending.
    const sorted = [...filteredTrips].sort((a, b) => {
      const dateA = a.tripDate ? new Date(a.tripDate).getTime() : 0;
      const dateB = b.tripDate ? new Date(b.tripDate).getTime() : 0;
      if (dateA !== dateB) {
        return filterScope === "past" ? dateB - dateA : dateA - dateB;
      }
      return (a.departureTime || "").localeCompare(b.departureTime || "");
    });

    const groups: { dateKey: string; dateStr: string; trips: OwnerTrip[] }[] = [];
    const groupMap = new Map<string, OwnerTrip[]>();

    for (const trip of sorted) {
      if (!trip.tripDate) continue;
      const d = new Date(trip.tripDate);
      if (Number.isNaN(d.getTime())) continue;
      const key = dateKey(d.getFullYear(), d.getMonth(), d.getDate());

      if (!groupMap.has(key)) {
        const entry: OwnerTrip[] = [];
        groupMap.set(key, entry);
        groups.push({ dateKey: key, dateStr: trip.tripDate, trips: entry });
      }
      groupMap.get(key)!.push(trip);
    }

    return groups;
  }, [filteredTrips, filterScope]);

  return (
    <div className="space-y-4">
      {/* ── Filter & Search Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#EDE7E0] p-3 rounded-2xl shadow-2xs">
        {/* Scope Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          <button
            type="button"
            onClick={() => setFilterScope("upcoming")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              filterScope === "upcoming"
                ? "bg-[#7A1D1B] text-white shadow-2xs"
                : "text-[#746E69] hover:text-[#191512] hover:bg-[#FAF8F5]"
            }`}
          >
            <span>Upcoming & Live</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                filterScope === "upcoming" ? "bg-white/20 text-white" : "bg-[#EDE7E0] text-[#191512]"
              }`}
            >
              {counts.upcoming}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterScope("all")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              filterScope === "all"
                ? "bg-[#7A1D1B] text-white shadow-2xs"
                : "text-[#746E69] hover:text-[#191512] hover:bg-[#FAF8F5]"
            }`}
          >
            <span>All Departures</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                filterScope === "all" ? "bg-white/20 text-white" : "bg-[#EDE7E0] text-[#191512]"
              }`}
            >
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterScope("past")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              filterScope === "past"
                ? "bg-[#7A1D1B] text-white shadow-2xs"
                : "text-[#746E69] hover:text-[#191512] hover:bg-[#FAF8F5]"
            }`}
          >
            <span>Past Departures</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                filterScope === "past" ? "bg-white/20 text-white" : "bg-[#EDE7E0] text-[#191512]"
              }`}
            >
              {counts.past}
            </span>
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#746E69]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search route, driver, bus..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#FAF8F5] border border-[#EDE7E0] text-[#191512] placeholder-[#A09890] focus:outline-hidden focus:ring-1.5 focus:ring-[#7A1D1B]/40 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#746E69] hover:text-[#191512] cursor-pointer"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── Empty State ── */}
      {groupedTrips.length === 0 && (
        <div className="rounded-2xl border border-[#EDE7E0] bg-white p-8 text-center space-y-3 shadow-2xs">
          <div className="mx-auto size-12 rounded-full bg-[#FAF8F5] border border-[#EDE7E0] flex items-center justify-center text-[#746E69]">
            <CalendarX className="size-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#191512]">No departures found</h4>
            <p className="text-xs text-[#746E69] max-w-sm mx-auto">
              {searchQuery
                ? `No trips match "${searchQuery}". Try changing your search query or reset filters.`
                : filterScope === "upcoming"
                ? "No upcoming departures scheduled. Switch to 'All Departures' or check the calendar."
                : "No past departures found."}
            </p>
          </div>
          {(searchQuery || filterScope !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setFilterScope("all");
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#7A1D1B] bg-[#FFF5F4] border border-[#F8C9C7] hover:bg-[#FDE7E6] transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* ── Chronological Grouped List ── */}
      {groupedTrips.map((group) => {
        const header = formatTripDateHeader(group.dateStr);

        return (
          <div key={group.dateKey} className="space-y-2.5">
            {/* Date Group Header */}
            <div className="flex items-center justify-between px-1 pt-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-black uppercase tracking-wider ${
                    header.isTodayDate ? "text-[#7A1D1B]" : "text-[#191512]"
                  }`}
                >
                  {header.title}
                </span>
                {header.subtitle && (
                  <span className="text-[11px] text-[#746E69] font-medium">• {header.subtitle}</span>
                )}
                {header.isTodayDate && (
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#7A1D1B] bg-[#FFF5F4] px-1.5 py-0.5 rounded-md border border-[#F8C9C7]">
                    Active Today
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-[#746E69] bg-[#EDE7E0]/60 px-2 py-0.5 rounded-md">
                {group.trips.length} {group.trips.length === 1 ? "departure" : "departures"}
              </span>
            </div>

            {/* Departures for this Date */}
            <div className="space-y-2">
              {group.trips.map((trip) => {
                const label =
                  trip.directionLabel ||
                  trip.routeSnapshot?.routeVersion?.name ||
                  trip.routeId?.routeName ||
                  fallbackRouteText ||
                  "Corridor Route";

                const isLive = ["in-transit", "boarding"].includes((trip.status || "").toLowerCase());
                const isPast = isPastTrip(trip.tripDate, trip.departureTime, trip.status);
                const booked = trip.ticketsSold || 0;
                const capacity = totalSeats || 21;
                const occupancyPct = Math.round((booked / capacity) * 100);
                const revenue = trip.totalRevenue || booked * (trip.tripFare || 1250);

                const driverName = trip.driverName || "Assigned Driver";
                const driverPhone = extractPersonPhone(trip.driverId);
                const conductorName = trip.conductorName || "Assigned Conductor";

                return (
                  <div
                    key={trip._id}
                    role="button"
                    tabIndex={0}
                    style={header.isTodayDate ? todayCardGradient : undefined}
                    onClick={() => onSelectTrip(trip, "details")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectTrip(trip, "details");
                      }
                    }}
                    className={`rounded-2xl border p-3.5 sm:p-4 transition cursor-pointer select-none group shadow-2xs ${
                      isPast
                        ? "border-[#EDE7E0] bg-[#FAF8F5]/60 hover:bg-white hover:border-[#D5CDC5] opacity-75 hover:opacity-100"
                        : isLive
                        ? "border-[#A7F3D0] bg-[#ECFDF5]/40 hover:border-[#059669] hover:bg-[#ECFDF5]"
                        : "border-[#EDE7E0] bg-white hover:border-[#7A1D1B]/40 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                      {/* Left: Time, Route & Bus */}
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Time Box */}
                        <div className="flex flex-col items-center justify-center size-14 rounded-xl bg-[#FAF8F5] border border-[#EDE7E0] p-1 shrink-0 group-hover:border-[#7A1D1B]/30 transition-colors">
                          <Clock className="size-3.5 text-[#7A1D1B] mb-0.5" />
                          <span className="font-mono font-black text-xs text-[#191512] leading-tight">
                            {trip.departureTime || "--:--"}
                          </span>
                          {trip.arrivalTime && (
                            <span className="text-[9px] text-[#746E69] font-mono leading-none mt-0.5 truncate">
                              → {trip.arrivalTime}
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="inline-flex items-center gap-1.5 text-sm sm:text-base font-black text-[#191512] group-hover:text-[#7A1D1B] transition-colors truncate">
                              <Route className="size-3.5 text-[#7A1D1B] shrink-0" />
                              <span className="truncate">{label}</span>
                            </h4>
                            {isLive && (
                              <span className="text-[9px] font-black uppercase bg-[#ECFDF5] text-[#065F46] px-1.5 py-0.5 rounded-md border border-[#A7F3D0]">
                                Live Service
                              </span>
                            )}
                            {isPast && (
                              <span className="text-[9px] font-bold uppercase text-[#746E69] bg-[#EDE7E0]/60 px-1.5 py-0.5 rounded border border-[#D5CDC5]">
                                Departed
                              </span>
                            )}
                            {!isLive && !isPast && trip.status && (
                              <span className="text-[9px] font-bold uppercase text-[#554E48] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#EDE7E0]">
                                {trip.status}
                              </span>
                            )}
                          </div>

                          {/* Bus & Crew Details */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#746E69]">
                            {trip.busId?.busNumber && (
                              <span className="font-semibold text-[#191512]">
                                {trip.busId.busNumber}
                                {trip.busId.busName && ` (${trip.busId.busName})`}
                              </span>
                            )}
                            <div className="flex items-center gap-1">
                              <User className="size-3 text-[#7A1D1B]" />
                              <span>{driverName}</span>
                              {driverPhone && <span className="text-[10px] text-[#A09890]">({driverPhone})</span>}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="size-3 text-[#7A1D1B]" />
                              <span>{conductorName}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Occupancy, Revenue & Actions */}
                      <div className="flex items-center justify-between lg:justify-end gap-3 sm:gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#EDE7E0]/70">
                        {/* Occupancy Indicator */}
                        <div className="space-y-1 text-left lg:text-right shrink-0">
                          <div className="flex items-center lg:justify-end gap-1.5">
                            <span className="text-xs font-black text-[#191512] font-mono">
                              {booked} / {capacity}
                            </span>
                            <span className="text-[11px] text-[#746E69] font-medium">seats</span>
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                                occupancyPct >= 80
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : occupancyPct >= 40
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : "bg-[#FAF8F5] text-[#746E69] border border-[#EDE7E0]"
                              }`}
                            >
                              {occupancyPct}%
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-24 sm:w-28 h-1.5 rounded-full bg-[#EDE7E0] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                occupancyPct >= 80
                                  ? "bg-[#059669]"
                                  : occupancyPct >= 40
                                  ? "bg-[#D97706]"
                                  : "bg-[#7A1D1B]"
                              }`}
                              style={{ width: `${Math.min(100, Math.max(4, occupancyPct))}%` }}
                            />
                          </div>

                          {/* Revenue */}
                          <div className="flex items-center lg:justify-end gap-1 text-[11px] font-semibold text-[#554E48]">
                            <TrendingUp className="size-3 text-[#7A1D1B]" />
                            <span>Rs. {revenue.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div
                          className="flex items-center gap-1.5 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onOpenManifest(trip._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white border border-[#EDE7E0] text-[#191512] hover:bg-[#FAF8F5] transition shadow-2xs cursor-pointer"
                            title="View Manifest"
                          >
                            <Users className="size-3.5 text-[#7A1D1B]" />
                            <span className="hidden sm:inline">Manifest</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onManageService(trip._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#FAF8F5] border border-[#EDE7E0] text-[#191512] hover:bg-[#EDE7E0] transition shadow-2xs cursor-pointer"
                            title="Manage Service"
                          >
                            <SlidersHorizontal className="size-3.5" />
                            <span className="hidden sm:inline">Manage</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectTrip(trip, "details")}
                            className="inline-flex items-center justify-center size-8 rounded-xl bg-[#7A1D1B] text-white hover:bg-[#5C1414] transition shadow-2xs cursor-pointer"
                            title="Open Seat Layout Drawer"
                          >
                            <ChevronRight className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

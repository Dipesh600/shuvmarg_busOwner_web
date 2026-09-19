"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Calendar, Users, Route, Phone, User, SlidersHorizontal, Rows3 } from "lucide-react";
import type { FleetOperationalContext } from "@/features/operator-dashboard/fleet-operational-context";
import type { OwnerTrip } from "@/features/trip-seat-controls/types";
import type { SeatLayoutV3 } from "@/features/seat-layout-v3/types";
import { BusWorkstationTripDrawer } from "./BusWorkstationTripDrawer";
import { useOwnerResource } from "@/features/owner-workspace/use-owner-resource";
import type { TripManifest } from "@/features/owner-workspace/api";
import { BusWorkstationCalendarView } from "./BusWorkstationCalendarView";
import { BusWorkstationTripListView } from "./BusWorkstationTripListView";
import { extractPersonPhone, todayCardGradient } from "./calendar-helpers";

interface BusWorkstationOperationsTabProps {
  fleetId: string;
  operational: FleetOperationalContext;
  activeTrip?: OwnerTrip | null;
  allTrips?: OwnerTrip[];
  totalSeats: number;
  dailySales?: { ticketsSold: number; bookingSales: number } | null;
  seatLayout?: SeatLayoutV3 | null;
}

export function BusWorkstationOperationsTab({
  fleetId,
  operational,
  activeTrip,
  allTrips = [],
  totalSeats,
  dailySales,
  seatLayout,
}: BusWorkstationOperationsTabProps) {
  const router = useRouter();
  const [subTab, setSubTab] = useState<"today" | "calendar">("today");
  const [tripViewMode, setTripViewMode] = useState<"calendar" | "list">(() => {
    if (typeof window !== "undefined") {
      try {
        return (localStorage.getItem("shuvmarg_workstation_trip_view_mode") as "calendar" | "list") || "calendar";
      } catch {
        return "calendar";
      }
    }
    return "calendar";
  });

  const handleSetTripViewMode = (mode: "calendar" | "list") => {
    setTripViewMode(mode);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("shuvmarg_workstation_trip_view_mode", mode);
      } catch {
        // ignore storage errors
      }
    }
  };

  const [drawerTrip, setDrawerTrip] = useState<OwnerTrip | null>(null);
  const [drawerInitialTab, setDrawerInitialTab] = useState<"details" | "manifest">("details");
  const [manifestPage, setManifestPage] = useState(1);

  const fleetTrips = allTrips.filter((t) => !t.busId || (typeof t.busId === "object" ? t.busId._id : String(t.busId)) === fleetId);
  const calendarCount = fleetTrips.length > 0 ? fleetTrips.length : allTrips.length;

  const manifestResource = useOwnerResource<TripManifest>(
    drawerTrip?._id ? `/busowner/trip-manifest/${drawerTrip._id}?page=${manifestPage}&limit=100` : null
  );

  const bookedSeats = dailySales?.ticketsSold ?? operational.ticketsSoldCount ?? activeTrip?.ticketsSold ?? 0;
  const capacity = totalSeats > 0 ? totalSeats : 21;
  const occupancyPct = Math.min(100, Math.round((bookedSeats / capacity) * 100));

  const tripStats = activeTrip as (OwnerTrip & { bookingCounts?: Record<string, number>; boardedCount?: number }) | null;
  const boardedCount = tripStats?.boardedCount ?? tripStats?.bookingCounts?.BOARDED ?? 0;
  const revenue = dailySales?.bookingSales ?? operational.ticketsSoldAmount ?? activeTrip?.totalRevenue ?? 0;

  const rawStatus = activeTrip?.status || (operational.isLiveTrip ? "in-transit" : "scheduled");
  const isLive = ["in-transit", "boarding"].includes(rawStatus.toLowerCase());

  const driverPhone = extractPersonPhone(activeTrip?.driverId);
  const conductorPhone = extractPersonPhone(activeTrip?.conductorId);
  const driverName = operational.driverName || activeTrip?.driverName || "Driver Assigned";
  const conductorName = operational.conductorName || activeTrip?.conductorName || "Conductor Assigned";

  const todayKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;
  const todayFleetTrip = fleetTrips.find((t) => t.tripDate && t.tripDate.startsWith(todayKey));
  const todayTrip: OwnerTrip = activeTrip || todayFleetTrip || fleetTrips[0] || {
    _id: `today-${fleetId}`,
    tripDate: new Date().toISOString(),
    departureTime: operational.scheduleText || "18:40",
    status: operational.isLiveTrip ? "in-transit" : "scheduled",
    directionLabel: operational.routeText,
    ticketsSold: bookedSeats,
    driverName,
    conductorName,
  };

  const handleSelectTrip = (trip: OwnerTrip, initialTab: "details" | "manifest" = "details") => {
    setManifestPage(1);
    setDrawerTrip(trip);
    setDrawerInitialTab(initialTab);
  };

  const handleOpenManifest = (tripId?: string) => {
    const target = (tripId ? fleetTrips.find((t) => t._id === tripId) : null) || todayTrip;
    handleSelectTrip(target, "manifest");
  };

  const handleManageService = (tripId?: string) => {
    const targetId = tripId || activeTrip?._id;
    router.push(targetId ? `/dashboard/trips?tripId=${encodeURIComponent(targetId)}` : "/dashboard/trips");
  };

  return (
    <div className="space-y-4">
      {/* ── Sub Navigation Bar ── */}
      <div className="flex items-center justify-between rounded-2xl bg-white border border-[#EDE7E0] p-1.5 shadow-2xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSubTab("today")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
              subTab === "today" ? "bg-[#7A1D1B] text-white shadow-xs" : "text-[#746E69] hover:text-[#191512] hover:bg-[#FAF8F5]"
            }`}
          >
            <Clock className="size-3.5" />
            <span>Today</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab("calendar")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
              subTab === "calendar" ? "bg-[#7A1D1B] text-white shadow-xs" : "text-[#746E69] hover:text-[#191512] hover:bg-[#FAF8F5]"
            }`}
          >
            {tripViewMode === "list" ? <Rows3 className="size-3.5" /> : <Calendar className="size-3.5" />}
            <span>{tripViewMode === "list" ? "Trip List" : "Trip Calendar"}</span>
            <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${subTab === "calendar" ? "bg-white/20 text-white" : "bg-[#EDE7E0] text-[#191512]"}`}>
              {calendarCount}
            </span>
          </button>
        </div>

        {/* ── View Mode Switcher (Calendar vs List) ── */}
        {subTab === "calendar" && (
          <div className="flex items-center gap-1 bg-[#FAF8F5] border border-[#EDE7E0] p-0.5 rounded-xl">
            <button
              type="button"
              onClick={() => handleSetTripViewMode("calendar")}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                tripViewMode === "calendar"
                  ? "bg-[#7A1D1B] text-white shadow-2xs"
                  : "text-[#746E69] hover:text-[#191512]"
              }`}
              title="Calendar View"
            >
              <Calendar className="size-3.5" />
              <span className="hidden sm:inline">Calendar</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetTripViewMode("list")}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                tripViewMode === "list"
                  ? "bg-[#7A1D1B] text-white shadow-2xs"
                  : "text-[#746E69] hover:text-[#191512]"
              }`}
              title="List View"
            >
              <Rows3 className="size-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        )}
      </div>

      {/* ── TODAY VIEW ── */}
      {subTab === "today" && (
        <div className="space-y-4">
          {/* 4 KPIs Row (2x2 on mobile below 640px, 4 in a row on desktop) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div style={todayCardGradient} className="rounded-2xl border border-[#EDE7E0] p-3.5 sm:p-4 space-y-1.5 sm:space-y-2 shadow-2xs min-w-0">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#746E69] truncate block">Departure</span>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-[#191512] font-mono tracking-tight truncate">{activeTrip?.departureTime || operational.scheduleText || "18:40"}</p>
              {rawStatus !== "scheduled" && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                  isLive ? "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]" : "bg-[#FAF8F5] text-[#554E48] border-[#EDE7E0]"
                }`}>{rawStatus.toUpperCase()}</span>
              )}
            </div>
            <div style={todayCardGradient} className="rounded-2xl border border-[#EDE7E0] p-3.5 sm:p-4 space-y-1.5 sm:space-y-2 shadow-2xs min-w-0">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#746E69] truncate block">Seats Booked</span>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-[#191512] font-mono tracking-tight truncate">{bookedSeats} / {capacity}</p>
              <p className="text-[11px] sm:text-xs font-semibold text-[#746E69] truncate">{occupancyPct}% Occupancy</p>
            </div>
            <div style={todayCardGradient} className="rounded-2xl border border-[#EDE7E0] p-3.5 sm:p-4 space-y-1.5 sm:space-y-2 shadow-2xs min-w-0">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#746E69] truncate block">Boarded</span>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-[#191512] font-mono tracking-tight truncate">{boardedCount} / {bookedSeats}</p>
              <p className="text-[11px] sm:text-xs font-semibold text-[#746E69] truncate">Verified by Conductor</p>
            </div>
            <div style={todayCardGradient} className="rounded-2xl border border-[#EDE7E0] p-3.5 sm:p-4 space-y-1.5 sm:space-y-2 shadow-2xs min-w-0">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#746E69] truncate block">Revenue</span>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-[#191512] font-mono tracking-tight truncate">Rs. {revenue.toLocaleString()}</p>
              <p className="text-[11px] sm:text-xs font-semibold text-[#746E69] truncate">Today&apos;s collections</p>
            </div>
          </div>

          {/* Today's Trip Bar */}
          <div
            role="button"
            tabIndex={0}
            style={todayCardGradient}
            onClick={() => handleSelectTrip(todayTrip, "details")}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), handleSelectTrip(todayTrip, "details"))}
            className="rounded-2xl border border-[#EDE7E0] hover:border-[#7A1D1B]/40 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none group"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Route className="size-4 text-[#7A1D1B] shrink-0" />
                <h4 className="text-sm sm:text-base font-black text-[#191512] group-hover:text-[#7A1D1B] transition-colors">
                  {operational.routeText || "Assigned Corridor Route"}
                </h4>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#554E48]">
                <div className="flex items-center gap-1.5">
                  <User className="size-3.5 text-[#7A1D1B] shrink-0" />
                  <span>Driver:</span>
                  <strong className="text-[#191512]">{driverName}</strong>
                  {driverPhone && <span className="text-[#746E69] inline-flex items-center gap-0.5"><Phone className="size-2.5" />{driverPhone}</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="size-3.5 text-[#7A1D1B] shrink-0" />
                  <span>Conductor:</span>
                  <strong className="text-[#191512]">{conductorName}</strong>
                  {conductorPhone && <span className="text-[#746E69] inline-flex items-center gap-0.5"><Phone className="size-2.5" />{conductorPhone}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => handleOpenManifest()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-[#EDE7E0] text-[#191512] hover:bg-[#FAF8F5] hover:border-[#D5CDC5] transition shadow-2xs cursor-pointer"
              >
                <Users className="size-3.5 text-[#7A1D1B]" />
                <span>View Manifest</span>
              </button>
              <button
                type="button"
                onClick={() => handleManageService()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#7A1D1B] text-white hover:bg-[#5C1414] transition shadow-2xs cursor-pointer"
              >
                <SlidersHorizontal className="size-3.5" />
                <span>Manage Service</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TRIP DEPARTURES VIEW (CALENDAR OR LIST) ── */}
      {subTab === "calendar" && (
        tripViewMode === "calendar" ? (
          <BusWorkstationCalendarView
            trips={fleetTrips}
            totalSeats={totalSeats}
            fallbackRouteText={operational.routeText}
            onSelectTrip={handleSelectTrip}
            onOpenManifest={handleOpenManifest}
            onManageService={handleManageService}
          />
        ) : (
          <BusWorkstationTripListView
            trips={fleetTrips}
            totalSeats={totalSeats}
            fallbackRouteText={operational.routeText}
            onSelectTrip={handleSelectTrip}
            onOpenManifest={handleOpenManifest}
            onManageService={handleManageService}
          />
        )
      )}

      {/* ── Responsive Workstation Drawer (Side Drawer on Desktop, Down-to-Up on Mobile) ── */}
      <BusWorkstationTripDrawer
        isOpen={Boolean(drawerTrip)}
        trip={drawerTrip}
        totalSeats={totalSeats}
        layout={seatLayout}
        fallbackRouteText={operational.routeText}
        initialTab={drawerInitialTab}
        manifest={manifestResource.data || null}
        manifestLoading={manifestResource.loading}
        manifestPage={manifestPage}
        onManifestPageChange={setManifestPage}
        onClose={() => setDrawerTrip(null)}
        onManageService={handleManageService}
      />
    </div>
  );
}

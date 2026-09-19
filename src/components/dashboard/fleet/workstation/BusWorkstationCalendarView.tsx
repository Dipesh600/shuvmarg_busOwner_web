"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { OwnerTrip } from "@/features/trip-seat-controls/types";
import {
  MONTH_NAMES,
  DAY_NAMES,
  getCalendarDays,
  dateKey,
} from "./calendar-helpers";
import { BusWorkstationMobileDayView } from "./BusWorkstationMobileDayView";
import { BusWorkstationCalendarCell } from "./BusWorkstationCalendarCell";

interface BusWorkstationCalendarViewProps {
  trips: OwnerTrip[];
  totalSeats?: number;
  fallbackRouteText?: string;
  onSelectTrip: (trip: OwnerTrip) => void;
  onOpenManifest: (tripId: string) => void;
  onManageService: (tripId: string) => void;
}

export function BusWorkstationCalendarView({
  trips,
  totalSeats = 21,
  fallbackRouteText,
  onSelectTrip,
  onOpenManifest,
  onManageService,
}: BusWorkstationCalendarViewProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedMobileDateKey, setSelectedMobileDateKey] = useState<string>(
    () => dateKey(now.getFullYear(), now.getMonth(), now.getDate())
  );

  const tripsByDate = useMemo(() => {
    const map = new Map<string, OwnerTrip[]>();
    for (const trip of trips) {
      if (!trip.tripDate) continue;
      const d = new Date(trip.tripDate);
      if (Number.isNaN(d.getTime())) continue;
      const key = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(trip);
    }
    for (const [, dayTrips] of map) {
      dayTrips.sort((a, b) => (a.departureTime || "").localeCompare(b.departureTime || ""));
    }
    return map;
  }, [trips]);

  const calendarDays = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const navigateMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y--;
    } else if (m > 11) {
      m = 0;
      y++;
    }
    setViewMonth(m);
    setViewYear(y);
  };

  const goToToday = () => {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedMobileDateKey(dateKey(now.getFullYear(), now.getMonth(), now.getDate()));
  };

  const mobileSelectedTrips = tripsByDate.get(selectedMobileDateKey) || [];

  return (
    <div className="space-y-3">
      {/* ── Calendar Controls Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white border border-[#EDE7E0] p-3.5 shadow-2xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigateMonth(-1)}
            aria-label="Previous Month"
            className="size-8 rounded-xl flex items-center justify-center text-[#746E69] hover:bg-[#FAF8F5] hover:text-[#191512] transition border border-[#EDE7E0] cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </button>
          <h3 className="text-sm sm:text-base font-black text-[#191512] min-w-[160px] text-center">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h3>
          <button
            type="button"
            onClick={() => navigateMonth(1)}
            aria-label="Next Month"
            className="size-8 rounded-xl flex items-center justify-center text-[#746E69] hover:bg-[#FAF8F5] hover:text-[#191512] transition border border-[#EDE7E0] cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={goToToday}
          className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#7A1D1B] bg-[#FFF5F4] hover:bg-[#FDE7E6] border border-[#F8C9C7] transition cursor-pointer"
        >
          Today
        </button>
      </div>

      {/* ── Monthly Calendar Grid ── */}
      <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#EDE7E0] overflow-hidden shadow-2xs">
        <div className="grid grid-cols-7 border-b border-[#EDE7E0] bg-[#FAF8F5]">
          {DAY_NAMES.map((day) => (
            <div key={day} className="py-2 sm:py-2.5 text-center">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#746E69]">
                {day}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 divide-x divide-y divide-[#EDE7E0]">
          {calendarDays.map((day, idx) => {
            const key = dateKey(day.year, day.month, day.date);
            const dayTrips = tripsByDate.get(key) || [];

            return (
              <BusWorkstationCalendarCell
                key={idx}
                day={day}
                dayTrips={dayTrips}
                isSelectedMobile={selectedMobileDateKey === key}
                fallbackRouteText={fallbackRouteText}
                onSelectDate={() => setSelectedMobileDateKey(key)}
                onSelectTrip={onSelectTrip}
              />
            );
          })}
        </div>
      </div>

      {/* ── Below 640px Screen Day Inspection View ── */}
      <BusWorkstationMobileDayView
        dateStr={selectedMobileDateKey}
        trips={mobileSelectedTrips}
        totalSeats={totalSeats}
        fallbackRouteText={fallbackRouteText}
        onSelectTrip={onSelectTrip}
        onOpenManifest={onOpenManifest}
        onManageService={onManageService}
      />
    </div>
  );
}

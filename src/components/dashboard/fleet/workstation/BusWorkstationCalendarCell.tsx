"use client";

import React from "react";
import type { OwnerTrip } from "@/features/trip-seat-controls/types";
import {
  type CalendarDay,
  isToday,
  isPastDate,
  isPastTrip,
  todayCardGradient,
} from "./calendar-helpers";

interface BusWorkstationCalendarCellProps {
  day: CalendarDay;
  dayTrips: OwnerTrip[];
  isSelectedMobile: boolean;
  fallbackRouteText?: string;
  onSelectDate: () => void;
  onSelectTrip: (trip: OwnerTrip) => void;
}

export function BusWorkstationCalendarCell({
  day,
  dayTrips,
  isSelectedMobile,
  fallbackRouteText,
  onSelectDate,
  onSelectTrip,
}: BusWorkstationCalendarCellProps) {
  const isTodayCell = isToday(day.year, day.month, day.date);
  const isPastDay = isPastDate(day.year, day.month, day.date);

  return (
    <div
      onClick={onSelectDate}
      style={isTodayCell ? todayCardGradient : undefined}
      className={`min-h-[60px] sm:min-h-[120px] p-1.5 sm:p-2.5 transition-colors flex flex-col cursor-pointer ${
        !day.isCurrentMonth
          ? "bg-[#FAF8F5]/40 opacity-40"
          : isTodayCell
          ? "relative ring-1.5 ring-inset ring-[#7A1D1B]/25"
          : isPastDay
          ? "bg-[#FAF8F5]/50"
          : "bg-white"
      } ${isSelectedMobile ? "sm:ring-0 ring-2 ring-inset ring-[#7A1D1B]" : ""}`}
    >
      {/* Date Header */}
      <div className="flex items-center justify-between mb-2 sm:mb-2.5">
        <span
          className={`tracking-tight leading-none ${
            isTodayCell
              ? "text-[#7A1D1B] text-sm sm:text-base md:text-lg font-black"
              : isPastDay
              ? "text-[#8C847D] text-xs sm:text-sm md:text-base font-bold"
              : "text-[#191512] text-xs sm:text-sm md:text-base font-black"
          }`}
        >
          {day.date}
        </span>
        {isTodayCell && (
          <span className="hidden sm:inline-flex text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-[#7A1D1B] bg-[#FFF5F4] px-1.5 py-0.5 rounded-md border border-[#F8C9C7]">
            Today
          </span>
        )}
      </div>

      {/* Mobile Trip Indicator (< 640px) */}
      <div className="sm:hidden flex-1 flex items-end pt-1">
        {dayTrips.length > 0 && (
          <span
            className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded border leading-tight block w-full truncate text-center ${
              isPastDay
                ? "text-[#8C847D] bg-[#F5F2ED] border-[#D5CDC5] opacity-45"
                : "text-[#7A1D1B] bg-[#FFF5F4] border-[#F8C9C7]"
            }`}
          >
            {dayTrips[0].departureTime}
            {dayTrips.length > 1 && ` +${dayTrips.length - 1}`}
          </span>
        )}
      </div>

      {/* Desktop Trips List (>= 640px) */}
      <div className="hidden sm:block space-y-1.5 flex-1 overflow-y-auto max-h-[85px] pt-0.5">
        {dayTrips.map((trip) => {
          const isLive = ["in-transit", "boarding"].includes(
            (trip.status || "").toLowerCase()
          );
          const isPast = isPastTrip(trip.tripDate, trip.departureTime, trip.status);
          const label = trip.directionLabel || fallbackRouteText || "Corridor";

          return (
            <button
              key={trip._id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectTrip(trip);
              }}
              className={`w-full text-left pl-2 pr-1.5 py-1 rounded-r-lg border-l-2 transition cursor-pointer group text-xs ${
                isPast
                  ? "border-l-[#D5CDC5] bg-[#FAF8F5]/40 opacity-40 hover:opacity-80"
                  : isLive
                  ? "border-l-[#059669] bg-[#ECFDF5]/60 hover:bg-[#ECFDF5]"
                  : "border-l-[#7A1D1B] bg-[#FAF8F5]/80 hover:bg-[#F5EFEA]"
              }`}
            >
              <div className="flex items-center justify-between gap-1 leading-tight">
                <span
                  className={`font-mono font-bold text-[11px] ${
                    isPast ? "text-[#746E69]" : "text-[#191512]"
                  }`}
                >
                  {trip.departureTime}
                </span>
                {isLive && (
                  <span className="uppercase font-semibold text-[8px] text-[#059669]">
                    Live
                  </span>
                )}
              </div>
              <p
                className={`text-[10px] font-medium truncate leading-snug mt-0.5 ${
                  isPast ? "text-[#8C847D]" : "text-[#554E48]"
                }`}
              >
                {label}
              </p>
              <div className="text-[9px] text-[#746E69] mt-0.5">
                <span>{trip.ticketsSold || 0} booked</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { Lock, User, CheckCircle2 } from "lucide-react";
import type { LayoutElement } from "@/features/seat-layout-v3/types";

interface BusWorkstationSeatCardProps {
  element: LayoutElement;
  isBooked: boolean;
  isOpenToSell: boolean;
  passengerName?: string;
  ticketId?: string;
  fare?: number | null;
  isSelected?: boolean;
  onSelect?: (element: LayoutElement) => void;
}

export function BusWorkstationSeatCard({
  element,
  isBooked,
  isOpenToSell,
  passengerName,
  ticketId,
  fare,
  isSelected,
  onSelect,
}: BusWorkstationSeatCardProps) {
  const isBerth = element.kind === "BERTH";
  const label = element.label || "Seat";

  // Build descriptive tooltip for screen readers & hover
  const tooltipText = isBooked
    ? `Seat ${label} (Booked): ${passengerName || "Passenger"}${ticketId ? ` · Ticket ${ticketId}` : ""}`
    : isOpenToSell
    ? `Seat ${label} (Available to sell)${fare ? ` · NPR ${fare.toLocaleString()}` : ""}`
    : `Seat ${label} (Withdrawn / Not for sale)`;

  return (
    <div
      style={{
        gridColumn: `${element.position.x + 1} / span ${element.size.width}`,
        gridRow: `${element.position.y + 1} / span ${element.size.height}`,
      }}
      className="relative flex flex-col items-center justify-center group"
    >
      <button
        type="button"
        onClick={() => onSelect?.(element)}
        title={tooltipText}
        className={`relative w-full ${
          isBerth ? "min-h-[92px]" : "min-h-[46px] sm:min-h-[50px]"
        } flex flex-col items-center justify-between p-1.5 rounded-xl border transition-all duration-150 select-none cursor-pointer outline-none ${
          isBooked
            ? "bg-[#7A1D1B] border-[#651513] text-white shadow-xs"
            : !isOpenToSell
            ? "bg-[#F3EFEA] border-dashed border-[#D5CDC5] text-[#9A9187]"
            : isSelected
            ? "bg-[#FDF4F4] border-[#7A1D1B] text-[#7A1D1B] ring-2 ring-[#7A1D1B]/20 shadow-xs"
            : "bg-white hover:bg-[#FAF8F5] border-[#E0D8CE] hover:border-[#7A1D1B]/40 text-[#191512] shadow-2xs"
        }`}
        aria-label={tooltipText}
      >
        {/* Top Cushion Arc / Headrest */}
        <div
          className={`w-7 h-1 rounded-full transition-colors ${
            isBooked
              ? "bg-white/40"
              : !isOpenToSell
              ? "bg-[#D5CDC5]"
              : isSelected
              ? "bg-[#7A1D1B]/40"
              : "bg-[#D5CEC5]"
          }`}
        />

        {/* Seat Label */}
        <div className="flex flex-col items-center my-0.5">
          <span
            className={`text-xs sm:text-[13px] font-black tracking-tight ${
              isBooked ? "text-white" : !isOpenToSell ? "text-[#9A9187]" : "text-[#191512]"
            }`}
          >
            {label}
          </span>
          {isBerth && (
            <span
              className={`text-[9px] font-bold uppercase tracking-wider ${
                isBooked ? "text-white/70" : "text-[#746E69]"
              }`}
            >
              Berth
            </span>
          )}
        </div>

        {/* Status / Fare Badge */}
        <div className="w-full flex items-center justify-center">
          {isBooked ? (
            <div className="flex items-center gap-0.5 text-[10px] font-bold text-white/90">
              <CheckCircle2 className="size-2.5 shrink-0" />
              <span className="truncate max-w-[42px]">Sold</span>
            </div>
          ) : !isOpenToSell ? (
            <div className="flex items-center gap-0.5 text-[9px] font-medium text-[#9A9187]">
              <Lock className="size-2.5 shrink-0" />
              <span>Held</span>
            </div>
          ) : fare !== null && fare !== undefined && fare > 0 ? (
            <span className="text-[10px] font-bold text-[#746E69] group-hover:text-[#7A1D1B] whitespace-nowrap">
              Rs. {fare.toLocaleString()}
            </span>
          ) : (
            <div
              className={`h-[2.5px] w-4 rounded-full ${
                isSelected ? "bg-[#7A1D1B]" : "bg-[#C99A4A]/70"
              }`}
            />
          )}
        </div>
      </button>

      {/* Interactive Tooltip on Hover */}
      {isBooked && (
        <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
          <div className="bg-[#191512] text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap space-y-0.5 border border-white/10">
            <div className="font-bold flex items-center gap-1">
              <User className="size-3 text-[#C99A4A]" />
              <span>{passengerName || "Booked Passenger"}</span>
            </div>
            {ticketId && (
              <div className="text-[10px] text-[#A69F97] font-mono">
                Ticket: #{ticketId}
              </div>
            )}
            <div className="text-[9px] text-[#065F46] font-bold">Confirmed Booking</div>
          </div>
          <div className="w-2 h-1 border-x-4 border-x-transparent border-t-4 border-t-[#191512]" />
        </div>
      )}
    </div>
  );
}

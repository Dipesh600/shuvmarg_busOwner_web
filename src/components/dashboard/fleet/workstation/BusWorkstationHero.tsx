"use client";

import React from "react";
import { BusFront, Clock, Route, User, ShieldCheck, Sparkles } from "lucide-react";
import type { FleetOperationalContext } from "@/features/operator-dashboard/fleet-operational-context";

interface BusWorkstationHeroProps {
  busName: string;
  busNumber: string;
  busType?: string;
  totalSeats?: number;
  frontImage?: string | null;
  imageLoading?: boolean;
  operational: FleetOperationalContext;
}

export function BusWorkstationHero({
  busName,
  busNumber,
  busType = "Deluxe AC",
  totalSeats = 36,
  frontImage,
  imageLoading,
  operational,
}: BusWorkstationHeroProps) {
  return (
    <div
      style={{
        background:
          "radial-gradient(ellipse at 92% 0%, rgba(220, 101, 94, 0.16) 0%, rgba(220, 101, 94, 0.07) 28%, rgba(220, 101, 94, 0.025) 48%, rgba(255, 255, 255, 0) 68%), #ffffff",
      }}
      className="rounded-2xl sm:rounded-3xl border border-[#EDE7E0] p-4 sm:p-5.5 shadow-xs relative overflow-hidden"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-5 relative z-10">
        {/* Left: Bus Image & Identity */}
        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
          <div className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-2xl bg-[#FAF8F5] border border-[#EDE7E0] flex items-center justify-center">
            {frontImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={frontImage}
                alt={busName}
                className="size-full object-cover rounded-2xl"
              />
            ) : imageLoading ? (
              <div className="flex size-full items-center justify-center animate-pulse">
                <BusFront className="size-8 text-[#B5ABA1]" />
              </div>
            ) : (
              <BusFront className="size-9 text-[#7A1D1B]" />
            )}
          </div>

          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-[#191512] tracking-tight truncate">
                {busName}
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#065F46]">
                <span className="size-1.5 rounded-full bg-[#059669] animate-pulse" />
                <span>Live in service</span>
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="inline-flex items-center font-mono font-bold text-[#2E2824] bg-[#F0ECE6] px-2 py-0.5 rounded-md">
                {busNumber}
              </span>
              <span className="text-[#C5BCB3]">·</span>
              <span className="font-semibold text-[#554E48] uppercase tracking-wider">
                {busType}
              </span>
              <span className="text-[#C5BCB3]">·</span>
              <span className="font-semibold text-[#746E69]">
                {totalSeats} passenger seats
              </span>
            </div>
          </div>
        </div>

        {/* Right: Operational Route & Crew Pill Card */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4 p-3.5 sm:p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE7E0]/90">
          {/* Route Section */}
          <div className="space-y-1 sm:pr-4 sm:border-r sm:border-[#EDE7E0]">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#746E69]">
              <Route className="size-3.5 text-[#7A1D1B]" />
              <span>Assigned Route</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#191512] truncate">
              {operational.routeText || "Route configured"}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-[#554E48]">
              <Clock className="size-3 text-[#746E69]" />
              <span>{operational.scheduleText || "Regular schedule"}</span>
            </div>
          </div>

          {/* Crew Section */}
          <div className="space-y-1 sm:pl-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#746E69]">
              <User className="size-3.5 text-[#7A1D1B]" />
              <span>Assigned Crew</span>
            </div>
            <p className="text-xs font-semibold text-[#191512] truncate">
              Driver: <span className="font-bold">{operational.driverName || "Assigned"}</span>
            </p>
            <p className="text-xs font-semibold text-[#554E48] truncate">
              Conductor: <span className="font-medium text-[#2E2824]">{operational.conductorName || "Assigned"}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

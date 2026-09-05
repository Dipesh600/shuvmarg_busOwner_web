"use client";

import React from "react";
import Image from "next/image";
import { Lock } from "lucide-react";

export default function LockedOperationsPreview() {
  const rows = [
    {
      id: "routes",
      title: "Routes & Stops",
      description: "Available after your bus is approved.",
      iconPath: "/operator-dashboard/icons/routes.svg",
    },
    {
      id: "trips",
      title: "Trip Schedules",
      description: "Available after stops and timings are added.",
      iconPath: "/operator-dashboard/icons/trips.svg",
    },
    {
      id: "bookings",
      title: "Live Bookings",
      description: "Bookings will appear after your first trip goes live.",
      iconPath: "/operator-dashboard/icons/bookings.svg",
    },
    {
      id: "finance",
      title: "Finance & Settlements",
      description: "Settlements will appear after ticket sales begin.",
      iconPath: "/operator-dashboard/icons/finance.svg",
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-[#EEE8E2] p-6 sm:p-7 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#EEE8E2]">
        <div>
          <h3
            className="text-base font-bold text-[#161311]"
            style={{ fontFamily: '"Neue Machina", system-ui, sans-serif' }}
          >
            What unlocks next
          </h3>
          <p className="text-xs text-[#746E69] mt-0.5 font-medium">
            These tools open as your bus gets ready for passengers.
          </p>
        </div>
        <span className="text-[10px] font-bold text-[#746E69] uppercase tracking-wider bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#EEE8E2]">
          Coming up
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className="p-3.5 rounded-2xl bg-[#FAF8F5]/80 border border-[#EEE8E2] flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white border border-[#EEE8E2] flex items-center justify-center flex-shrink-0">
                <Image
                  src={row.iconPath}
                  alt=""
                  width={16}
                  height={16}
                  className="opacity-60"
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#161311] truncate">
                  {row.title}
                </div>
                <div className="text-[11px] text-[#746E69] truncate">
                  {row.description}
                </div>
              </div>
            </div>
            <Lock className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

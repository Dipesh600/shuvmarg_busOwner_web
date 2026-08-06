"use client";

import React from "react";
import { Route, CalendarDays, Ticket, Wallet, Lock } from "lucide-react";

export default function LockedOperationsPreview() {
  const previews = [
    {
      id: "routes",
      icon: Route,
      title: "Routes & Stops",
      description: "Routes unlock after business verification.",
      statusText: "Locked until business approval",
    },
    {
      id: "trips",
      icon: CalendarDays,
      title: "Trip Schedules",
      description: "Trips will appear after route schedule assignment.",
      statusText: "Locked until fleet & route approval",
    },
    {
      id: "bookings",
      icon: Ticket,
      title: "Live Bookings",
      description: "Bookings will appear after your first trip goes live.",
      statusText: "Awaiting operational activation",
    },
    {
      id: "finance",
      icon: Wallet,
      title: "Finance & Settlements",
      description: "Settlements will appear after ticket sales begin.",
      statusText: "Awaiting live revenue activity",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3
          className="text-base font-bold text-neutral-900"
          style={{ fontFamily: '"Neue Machina", system-ui, sans-serif' }}
        >
          Operational Capabilities Preview
        </h3>
        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
          Future Operations
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {previews.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-neutral-200 p-5 flex items-start gap-4 shadow-2xs relative"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-500 flex-shrink-0">
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-neutral-800 truncate">
                    {item.title}
                  </h4>
                  <Lock className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {item.description}
                </p>
                <div className="pt-1 text-[11px] font-medium text-neutral-400">
                  {item.statusText}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

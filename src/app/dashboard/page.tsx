"use client";

import React from "react";

import { logout } from "@/lib/auth";
import { useRouter } from "next/navigation";

const kpis = [
  {
    label: "Today's Revenue",
    value: "Rs. 45,200",
    change: "+12.5%",
    changeType: "positive",
    icon: "account_balance_wallet",
  },
  {
    label: "Active Fleet",
    value: "18 / 24",
    change: "3 delayed",
    changeType: "warning",
    icon: "directions_bus",
  },
  {
    label: "Seats Booked Today",
    value: "142",
    change: "+8 vs yesterday",
    changeType: "positive",
    icon: "confirmation_number",
  },
  {
    label: "Occupancy Rate",
    value: "73%",
    change: "Healthy",
    changeType: "neutral",
    icon: "reduce_capacity",
  },
];

const weekData = [
  { day: "Sun", val: 40 },
  { day: "Mon", val: 70 },
  { day: "Tue", val: 45 },
  { day: "Wed", val: 90 },
  { day: "Thu", val: 65 },
  { day: "Fri", val: 100 },
  { day: "Sat", val: 85 },
];

const recentBookings = [
  { id: "BK-9821", route: "KTM → Pokhara", passenger: "Aarav Sharma", seat: "A3", amount: "Rs. 1,200", status: "Confirmed" },
  { id: "BK-9820", route: "KTM → Chitwan", passenger: "Sita Basnet", seat: "B7", amount: "Rs. 950", status: "Confirmed" },
  { id: "BK-9819", route: "PKR → Butwal", passenger: "Ramesh KC", seat: "C2", amount: "Rs. 700", status: "Pending" },
  { id: "BK-9818", route: "KTM → Dharan", passenger: "Priya Rai", seat: "A8", amount: "Rs. 1,600", status: "Confirmed" },
  { id: "BK-9817", route: "KTM → Pokhara", passenger: "Bikash Tamang", seat: "D4", amount: "Rs. 1,200", status: "Cancelled" },
];

const statusColors: Record<string, string> = {
  Confirmed: "#2E7D32",
  Pending: "#F59E0B",
  Cancelled: "#D32F2F",
};

const changeColors: Record<string, string> = {
  positive: "#2E7D32",
  warning: "#F59E0B",
  neutral: "#888888",
};

export default function DashboardPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <div className="w-full min-h-full p-6 lg:p-8">

      {/* ── Page Header ────────────────────────────────────── */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Dashboard Overview
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Monday, 23 June 2025 · Shuvmarg Travels
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSignOut} className="btn-ghost text-sm text-red-600 hover:bg-red-50 flex items-center h-10 px-4 rounded-xl font-semibold transition-colors">
            <span className="material-symbols-rounded mr-1.5 text-[18px]">logout</span>
            Sign Out
          </button>
          <button className="btn-primary text-sm flex items-center h-10 px-4 rounded-xl font-semibold transition-colors">
            <span className="material-symbols-rounded mr-1.5 text-[18px]">add</span>
            Schedule Trip
          </button>
        </div>
      </div>

      {/* ── KPI Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-ivory border border-neutral-200 flex items-center justify-center">
                <span className="material-symbols-rounded text-maroon text-[18px]">
                  {kpi.icon}
                </span>
              </div>
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  color: changeColors[kpi.changeType],
                  background: `${changeColors[kpi.changeType]}15`,
                }}
              >
                {kpi.change}
              </span>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                {kpi.label}
              </div>
              <div className="text-2xl font-bold text-neutral-900 tracking-tight">
                {kpi.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Weekly Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1">
                Weekly Revenue
              </div>
              <div className="text-xl font-bold text-neutral-900">Rs. 3,12,400</div>
            </div>
            <button className="btn-ghost text-xs flex items-center gap-1">
              This Week
              <span className="material-symbols-rounded text-[16px]">expand_more</span>
            </button>
          </div>

          {/* Bar chart */}
          <div className="flex-1 flex items-end gap-2 md:gap-3 pb-4 border-b border-neutral-100" style={{ minHeight: 160 }}>
            {weekData.map((col, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                <div className="w-full relative flex items-end justify-center" style={{ height: 140 }}>
                  <div
                    className="w-full rounded-t-md transition-all duration-300"
                    style={{
                      height: `${col.val}%`,
                      background: col.val === 100
                        ? "#7A1D1B"
                        : col.day === "Sat" || col.day === "Wed"
                        ? "rgba(122, 29, 27, 0.60)"
                        : "#DDDDDD",
                    }}
                  />
                </div>
                <span className="text-[11px] font-medium text-neutral-400">{col.day}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: "#7A1D1B" }} />
              <span className="text-xs text-neutral-500">Peak day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: "rgba(122,29,27,0.6)" }} />
              <span className="text-xs text-neutral-500">Above avg.</span>
            </div>
          </div>
        </div>

        {/* Upcoming Departures */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4">
            Today's Departures
          </div>
          <div className="flex flex-col gap-3">
            {[
              { time: "06:00", route: "KTM → Pokhara", bus: "BA 2 KHA 3490", occupancy: 85 },
              { time: "07:30", route: "KTM → Chitwan", bus: "BA 3 KHA 1102", occupancy: 62 },
              { time: "09:00", route: "PKR → Butwal", bus: "GA 1 CHA 7841", occupancy: 91 },
              { time: "10:30", route: "KTM → Dharan", bus: "BA 2 KHA 5533", occupancy: 40 },
            ].map((dep, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-neutral-100 last:border-0">
                <div className="text-xs font-bold text-neutral-900 w-10 flex-shrink-0">{dep.time}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-neutral-900 truncate">{dep.route}</div>
                  <div className="text-[10px] text-neutral-400 truncate">{dep.bus}</div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div
                    className="text-[11px] font-bold"
                    style={{
                      color:
                        dep.occupancy >= 80
                          ? "#2E7D32"
                          : dep.occupancy >= 50
                          ? "#F59E0B"
                          : "#D32F2F",
                    }}
                  >
                    {dep.occupancy}%
                  </div>
                  <div className="text-[10px] text-neutral-400">full</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Bookings Table ───────────────────────────── */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="text-xs font-bold uppercase tracking-widest text-neutral-500">
            Recent Bookings
          </div>
          <button className="text-xs font-semibold text-maroon hover:underline">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                {["Booking ID", "Route", "Passenger", "Seat", "Amount", "Status"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-neutral-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b, i) => (
                <tr
                  key={i}
                  className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-neutral-600">{b.id}</td>
                  <td className="px-6 py-4 text-neutral-900 font-medium text-xs">{b.route}</td>
                  <td className="px-6 py-4 text-neutral-700 text-xs">{b.passenger}</td>
                  <td className="px-6 py-4 text-neutral-700 text-xs">{b.seat}</td>
                  <td className="px-6 py-4 font-semibold text-neutral-900 text-xs">{b.amount}</td>
                  <td className="px-6 py-4">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        color: statusColors[b.status],
                        background: `${statusColors[b.status]}12`,
                      }}
                    >
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

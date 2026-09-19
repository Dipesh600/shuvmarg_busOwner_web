"use client";

import React, { useEffect, useState } from "react";
import {
  Percent,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowDownRight,
  Receipt,
  Users,
  Banknote,
  RefreshCw,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import {
  getFleetFinancials,
  type FleetFinancialsData,
  type WorkstationFinancialPeriod,
  type WorkstationTripFinancials,
} from "@/features/fleet-financials/api";

interface BusWorkstationFinancialTabProps {
  fleetId: string;
}

const formatCurrency = (n?: number) => `NPR ${(n || 0).toLocaleString()}`;

const formatDate = (d: string) => {
  try {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return d;
  }
};

const getDirection = (variant?: WorkstationTripFinancials["variantId"]) => {
  if (!variant?.corridorId) return "—";
  const o = variant.corridorId.originId?.name || "?";
  const d = variant.corridorId.destinationId?.name || "?";
  return variant.direction === "RETURN" ? `${d} → ${o}` : `${o} → ${d}`;
};

export function BusWorkstationFinancialTab({ fleetId }: BusWorkstationFinancialTabProps) {
  const [data, setData] = useState<FleetFinancialsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFinancials = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFleetFinancials(fleetId);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load financials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Fetch the fleet report for the active workstation.
    void loadFinancials();
  }, [fleetId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 w-64 bg-[#EDE7E0]/60 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 bg-white/60 border border-[#EDE7E0] rounded-2xl p-5 space-y-3">
              <div className="h-5 w-24 bg-[#EDE7E0]/80 rounded" />
              <div className="h-8 w-36 bg-[#EDE7E0] rounded" />
              <div className="h-px bg-[#EDE7E0]" />
              <div className="h-4 w-full bg-[#EDE7E0]/50 rounded" />
              <div className="h-4 w-full bg-[#EDE7E0]/50 rounded" />
            </div>
          ))}
        </div>
        <div className="h-64 bg-white/60 border border-[#EDE7E0] rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5]/60 p-6 text-center space-y-3">
        <div className="size-10 rounded-full bg-[#FEE2E2] text-[#B91C1C] flex items-center justify-center mx-auto">
          <AlertCircle className="size-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#991B1B]">Unable to load financial reports</h4>
          <p className="text-xs text-[#7F1D1D] mt-1">{error}</p>
        </div>
        <button
          onClick={() => void loadFinancials()}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-[#FCA5A5] text-xs font-bold text-[#991B1B] hover:bg-[#FFF5F5] transition-colors"
        >
          <RefreshCw className="size-3.5" />
          <span>Try again</span>
        </button>
      </div>
    );
  }

  const financials = data?.financials;
  if (!financials) return null;

  const periods: { key: string; label: string; periodData: WorkstationFinancialPeriod }[] = [
    { key: "thisMonth", label: "This Month", periodData: financials.thisMonth },
    { key: "lastMonth", label: "Last Month", periodData: financials.lastMonth },
    { key: "allTime", label: "All Time", periodData: financials.allTime },
  ];

  // Trend: compare this month vs last month
  const thisGross = financials.thisMonth?.gross || 0;
  const lastGross = financials.lastMonth?.gross || 0;
  const trendPct = lastGross > 0 ? Math.round(((thisGross - lastGross) / lastGross) * 100) : 0;
  const trendUp = trendPct >= 0;

  const recentTrips = data?.recentTrips || [];

  return (
    <div className="space-y-6">
      {/* Commission rate and trend badge banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDE7E0]/80 pb-3.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#EDE7E0] text-xs font-bold text-[#191512] shadow-xs">
            <Percent className="size-3 text-[#7A1D1B]" />
            <span>Platform Commission: {financials.commissionRate}%</span>
          </div>
          {lastGross > 0 && (
            <div
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                trendUp
                  ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]"
                  : "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
              }`}
            >
              {trendUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              <span>
                {trendPct > 0 ? "+" : ""}
                {trendPct}% vs last month
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#746E69]">
          <Clock className="size-3.5" />
          <span>Settlement cycle: <strong>T+1 standard</strong></span>
        </div>
      </div>

      {/* 3-window summary cards: This Month, Last Month, All Time */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {periods.map(({ key, label, periodData }) => (
          <div
            key={key}
            className="rounded-2xl bg-white/90 border border-[#EDE7E0] shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            {/* Header */}
            <div className="border-b border-[#EDE7E0] bg-[#FAF8F5]/80 px-5 py-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#191512]">{label}</span>
              {key === "thisMonth" && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#7A1D1B]/10 text-[#7A1D1B]">
                  Current
                </span>
              )}
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Gross */}
              <div>
                <p className="text-2xl font-black tracking-tight text-[#191512]">
                  {formatCurrency(periodData.gross)}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-[#746E69] font-bold mt-0.5">
                  Gross Revenue
                </p>
              </div>

              <div className="h-px bg-[#EDE7E0]/80" />

              {/* Deductions */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-[#554E48]">
                  <span className="flex items-center gap-1.5">
                    <Minus className="size-3 text-[#746E69]" /> Commission ({financials.commissionRate}%)
                  </span>
                  <span className="font-semibold text-[#191512]">-{formatCurrency(periodData.commission)}</span>
                </div>
                <div className="flex justify-between items-center text-[#554E48]">
                  <span className="flex items-center gap-1.5">
                    <ArrowDownRight className="size-3 text-[#B91C1C]" /> Refunds
                  </span>
                  <span className="font-semibold text-[#B91C1C]">-{formatCurrency(periodData.refunds)}</span>
                </div>
              </div>

              <div className="h-px bg-[#EDE7E0]/80" />

              {/* Net */}
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-xs font-bold text-[#191512]">Net Revenue</span>
                <span className="text-lg font-black text-[#7A1D1B]">{formatCurrency(periodData.net)}</span>
              </div>

              {/* Volume Counts */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#EDE7E0]/60">
                <div className="flex items-center gap-1.5 text-xs text-[#746E69]">
                  <Receipt className="size-3.5 text-[#746E69]" />
                  <span>
                    <strong className="text-[#191512]">{periodData.bookingCount}</strong> bookings
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#746E69]">
                  <Users className="size-3.5 text-[#746E69]" />
                  <span>
                    <strong className="text-[#191512]">{periodData.passengerCount}</strong> passengers
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Per-trip revenue table */}
      <div className="rounded-2xl bg-white/90 border border-[#EDE7E0] shadow-sm overflow-hidden space-y-0">
        <div className="border-b border-[#EDE7E0] bg-[#FAF8F5]/80 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="size-4 text-[#7A1D1B]" />
            <h4 className="text-sm font-bold text-[#191512]">Per-Trip Revenue & Occupancy</h4>
          </div>
          <span className="text-xs text-[#746E69]">
            Recent {Math.min(recentTrips.length, 20)} departures
          </span>
        </div>

        {recentTrips.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm font-bold text-[#191512]">No completed or scheduled trips yet</p>
            <p className="text-xs text-[#746E69]">
              Revenue per departure will automatically populate here as trips run and tickets are booked.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#EDE7E0] bg-[#FAF8F5]/40">
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] text-[#746E69]">Date</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] text-[#746E69]">Direction</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] text-[#746E69]">Passengers</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] text-[#746E69]">Gross</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] text-[#746E69]">Occ %</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] text-[#746E69]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE7E0]">
                {recentTrips.slice(0, 20).map((trip) => {
                  const s = trip.stats || {};
                  const occ = s.occupancyPct || 0;
                  const occColor =
                    occ >= 80
                      ? "text-[#065F46] font-bold"
                      : occ >= 50
                      ? "text-[#B45309] font-bold"
                      : "text-[#746E69]";

                  return (
                    <tr key={trip._id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#191512] whitespace-nowrap">
                        {formatDate(trip.tripDate)}
                      </td>
                      <td className="py-3 px-4 text-[#191512] whitespace-nowrap">
                        {getDirection(trip.variantId)}
                      </td>
                      <td className="py-3 px-4 text-[#191512]">
                        {s.booked ?? s.seatsSold ?? 0}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#191512] whitespace-nowrap">
                        {formatCurrency(s.revenue)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={occColor}>{occ}%</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-block text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-[#EDE7E0] bg-white text-[#554E48]">
                          {trip.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

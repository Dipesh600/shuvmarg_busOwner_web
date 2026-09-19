"use client";

import React from "react";
import OwnerDocumentGallery from "@/features/vehicle-documents/OwnerDocumentGallery";
import {
  CheckCircle2,
  LayoutGrid,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { FleetOperationalContext } from "@/features/operator-dashboard/fleet-operational-context";
import type { OperatorFleetListItem } from "@/features/operator-dashboard/operator-dashboard-contract";
import type { OwnerTrip } from "@/features/trip-seat-controls/types";
import type { FleetDetailPayload } from "@/features/fleet-registration/api";
import type { WorkstationTabKey } from "./BusWorkstationTabBar";
import { BusWorkstationOperationsTab } from "./BusWorkstationOperationsTab";
import { BusWorkstationCrewTab } from "./BusWorkstationCrewTab";
import { BusWorkstationFinancialTab } from "./BusWorkstationFinancialTab";

interface BusWorkstationCanvasProps {
  activeTab: WorkstationTabKey;
  fleetId: string;
  fleet: OperatorFleetListItem;
  operational: FleetOperationalContext;
  detail?: FleetDetailPayload | null;
  activeTrip?: OwnerTrip | null;
  allTrips?: OwnerTrip[];
  totalSeats: number;
  dailySales?: { ticketsSold: number; bookingSales: number } | null;
  onViewSeatLayout?: () => void;
}

const gradientStyle = {
  background:
    "radial-gradient(ellipse at 92% 0%, rgba(220, 101, 94, 0.16) 0%, rgba(220, 101, 94, 0.07) 28%, rgba(220, 101, 94, 0.025) 48%, rgba(255, 255, 255, 0) 68%), #ffffff",
};

export function BusWorkstationCanvas({
  activeTab,
  fleetId,
  fleet,
  operational,
  detail,
  activeTrip,
  allTrips,
  totalSeats,
  dailySales,
  onViewSeatLayout,
}: BusWorkstationCanvasProps) {
  const ticketsSold = dailySales?.ticketsSold ?? operational.ticketsSoldCount ?? 0;
  const revenue = dailySales?.bookingSales ?? operational.ticketsSoldAmount ?? 0;

  const isDocuments = activeTab === "documents";

  return (
    <div
      style={isDocuments ? undefined : gradientStyle}
      className={`rounded-2xl sm:rounded-3xl p-4 sm:p-5.5 shadow-xs min-h-[320px] ${
        isDocuments
          ? "border border-neutral-200 bg-white"
          : "border border-[#EDE7E0]"
      }`}
    >
      {/* 1. SERVICE OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDE7E0]/80 pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#191512]">Vehicle Service Overview</h3>
              <p className="text-xs text-[#746E69]">Active passenger capacity, corridor status and interior layout.</p>
            </div>
            {onViewSeatLayout && (
              <button
                type="button"
                onClick={onViewSeatLayout}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-[#EDE7E0] px-4 py-2 text-xs font-bold text-[#191512] hover:bg-[#FAF8F5] transition shadow-2xs cursor-pointer shrink-0"
              >
                <LayoutGrid className="size-3.5 text-[#7A1D1B]" />
                <span>View Seat Arrangement</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/80 border border-[#EDE7E0] p-4 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#746E69]">Configuration</span>
              <p className="text-sm font-bold text-[#191512]">{detail?.busType || "Deluxe AC"}</p>
              <p className="text-xs text-[#554E48]">{totalSeats} registered places</p>
            </div>
            <div className="rounded-2xl bg-white/80 border border-[#EDE7E0] p-4 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#746E69]">Route Corridor</span>
              <p className="text-sm font-bold text-[#191512] truncate">{operational.routeText || "Active Corridor"}</p>
              <p className="text-xs text-[#065F46] font-semibold">Permit active & verified</p>
            </div>
            <div className="rounded-2xl bg-white/80 border border-[#EDE7E0] p-4 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#746E69]">Daily Dispatch</span>
              <p className="text-sm font-bold text-[#191512]">{operational.scheduleText || "Regular Daily"}</p>
              <p className="text-xs text-[#554E48]">Origin terminal board</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. OPERATIONS */}
      {activeTab === "operations" && (
        <BusWorkstationOperationsTab
          fleetId={fleetId}
          operational={operational}
          activeTrip={activeTrip}
          allTrips={allTrips}
          totalSeats={totalSeats}
          dailySales={dailySales}
          seatLayout={detail?.seatLayout?.layout}
        />
      )}

      {/* 3. SCHEDULE */}
      {activeTab === "schedule" && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-[#191512]">Departure Timetable</h3>
          <div className="rounded-2xl bg-white/90 border border-[#EDE7E0] p-5 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#EDE7E0]">
              <span className="font-bold text-[#191512]">Regular Departure</span>
              <span className="font-mono font-bold text-[#7A1D1B]">{operational.scheduleText}</span>
            </div>
            <p className="text-xs text-[#554E48]">Approved corridor stops: <strong className="text-[#191512]">{operational.routeText}</strong></p>
          </div>
        </div>
      )}

      {/* 4. TIMELINE */}
      {activeTab === "timeline" && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-[#191512]">Operational Timeline</h3>
          <div className="rounded-2xl bg-white/90 border border-[#EDE7E0] p-5 space-y-4">
            <div className="flex items-start gap-3 text-xs">
              <CheckCircle2 className="size-4 text-[#065F46] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#191512]">Vehicle inspection & KYC approved</p>
                <p className="text-[#746E69]">Bluebook and commercial permit verified by Shuvmarg.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-xs">
              <CheckCircle2 className="size-4 text-[#065F46] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#191512]">Route and operating timings published</p>
                <p className="text-[#746E69]">{operational.routeText} ({operational.scheduleText})</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. FINANCIAL */}
      {activeTab === "financial" && (
        <BusWorkstationFinancialTab fleetId={fleetId} />
      )}

      {/* 6. CREW */}
      {activeTab === "crew" && (
        <BusWorkstationCrewTab
          fleet={fleet}
          fleetId={fleetId}
          detail={detail}
        />
      )}

      {activeTab === "documents" && <OwnerDocumentGallery fleetId={fleetId} manifest={detail?.documents || {}} />}

      {/* 8. INTELLIGENCE */}
      {activeTab === "intelligence" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EDE7E0]/80 pb-3">
            <Sparkles className="size-4 text-[#7A1D1B]" />
            <h3 className="text-base font-bold text-[#191512]">Operational Intelligence</h3>
          </div>
          <div className="rounded-2xl bg-white/90 border border-[#EDE7E0] p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#191512]">
              <span className="size-2 rounded-full bg-[#059669]" />
              <span>Optimal Route Performance</span>
            </div>
            <p className="text-xs text-[#554E48] leading-relaxed">
              Occupancy on this corridor peaks towards weekends. Consider setting festival or weekend seasonal pricing early.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

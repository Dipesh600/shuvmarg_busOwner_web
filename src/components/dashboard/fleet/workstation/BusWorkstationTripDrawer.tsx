"use client";

import React, { useState } from "react";
import { X, Clock, Users, FileText } from "lucide-react";
import type { OwnerTrip, TripSeatControl } from "@/features/trip-seat-controls/types";
import type { TripManifest } from "@/features/owner-workspace/api";
import { useOwnerResource } from "@/features/owner-workspace/use-owner-resource";
import type { SeatLayoutV3 } from "@/features/seat-layout-v3/types";
import { BusWorkstationDrawerDetailsTab } from "./BusWorkstationDrawerDetailsTab";
import { BusWorkstationDrawerManifestTab } from "./BusWorkstationDrawerManifestTab";

interface BusWorkstationTripDrawerProps {
  isOpen: boolean;
  trip: OwnerTrip | null;
  totalSeats: number;
  fallbackRouteText?: string;
  layout?: SeatLayoutV3 | null;
  initialTab?: "details" | "manifest";
  manifest: TripManifest | null;
  manifestLoading: boolean;
  manifestPage: number;
  onManifestPageChange: (page: number) => void;
  onClose: () => void;
  onManageService: (tripId: string) => void;
}

export function BusWorkstationTripDrawer({
  isOpen,
  trip,
  totalSeats,
  fallbackRouteText,
  layout,
  initialTab = "details",
  manifest,
  manifestLoading,
  manifestPage,
  onManifestPageChange,
  onClose,
  onManageService,
}: BusWorkstationTripDrawerProps) {
  const [tab, setTab] = useState<"details" | "manifest">(initialTab);

  const controlResource = useOwnerResource<TripSeatControl>(
    trip?._id ? `/busowner/seat-layout-v3/trips/${trip._id}` : null
  );

  const [prevProps, setPrevProps] = useState({ isOpen, initialTab });
  if (prevProps.isOpen !== isOpen || prevProps.initialTab !== initialTab) {
    setPrevProps({ isOpen, initialTab });
    if (isOpen) {
      setTab(initialTab);
    }
  }

  if (!isOpen || !trip) return null;

  const isLive = ["in-transit", "boarding"].includes((trip.status || "").toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end bg-black/40 backdrop-blur-xs">
      {/* Backdrop click to dismiss */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Responsive Drawer Shell */}
      <div className="relative z-10 w-full sm:max-w-md max-h-[88vh] sm:max-h-full sm:h-full flex flex-col rounded-t-3xl sm:rounded-t-none sm:rounded-l-3xl border-t sm:border-t-0 sm:border-l border-[#EDE7E0] bg-white shadow-2xl overflow-hidden">
        {/* Mobile Grab Bar */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#D5CDC5]" />
        </div>

        {/* Drawer Header */}
        <div className="px-5 py-3.5 border-b border-[#EDE7E0] bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-9 rounded-xl bg-[#FFF5F4] flex items-center justify-center text-[#7A1D1B] shrink-0 border border-[#F8C9C7]">
              <Clock className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#191512] truncate">
                  {trip.departureTime} Departure
                </h3>
                {isLive && (
                  <span className="text-[9px] font-bold uppercase bg-[#ECFDF5] text-[#065F46] px-1.5 py-0.5 rounded border border-[#A7F3D0]">
                    Live
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#746E69] truncate">
                {trip.directionLabel || fallbackRouteText || "Corridor Route"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="size-8 rounded-full flex items-center justify-center text-[#746E69] hover:bg-[#EDE7E0]/60 transition cursor-pointer shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#EDE7E0] px-5 bg-white">
          <button
            type="button"
            onClick={() => setTab("details")}
            className={`flex items-center gap-1.5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer mr-5 ${
              tab === "details"
                ? "border-[#7A1D1B] text-[#7A1D1B]"
                : "border-transparent text-[#746E69] hover:text-[#191512]"
            }`}
          >
            <FileText className="size-3.5" />
            <span>Trip Details</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("manifest")}
            className={`flex items-center gap-1.5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
              tab === "manifest"
                ? "border-[#7A1D1B] text-[#7A1D1B]"
                : "border-transparent text-[#746E69] hover:text-[#191512]"
            }`}
          >
            <Users className="size-3.5" />
            <span>Manifest</span>
            {trip.ticketsSold !== undefined && trip.ticketsSold > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#FAF8F5] text-[#7A1D1B] border border-[#EDE7E0]">
                {trip.ticketsSold}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "details" ? (
            <BusWorkstationDrawerDetailsTab
              trip={trip}
              totalSeats={totalSeats}
              fallbackRouteText={fallbackRouteText}
              layout={layout}
              control={controlResource.data || null}
              manifest={manifest}
              onSwitchToManifest={() => setTab("manifest")}
              onManageService={onManageService}
            />
          ) : (
            <BusWorkstationDrawerManifestTab
              manifest={manifest}
              loading={manifestLoading}
              page={manifestPage}
              onPageChange={onManifestPageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}

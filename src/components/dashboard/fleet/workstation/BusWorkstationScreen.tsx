"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  OperatorFleetListItem,
  OperatorFleetSetupStatus,
} from "@/features/operator-dashboard/operator-dashboard-contract";
import type { FleetDetailPayload, FleetListItem } from "@/features/fleet-registration/api";
import {
  getBusFrontImageUrl,
  getCachedBusFrontImageUrl,
} from "@/features/fleet-registration/fleet-image-cache";
import {
  resolveFleetOperationalContext,
  findActiveTripForFleet,
  dailyFleetSales,
} from "@/features/operator-dashboard/fleet-operational-context";
import { nepalToday } from "@/features/owner-workspace/api";
import type { OwnerTrip } from "@/features/trip-seat-controls/types";
import { listOwnerTrips } from "@/features/trip-seat-controls/api";
import { BusWorkstationHero } from "./BusWorkstationHero";
import { BusWorkstationTabBar, type WorkstationTabKey, WORKSTATION_TABS } from "./BusWorkstationTabBar";
import { BusWorkstationCanvas } from "./BusWorkstationCanvas";
import { FleetSeatMapModal } from "@/app/dashboard/fleet/components/FleetSeatMapModal";

interface BusWorkstationScreenProps {
  fleet: OperatorFleetListItem;
  setup: OperatorFleetSetupStatus;
  detail: FleetDetailPayload | null;
  onOpenSetup?: () => void;
}

export function BusWorkstationScreen({
  fleet,
  setup,
  detail,
}: BusWorkstationScreenProps) {
  const router = useRouter();
  const requestedTab = useSearchParams().get("tab");
  const [selectedTab, setSelectedTab] = useState<{ tab: WorkstationTabKey; query: string | null } | null>(null);
  const isValidTab = (t: string | null): t is WorkstationTabKey =>
    Boolean(t && WORKSTATION_TABS.some((item) => item.key === t));
  const activeTab =
    selectedTab?.query === requestedTab
      ? selectedTab.tab
      : isValidTab(requestedTab)
        ? requestedTab
        : "overview";
  const [trips, setTrips] = useState<OwnerTrip[]>([]);
  const [tripsLoaded, setTripsLoaded] = useState(false);
  const [seatMapOpen, setSeatMapOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    listOwnerTrips()
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setTrips(data);
          setTripsLoaded(true);
        }
      })
      .catch(() => {
        if (isMounted) setTripsLoaded(true);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const [frontImage, setFrontImage] = useState<string | null>(() =>
    getCachedBusFrontImageUrl(fleet.fleetId),
  );
  const [imageLoading, setImageLoading] = useState<boolean>(!frontImage);

  useEffect(() => {
    let active = true;
    const changed = (event: Event) => {
      const next = (event as CustomEvent<{ fleetId: string; frontImage?: { imageId: string | null; index: number } }>).detail;
      if (next.fleetId !== fleet.fleetId) return;
      setFrontImage(null); setImageLoading(true);
      void getBusFrontImageUrl(fleet.fleetId, null, next.frontImage).then(url => { if (active) { setFrontImage(url); setImageLoading(false); } });
    };
    window.addEventListener("fleet-front-image-changed", changed);
    return () => { active = false; window.removeEventListener("fleet-front-image-changed", changed); };
  }, [fleet.fleetId]);

  useEffect(() => {
    if (frontImage) return;
    let isMounted = true;
    getBusFrontImageUrl(fleet.fleetId, null, fleet.frontImage)
      .then((url) => {
        if (isMounted) {
          setFrontImage(url);
          setImageLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setImageLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [fleet.fleetId, fleet.frontImage, frontImage]);

  const activeTrip = findActiveTripForFleet(trips, fleet.fleetId);
  const totalSeats = detail?.seatLayout?.totalPlaces || fleet.totalSeats || 36;
  const operational = resolveFleetOperationalContext(
    setup,
    activeTrip,
    detail?.route ? `${detail.route.origin || ""} → ${detail.route.destination || ""}` : null,
    null,
    fleet.busNumber,
    totalSeats,
  );

  const salesToday = dailyFleetSales(tripsLoaded ? trips : null, fleet.fleetId, nepalToday());

  const fleetListItem: FleetListItem = {
    fleetId: fleet.fleetId,
    fleetCode: fleet.fleetCode,
    busName: fleet.busName,
    busNumber: fleet.busNumber,
    busType: detail?.busType || fleet.busType || "DELUXE",
    totalSeats,
    approvalStatus: fleet.approvalStatus,
    status: fleet.setupComplete ? "active" : "inactive",
    rejectionReason: fleet.rejectionReason,
    setupComplete: fleet.setupComplete,
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-3.5">
      {/* 1. Hero Card (Dominant Visual Anchor with Signature Radial Gradient) */}
      <BusWorkstationHero
        busName={fleet.busName}
        busNumber={fleet.busNumber}
        busType={detail?.busType || fleet.busType}
        totalSeats={totalSeats}
        frontImage={frontImage}
        imageLoading={imageLoading}
        operational={operational}
      />

      {/* 2. Responsive Workstation Navigation Bar (Replacing 4 metric cards) */}
      <BusWorkstationTabBar
        activeTab={activeTab}
        onSelectTab={tab => setSelectedTab({ tab, query: requestedTab })}
      />

      {/* 3. The Workstation Canvas Area */}
      <BusWorkstationCanvas
        fleetId={fleet.fleetId}
        fleet={fleet}
        activeTab={activeTab}
        operational={operational}
        detail={detail}
        activeTrip={activeTrip}
        allTrips={trips}
        totalSeats={totalSeats}
        dailySales={salesToday}
        onViewSeatLayout={() => setSeatMapOpen(true)}
      />

      {/* Seat Map Modal */}
      {seatMapOpen && (
        <FleetSeatMapModal
          fleet={fleetListItem}
          onClose={() => setSeatMapOpen(false)}
          onOpenStudio={(fId) =>
            router.push(`/dashboard/seat-layouts?fleetId=${encodeURIComponent(fId)}`)
          }
        />
      )}
    </div>
  );
}

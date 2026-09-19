"use client";

import { useState } from "react";
import LiveServiceChangeModal from "@/components/operator-dashboard/LiveServiceChangeModal";
import {
  ownerTripsPath,
  nepalServiceDate,
  shiftServiceDate,
} from "@/features/trip-seat-controls/owner-trip-range";
import type { OwnerTrip, TripSeatControl } from "@/features/trip-seat-controls/types";
import { useOperatorSession } from "@/features/operator-dashboard/SessionContext";
import { useOwnerResource } from "@/features/owner-workspace/use-owner-resource";
import { ReadStatus, panel } from "@/features/owner-workspace/WorkspaceUI";
import { invalidateReadCache } from "@/lib/auth";
import { requestDataRefresh } from "@/lib/data-refresh";
import { TripsPageHeader } from "./components/TripsPageHeader";
import { FleetTripView } from "./components/FleetTripView";

export default function TripsPage() {
  const { dashboardState, loading: sessionLoading } = useOperatorSession();
  const allowed = dashboardState?.verificationStatus === "approved";
  const [dates, setDates] = useState(() => ({
    from: shiftServiceDate(nepalServiceDate(), -30),
    to: shiftServiceDate(nepalServiceDate(), 60),
  }));
  const [selectedTrip, setSelectedTrip] = useState<OwnerTrip | null>(null);
  const [liveChangeOpen, setLiveChangeOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const list = useOwnerResource<OwnerTrip[]>(
    allowed ? ownerTripsPath(dates.from, dates.to) : null
  );

  const control = useOwnerResource<TripSeatControl>(
    allowed && selectedTrip
      ? `/busowner/seat-layout-v3/trips/${selectedTrip._id}`
      : null
  );

  const handleRefresh = () => {
    invalidateReadCache();
    requestDataRefresh();
  };

  const handleOpenLiveService = (trip: OwnerTrip) => {
    setSelectedTrip(trip);
    setLiveChangeOpen(true);
    setMessage(null);
  };

  return (
    <div className="space-y-6">
      <TripsPageHeader />

      {!allowed ? (
        <p className={panel}>
          {sessionLoading
            ? "Loading verification…"
            : "Business approval is required to manage trips."}
        </p>
      ) : (
        <>
          <ReadStatus {...list} />
          {message && (
            <p role="status" className={panel}>
              {message}
            </p>
          )}

          <FleetTripView
            trips={list.data || []}
            loading={list.loading}
            onRefresh={handleRefresh}
            onManageLiveService={handleOpenLiveService}
          />

          <p className="text-xs text-[#746E69]">
            These values are read-only here. Use Manage live service to check date scope and passenger impact before applying changes.
          </p>

          {liveChangeOpen && selectedTrip && (
            <LiveServiceChangeModal
              trip={selectedTrip}
              control={control.data}
              onClose={() => {
                setLiveChangeOpen(false);
                setSelectedTrip(null);
              }}
              onSaved={(savedMessage) => {
                setLiveChangeOpen(false);
                setSelectedTrip(null);
                setMessage(savedMessage);
                requestDataRefresh();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

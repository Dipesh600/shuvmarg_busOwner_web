import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useOperatorSession } from "@/features/operator-dashboard/SessionContext";
import { nepalToday, type BookingList, type OwnerBooking, type TripManifest } from "@/features/owner-workspace/api";
import { useOwnerResource } from "@/features/owner-workspace/use-owner-resource";
import { invalidateReadCache } from "@/lib/auth";
import { requestDataRefresh } from "@/lib/data-refresh";

export function useBookingsData() {
  const search = useSearchParams();
  const { dashboardState, loading: sessionLoading } = useOperatorSession();
  const allowed = dashboardState?.verificationStatus === "approved";

  const today = useMemo(() => nepalToday(), []);
  const initialTripId = search.get("tripId");

  const [from, setFrom] = useState(() => search.get("from") || today);
  const [to, setTo] = useState(() => search.get("to") || today);
  const [status, setStatus] = useState(() => search.get("status") || "");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [manifestTripId, setManifestTripId] = useState<string | null>(initialTripId || null);
  const [manifestPage, setManifestPage] = useState(1);

  // Build query params
  const params = useMemo(() => {
    const q = new URLSearchParams({
      from,
      to,
      page: String(page),
      limit: String(limit),
    });
    if (status) q.set("status", status);
    if (initialTripId) q.set("tripId", initialTripId);
    return q.toString();
  }, [from, to, status, page, limit, initialTripId]);

  const list = useOwnerResource<BookingList>(allowed ? `/busowner/bookings?${params}` : null);
  const detail = useOwnerResource<OwnerBooking>(
    allowed && selectedBookingId ? `/busowner/bookings/${selectedBookingId}` : null
  );
  const manifest = useOwnerResource<TripManifest>(
    allowed && manifestTripId ? `/busowner/trip-manifest/${manifestTripId}?page=${manifestPage}&limit=100` : null
  );

  const handleRefresh = () => {
    invalidateReadCache();
    requestDataRefresh();
  };

  const handleClearFilters = () => {
    setFrom(today);
    setTo(today);
    setStatus("");
    setPage(1);
  };

  const isFiltered = Boolean(status || from !== today || to !== today);

  return {
    allowed,
    sessionLoading,
    tripId: initialTripId,
    from,
    setFrom: (val: string) => { setFrom(val); setPage(1); },
    to,
    setTo: (val: string) => { setTo(val); setPage(1); },
    status,
    setStatus: (val: string) => { setStatus(val); setPage(1); },
    page,
    setPage,
    limit,
    setLimit: (val: number) => { setLimit(val); setPage(1); },
    items: list.data?.items || [],
    totalPages: list.data?.pagination?.totalPages || 1,
    totalItems: list.data?.pagination?.totalItems || 0,
    isFiltered,
    isRefreshing: list.loading,
    handleRefresh,
    handleClearFilters,
    // Booking Details Modal
    selectedBooking: detail.data,
    detailsLoading: detail.loading,
    openBookingDetails: (id: string) => setSelectedBookingId(id),
    closeBookingDetails: () => setSelectedBookingId(null),
    // Departure Manifest Modal
    manifest: manifest.data,
    manifestLoading: manifest.loading,
    manifestPage,
    setManifestPage,
    openManifest: (tripId: string) => { setManifestTripId(tripId); setManifestPage(1); },
    closeManifest: () => setManifestTripId(null),
  };
}

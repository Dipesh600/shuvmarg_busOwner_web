import { useState, useMemo } from "react";
import { useOperatorSession } from "@/features/operator-dashboard/SessionContext";
import { useOwnerResource } from "@/features/owner-workspace/use-owner-resource";
import { writeOwnerData, type OwnerFinance } from "@/features/owner-workspace/api";
import type { OperatorBrand } from "@/features/fleet-registration/api-brands";
import type { OwnerTrip } from "@/features/trip-seat-controls/types";
import { ownerTripsPath, nepalServiceDate, shiftServiceDate } from "@/features/trip-seat-controls/owner-trip-range";
import { invalidateReadCache } from "@/lib/auth";
import { requestDataRefresh } from "@/lib/data-refresh";

export function useFinanceData() {
  const { dashboardState, loading: sessionLoading } = useOperatorSession();
  const allowed = dashboardState?.verificationStatus === "approved";

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [fromDate, setFromDate] = useState(() => shiftServiceDate(nepalServiceDate(), -90));
  const [toDate, setToDate] = useState(() => nepalServiceDate());
  const [statusFilter, setStatusFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");

  // Modal / Request settlement states
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [modalBrandId, setModalBrandId] = useState("");
  const [modalDates, setModalDates] = useState(() => ({
    from: shiftServiceDate(nepalServiceDate(), -90),
    to: nepalServiceDate(),
  }));
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Queries
  const finance = useOwnerResource<OwnerFinance>(allowed ? `/busowner/finance?page=${page}` : null);
  const brands = useOwnerResource<OperatorBrand[]>(allowed ? "/busowner/brands" : null);
  const trips = useOwnerResource<OwnerTrip[]>(
    allowed && isRequestModalOpen ? ownerTripsPath(modalDates.from, modalDates.to) : null
  );

  // Calculate totals from finance.data?.totals
  const totalsByStatus = (statuses: string[]) =>
    (finance.data?.totals || [])
      .filter((row) => statuses.includes(row.status.toLowerCase()))
      .reduce((sum, row) => sum + Math.round(row.netPayableAmount * 100), 0) / 100;

  const awaitingPayout = totalsByStatus(["pending", "processing"]);
  const paidAwaitingReceipt = totalsByStatus(["paid"]);
  const received = totalsByStatus(["received"]);

  // Filter items based on active toolbar filters
  const filteredItems = useMemo(() => {
    const rawItems = finance.data?.items || [];
    return rawItems.filter((row) => {
      if (statusFilter !== "all" && row.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (brandFilter !== "all" && row.brandId?._id !== brandFilter) {
        return false;
      }
      if (fromDate) {
        const itemDate = row.createdAt.slice(0, 10);
        if (itemDate < fromDate) return false;
      }
      if (toDate) {
        const itemDate = row.createdAt.slice(0, 10);
        if (itemDate > toDate) return false;
      }
      return true;
    });
  }, [finance.data?.items, statusFilter, brandFilter, fromDate, toDate]);

  const handleRefresh = () => {
    invalidateReadCache();
    requestDataRefresh();
  };

  const handleConfirmReceipt = async (settlementId: string) => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await writeOwnerData("/busowner/markSettlementReceived", "PATCH", { settlementId });
      setMessage("Receipt confirmed successfully.");
      handleRefresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to confirm receipt.");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitSettlementRequest = async () => {
    if (busy || !modalBrandId || !selectedTripIds.length) return;
    setBusy(true);
    setError(null);
    try {
      await writeOwnerData("/busowner/raiseSettlement", "POST", {
        brandId: modalBrandId,
        tripIds: selectedTripIds,
      });
      setMessage("Settlement request submitted successfully.");
      setIsRequestModalOpen(false);
      setSelectedTripIds([]);
      handleRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit request.");
    } finally {
      setBusy(false);
    }
  };

  const toggleTripSelection = (tripId: string) => {
    setSelectedTripIds((prev) =>
      prev.includes(tripId) ? prev.filter((id) => id !== tripId) : [...prev, tripId]
    );
  };

  return {
    allowed,
    sessionLoading,
    page,
    setPage,
    limit,
    setLimit,
    totalPages: finance.data?.pagination?.totalPages || 1,
    totalItems: finance.data?.pagination?.totalItems || 0,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    statusFilter,
    setStatusFilter,
    brandFilter,
    setBrandFilter,
    brands: brands.data || [],
    trips: trips.data || [],
    tripsLoading: trips.loading,
    awaitingPayout,
    paidAwaitingReceipt,
    received,
    filteredItems,
    isRequestModalOpen,
    setIsRequestModalOpen,
    modalBrandId,
    setModalBrandId,
    modalDates,
    setModalDates,
    selectedTripIds,
    toggleTripSelection,
    selectAllTrips: setSelectedTripIds,
    clearAllTrips: () => setSelectedTripIds([]),
    busy,
    message,
    setMessage,
    error,
    isRefreshing: finance.loading,
    handleRefresh,
    handleConfirmReceipt,
    handleSubmitSettlementRequest,
  };
}

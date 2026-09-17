import React from "react";
import { X, Check, Loader2 } from "lucide-react";
import type { OperatorBrand } from "@/features/fleet-registration/api-brands";
import type { OwnerTrip } from "@/features/trip-seat-controls/types";

interface RequestSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  brands: OperatorBrand[];
  trips: OwnerTrip[];
  tripsLoading: boolean;
  brandId: string;
  onBrandChange: (brandId: string) => void;
  dates: { from: string; to: string };
  onDatesChange: (dates: { from: string; to: string }) => void;
  selectedTripIds: string[];
  onToggleTrip: (tripId: string) => void;
  onSelectAll: (tripIds: string[]) => void;
  onClearAll: () => void;
  onSubmit: () => Promise<void>;
  busy: boolean;
  error: string | null;
}

export function RequestSettlementModal({
  isOpen,
  onClose,
  brands,
  trips,
  tripsLoading,
  brandId,
  onBrandChange,
  dates,
  onDatesChange,
  selectedTripIds,
  onToggleTrip,
  onSelectAll,
  onClearAll,
  onSubmit,
  busy,
  error,
}: RequestSettlementModalProps) {
  if (!isOpen) return null;

  const eligibleTrips = trips.filter(
    (trip) => trip.status === "completed" && (trip.brandId === brandId || !brandId)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl border border-[#EDE7E0] bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#EDE7E0] bg-[#FAF8F5]">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#111111]">
              Request payout settlement
            </h3>
            <p className="text-xs text-[#746E69] mt-0.5">
              Select completed departures to request settlement payout.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="size-8 rounded-full flex items-center justify-center text-[#746E69] hover:bg-[#EDE7E0]/60 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-[#FFF4F3] border border-[#F8C9C7] p-3 text-xs text-[#7A1D1B]">
              {error}
            </div>
          )}

          {/* Operator selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#554E48]">
              Operator brand
            </label>
            <select
              value={brandId}
              onChange={(e) => onBrandChange(e.target.value)}
              className="w-full rounded-xl border border-[#EDE7E0] bg-[#FAF8F5] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#111111] outline-none"
            >
              <option value="">Select operator</option>
              {brands
                .filter((b) => b.status !== "SUSPENDED")
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.brandName}
                  </option>
                ))}
            </select>
          </div>

          {/* Date range */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#554E48]">
              Departure date range
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-[#EDE7E0] bg-[#FAF8F5] px-3 py-2 text-xs">
                <span className="text-[#746E69] block text-[10px] uppercase font-bold">From</span>
                <input
                  type="date"
                  value={dates.from}
                  onChange={(e) => onDatesChange({ ...dates, from: e.target.value })}
                  className="w-full bg-transparent font-semibold text-[#111111] outline-none"
                />
              </div>
              <div className="rounded-xl border border-[#EDE7E0] bg-[#FAF8F5] px-3 py-2 text-xs">
                <span className="text-[#746E69] block text-[10px] uppercase font-bold">To</span>
                <input
                  type="date"
                  value={dates.to}
                  onChange={(e) => onDatesChange({ ...dates, to: e.target.value })}
                  className="w-full bg-transparent font-semibold text-[#111111] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Departures list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-[#554E48]">
                Eligible departures ({eligibleTrips.length})
              </span>
              {eligibleTrips.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectAll(eligibleTrips.map((t) => t._id))}
                    className="text-[#7A1D1B] font-semibold hover:underline"
                  >
                    Select all
                  </button>
                  <span className="text-[#DCD5CD]">·</span>
                  <button
                    type="button"
                    onClick={onClearAll}
                    className="text-[#746E69] hover:underline"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {tripsLoading ? (
              <div className="p-8 text-center text-xs text-[#746E69] flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin text-[#7A1D1B]" />
                <span>Loading completed departures…</span>
              </div>
            ) : !brandId ? (
              <div className="rounded-xl border border-dashed border-[#EDE7E0] p-6 text-center text-xs text-[#746E69]">
                Select an operator above to see departures.
              </div>
            ) : eligibleTrips.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#EDE7E0] p-6 text-center text-xs text-[#746E69]">
                No completed departures found for this operator within the selected range.
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto divide-y divide-[#EDE7E0] rounded-xl border border-[#EDE7E0]">
                {eligibleTrips.map((trip) => {
                  const isChecked = selectedTripIds.includes(trip._id);
                  return (
                    <label
                      key={trip._id}
                      className="flex items-center justify-between p-3 text-xs hover:bg-[#FAF8F5] cursor-pointer transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={busy || (!isChecked && selectedTripIds.length >= 100)}
                          onChange={() => onToggleTrip(trip._id)}
                          className="size-4 rounded accent-[#7A1D1B]"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-[#111111]">
                            {trip.tripDate.slice(0, 10)} · {trip.departureTime}
                          </p>
                          <p className="text-[#746E69] truncate">
                            {trip.busId?.busName || trip.busId?.busNumber || trip.tripId || "Departure"}
                          </p>
                        </div>
                      </div>
                      {isChecked && <Check className="size-3.5 text-[#7A1D1B]" />}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 sm:px-6 py-3.5 border-t border-[#EDE7E0] bg-[#FAF8F5]">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full border border-[#EDE7E0] bg-white px-4 py-2 text-xs font-semibold text-[#191512] shadow-2xs hover:bg-[#FAF8F5] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !brandId || !selectedTripIds.length}
            onClick={() => void onSubmit()}
            className="rounded-full bg-[#7A1D1B] px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#641715] disabled:opacity-40"
          >
            {busy ? "Submitting…" : `Submit request (${selectedTripIds.length} departures)`}
          </button>
        </div>
      </div>
    </div>
  );
}

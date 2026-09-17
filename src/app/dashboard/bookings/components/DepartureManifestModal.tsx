import React from "react";
import { X, Users, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { TripManifest } from "@/features/owner-workspace/api";

interface DepartureManifestModalProps {
  manifest: TripManifest | null;
  loading: boolean;
  page: number;
  onPageChange: (page: number) => void;
  onClose: () => void;
}

export function DepartureManifestModal({
  manifest,
  loading,
  page,
  onPageChange,
  onClose,
}: DepartureManifestModalProps) {
  if (!manifest && !loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl border border-[#EDE7E0] bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#EDE7E0] bg-[#FAF8F5]">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-[#FFF5F4] flex items-center justify-center text-[#7A1D1B] shrink-0">
              <Users className="size-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#111111]">
                Departure manifest
              </h3>
              <p className="text-xs text-[#746E69] mt-0.5">
                Active booked passengers for this departure
              </p>
            </div>
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
          {loading || !manifest ? (
            <div className="p-8 text-center text-xs text-[#746E69] flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin text-[#7A1D1B]" />
              <span>Loading departure manifest…</span>
            </div>
          ) : (
            <>
              {/* Trip info header strip */}
              <div className="rounded-xl border border-[#EDE7E0] bg-[#FAF8F5] p-3.5 text-xs flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-[#111111]">
                    {manifest.trip?.tripDate?.slice(0, 10)} · {manifest.trip?.departureTime}
                  </p>
                  <p className="text-[#554E48] mt-0.5">
                    {manifest.trip?.directionLabel || "Route unavailable"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#746E69] block">
                    Total Bookings
                  </span>
                  <span className="font-bold text-[#111111]">
                    {manifest.pagination?.totalItems ?? manifest.items.length} passengers
                  </span>
                </div>
              </div>

              {/* Manifest table */}
              <div className="rounded-xl border border-[#EDE7E0] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#FAF8F5] border-b border-[#EDE7E0] text-[10px] uppercase font-bold text-[#746E69]">
                      <th className="px-4 py-2.5">Ticket</th>
                      <th className="px-3 py-2.5">Seats</th>
                      <th className="px-4 py-2.5">Passengers & contact</th>
                      <th className="px-3 py-2.5">Boarding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE7E0]">
                    {manifest.items.length > 0 ? (
                      manifest.items.map((item) => (
                        <tr key={item._id} className="hover:bg-[#FAF8F5]/60">
                          <td className="px-4 py-3 font-bold text-[#111111]">
                            {item.ticketId}
                          </td>
                          <td className="px-3 py-3">
                            <span className="font-semibold text-[#7A1D1B]">
                              {item.seats.join(", ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {item.passengerDetails && item.passengerDetails.length > 0 ? (
                              item.passengerDetails.map((p, idx) => (
                                <p key={idx} className="leading-tight">
                                  <span className="font-semibold text-[#111111]">{p.name}</span>{" "}
                                  <span className="text-[#746E69]">({p.seatNo})</span> ·{" "}
                                  <span className="text-[#554E48]">{p.phone || "No contact"}</span>
                                </p>
                              ))
                            ) : (
                              <span className="text-[#746E69]">Contact unavailable</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {item.boardingConfirmed ? (
                              <span className="inline-flex items-center gap-1 text-[#2E7D32] font-semibold text-[11px]">
                                <CheckCircle2 className="size-3" />
                                <span>Confirmed</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[#746E69] text-[11px]">
                                <AlertCircle className="size-3" />
                                <span>Not boarded</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-xs text-[#746E69]">
                          No active bookings found for this departure.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Manifest Pagination if needed */}
              {manifest.pagination?.totalPages > 1 && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[#746E69]">
                    Page {page} of {manifest.pagination.totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => onPageChange(page - 1)}
                      className="rounded-lg border border-[#EDE7E0] bg-white px-2.5 py-1 text-xs font-semibold disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={page >= manifest.pagination.totalPages}
                      onClick={() => onPageChange(page + 1)}
                      className="rounded-lg border border-[#EDE7E0] bg-white px-2.5 py-1 text-xs font-semibold disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-5 sm:px-6 py-3 border-t border-[#EDE7E0] bg-[#FAF8F5]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#EDE7E0] bg-white px-5 py-2 text-xs font-semibold text-[#191512] shadow-2xs hover:bg-[#FAF8F5] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

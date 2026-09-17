import React from "react";
import { X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { OwnerBooking } from "@/features/owner-workspace/api";
import { money } from "@/features/owner-workspace/WorkspaceUI";

interface BookingDetailsModalProps {
  booking: OwnerBooking | null;
  loading: boolean;
  onClose: () => void;
}

export function BookingDetailsModal({
  booking,
  loading,
  onClose,
}: BookingDetailsModalProps) {
  if (!booking && !loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl border border-[#EDE7E0] bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#EDE7E0] bg-[#FAF8F5]">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#111111]">
              Ticket details
            </h3>
            <p className="text-xs text-[#746E69] mt-0.5">
              {booking?.ticketId ? `Booking #${booking.ticketId}` : "Loading ticket…"}
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
          {loading || !booking ? (
            <div className="p-8 text-center text-xs text-[#746E69] flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin text-[#7A1D1B]" />
              <span>Loading booking details…</span>
            </div>
          ) : (
            <>
              {/* Summary Cards Grid */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                <div className="rounded-xl border border-[#EDE7E0] bg-[#FAF8F5] p-3 space-y-0.5">
                  <span className="text-[#746E69] text-[10px] font-bold uppercase tracking-wider">
                    Total Amount
                  </span>
                  <p className="text-base font-bold text-[#111111]">
                    {money(booking.totalAmount)}
                  </p>
                </div>
                <div className="rounded-xl border border-[#EDE7E0] bg-[#FAF8F5] p-3 space-y-0.5">
                  <span className="text-[#746E69] text-[10px] font-bold uppercase tracking-wider">
                    Boarding status
                  </span>
                  <p className="text-xs font-semibold text-[#111111] flex items-center gap-1.5 mt-0.5">
                    {booking.boardingConfirmed ? (
                      <>
                        <CheckCircle2 className="size-3.5 text-[#2E7D32]" />
                        <span>Confirmed</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="size-3.5 text-[#746E69]" />
                        <span>Not boarded</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Departure Info */}
              <div className="rounded-xl border border-[#EDE7E0] p-3.5 text-xs space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#746E69]">
                  Departure & Route
                </p>
                <p className="font-bold text-[#111111]">
                  {booking.trip?.tripDate?.slice(0, 10)} · {booking.trip?.departureTime}
                </p>
                <p className="text-[#554E48]">
                  {booking.trip?.directionLabel || "Route unavailable"}
                </p>
              </div>

              {/* Passengers Table */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#554E48]">
                  Passengers ({booking.passengerDetails?.length || booking.seats.length})
                </p>
                <div className="rounded-xl border border-[#EDE7E0] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#FAF8F5] border-b border-[#EDE7E0] text-[10px] uppercase font-bold text-[#746E69]">
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Seat</th>
                        <th className="px-3 py-2">Contact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDE7E0]">
                      {booking.passengerDetails && booking.passengerDetails.length > 0 ? (
                        booking.passengerDetails.map((passenger, index) => (
                          <tr key={index} className="hover:bg-[#FAF8F5]/60">
                            <td className="px-3 py-2.5 font-semibold text-[#111111]">
                              {passenger.name}
                            </td>
                            <td className="px-3 py-2.5 font-bold text-[#7A1D1B]">
                              {passenger.seatNo}
                            </td>
                            <td className="px-3 py-2.5 text-[#746E69]">
                              {passenger.phone || "Unavailable"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        booking.seats.map((seat, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-[#746E69]">Passenger</td>
                            <td className="px-3 py-2 font-bold text-[#7A1D1B]">{seat}</td>
                            <td className="px-3 py-2 text-[#746E69]">Unavailable</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Refund Info if exists */}
              {booking.refund && (
                <div className="rounded-xl bg-[#FFF5F4] border border-[#F0CACA] p-3 text-xs space-y-1">
                  <p className="font-bold text-[#7A1D1B]">Refund details</p>
                  <p className="text-[#554E48]">
                    Status: <span className="font-semibold">{booking.refund.status}</span> · Refund amount:{" "}
                    <span className="font-bold">{money(booking.refund.refundAmount)}</span>
                  </p>
                  {booking.refund.cancellationCharge > 0 && (
                    <p className="text-[#746E69]">
                      Cancellation charge: {money(booking.refund.cancellationCharge)}
                    </p>
                  )}
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

import React from "react";
import type { OwnerBooking } from "@/features/owner-workspace/api";
import { money } from "@/features/owner-workspace/WorkspaceUI";
import { BookingsEmptyState } from "./BookingsEmptyState";
import { Eye, Users } from "lucide-react";

interface BookingsTableProps {
  items: OwnerBooking[];
  onSelectBooking: (bookingId: string) => void;
  onOpenManifest: (tripId: string) => void;
  onClearFilters: () => void;
  isFiltered?: boolean;
}

export function BookingsTable({
  items,
  onSelectBooking,
  onOpenManifest,
  onClearFilters,
  isFiltered = true,
}: BookingsTableProps) {
  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case "booked":
        return (
          <span className="inline-flex items-center rounded-md bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-semibold text-[#065F46] border border-[#A7F3D0]">
            Booked
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center rounded-md bg-[#FFF8ED] px-2.5 py-1 text-[11px] font-semibold text-[#976B18] border border-[#F8DEAE]">
            Pending
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center rounded-md bg-[#FFF4F3] px-2.5 py-1 text-[11px] font-semibold text-[#7A1D1B] border border-[#F8C9C7]">
            Cancelled
          </span>
        );
      case "no_show":
        return (
          <span className="inline-flex items-center rounded-md bg-[#F5F5F5] px-2.5 py-1 text-[11px] font-semibold text-[#525252] border border-[#E5E5E5]">
            No show
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-md bg-[#F5F5F5] px-2.5 py-1 text-[11px] font-semibold text-[#525252]">
            {status.replaceAll("_", " ")}
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#EDE7E0] bg-white shadow-xs overflow-hidden">
      {/* Table header */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-[#EDE7E0] bg-[#FAF8F5] text-[11px] font-bold uppercase tracking-wider text-[#554E48]">
              <th className="px-5 py-3.5 sm:px-6">Ticket</th>
              <th className="px-4 py-3.5">Departure / route</th>
              <th className="px-4 py-3.5">Seats</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Recorded amount</th>
              <th className="px-5 py-3.5 sm:px-6 text-right">Actions</th>
            </tr>
          </thead>
          {items.length > 0 && (
            <tbody className="divide-y divide-[#EDE7E0]">
              {items.map((booking) => {
                const tripDateStr = booking.trip?.tripDate
                  ? new Date(booking.trip.tripDate).toLocaleDateString("en-NP", {
                      timeZone: "Asia/Kathmandu",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "Date unavailable";

                return (
                  <tr key={booking._id} className="hover:bg-[#FAF8F5]/60 transition">
                    <td className="px-5 py-4 sm:px-6">
                      <p className="font-bold text-[#111111]">{booking.ticketId}</p>
                      {booking.bookedAt && (
                        <p className="text-[11px] text-[#746E69] mt-0.5">
                          {new Date(booking.bookedAt).toLocaleDateString("en-NP", {
                            timeZone: "Asia/Kathmandu",
                            day: "2-digit",
                            month: "short",
                          })}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[#111111]">
                        {tripDateStr} · {booking.trip?.departureTime || ""}
                      </p>
                      <p className="text-xs text-[#746E69] mt-0.5">
                        {booking.trip?.directionLabel || "Route unavailable"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {booking.seats.map((seat) => (
                          <span
                            key={seat}
                            className="inline-flex items-center rounded-md bg-[#FAF8F5] border border-[#EDE7E0] px-1.5 py-0.5 text-xs font-semibold text-[#191512]"
                          >
                            {seat}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">{getStatusBadge(booking.status)}</td>
                    <td className="px-4 py-4 font-bold text-[#111111]">
                      {money(booking.totalAmount)}
                    </td>
                    <td className="px-5 py-4 sm:px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectBooking(booking._id)}
                          className="inline-flex h-8 items-center justify-center gap-1 rounded-full border border-[#EDE7E0] bg-white px-3 text-xs font-semibold text-[#191512] shadow-2xs hover:bg-[#FAF8F5] transition"
                        >
                          <Eye className="size-3.5 text-[#554E48]" />
                          <span>Details</span>
                        </button>
                        {booking.trip?._id && (
                          <button
                            type="button"
                            onClick={() => onOpenManifest(booking.trip._id)}
                            className="inline-flex h-8 items-center justify-center gap-1 rounded-full border border-[#EDE7E0] bg-white px-3 text-xs font-semibold text-[#191512] shadow-2xs hover:bg-[#FAF8F5] transition"
                          >
                            <Users className="size-3.5 text-[#554E48]" />
                            <span>Manifest</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
      </div>

      {/* Empty State when no items */}
      {items.length === 0 && (
        <BookingsEmptyState
          onClearFilters={onClearFilters}
          isFiltered={isFiltered}
        />
      )}
    </div>
  );
}

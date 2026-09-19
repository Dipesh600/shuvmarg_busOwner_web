"use client";

import React from "react";
import { Users, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { TripManifest } from "@/features/owner-workspace/api";

interface BusWorkstationDrawerManifestTabProps {
  manifest: TripManifest | null;
  loading: boolean;
  page: number;
  onPageChange: (page: number) => void;
}

export function BusWorkstationDrawerManifestTab({
  manifest,
  loading,
  page,
  onPageChange,
}: BusWorkstationDrawerManifestTabProps) {
  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-[#746E69] flex flex-col items-center justify-center gap-2">
        <Loader2 className="size-5 animate-spin text-[#7A1D1B]" />
        <span>Loading passenger manifest…</span>
      </div>
    );
  }

  if (!manifest || manifest.items.length === 0) {
    return (
      <div className="rounded-2xl border border-[#EDE7E0] bg-[#FAF8F5]/60 p-8 text-center space-y-2">
        <Users className="size-8 text-[#A8A199] mx-auto" />
        <p className="text-xs font-bold text-[#191512]">No Bookings Found</p>
        <p className="text-[11px] text-[#746E69]">
          There are no confirmed passengers for this departure yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Manifest Summary Header */}
      <div className="rounded-xl border border-[#EDE7E0] bg-[#FAF8F5] p-3 text-xs flex items-center justify-between">
        <span className="font-semibold text-[#746E69]">Total Passengers</span>
        <span className="font-bold text-[#191512] font-mono">
          {manifest.pagination?.totalItems ?? manifest.items.length}
        </span>
      </div>

      {/* Passenger List */}
      <div className="space-y-2">
        {manifest.items.map((item) => (
          <div
            key={item._id}
            className="rounded-xl border border-[#EDE7E0] bg-white p-3 space-y-1.5 shadow-2xs"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-[#191512]">
                {item.ticketId}
              </span>
              <span className="font-mono font-bold text-[#7A1D1B] bg-[#FFF5F4] px-2 py-0.5 rounded border border-[#F8C9C7] text-[11px]">
                Seat {item.seats.join(", ")}
              </span>
            </div>

            {item.passengerDetails && item.passengerDetails.length > 0 ? (
              item.passengerDetails.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#191512]">{p.name}</span>
                  <span className="text-[#746E69] text-[11px]">{p.phone || "No phone"}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#746E69]">Passenger details unavailable</p>
            )}

            <div className="pt-1 flex items-center justify-between text-[11px] border-t border-[#EDE7E0]/60">
              <span className="text-[#746E69]">Boarding Status:</span>
              {item.boardingConfirmed ? (
                <span className="inline-flex items-center gap-1 text-[#065F46] font-semibold">
                  <CheckCircle2 className="size-3" />
                  <span>Confirmed</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[#746E69]">
                  <AlertCircle className="size-3" />
                  <span>Not boarded</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {manifest.pagination && manifest.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs pt-2">
          <span className="text-[#746E69]">
            Page {page} of {manifest.pagination.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-lg border border-[#EDE7E0] bg-white px-2.5 py-1 text-xs font-semibold disabled:opacity-40 hover:bg-[#FAF8F5] cursor-pointer"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page >= manifest.pagination.totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded-lg border border-[#EDE7E0] bg-white px-2.5 py-1 text-xs font-semibold disabled:opacity-40 hover:bg-[#FAF8F5] cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import { BookingsHeader } from "./BookingsHeader";
import { BookingsFilters } from "./BookingsFilters";
import { BookingsTable } from "./BookingsTable";
import { BookingsPagination } from "./BookingsPagination";
import { BookingDetailsModal } from "./BookingDetailsModal";
import { DepartureManifestModal } from "./DepartureManifestModal";
import { useBookingsData } from "../hooks/useBookingsData";
import { ShieldAlert, Loader2 } from "lucide-react";
import Link from "next/link";

export function BookingsContent() {
  const {
    allowed,
    sessionLoading,
    tripId,
    from,
    setFrom,
    to,
    setTo,
    status,
    setStatus,
    page,
    setPage,
    limit,
    setLimit,
    items,
    totalPages,
    totalItems,
    isFiltered,
    isRefreshing,
    handleRefresh,
    handleClearFilters,
    selectedBooking,
    detailsLoading,
    openBookingDetails,
    closeBookingDetails,
    manifest,
    manifestLoading,
    manifestPage,
    setManifestPage,
    openManifest,
    closeManifest,
  } = useBookingsData();

  return (
    <div className="w-full space-y-5 sm:space-y-6">
      {/* ── Framed Panoramic Header Banner matching My Buses ── */}
      <BookingsHeader
        tripId={tripId}
        onOpenManifest={tripId ? () => openManifest(tripId) : undefined}
      />

      {sessionLoading ? (
        <div className="flex items-center justify-center rounded-2xl sm:rounded-3xl border border-[#EDE7E0] bg-white p-12 text-xs text-[#746E69] gap-2 shadow-xs">
          <Loader2 className="size-4 animate-spin text-[#7A1D1B]" />
          <span>Verifying operator credentials…</span>
        </div>
      ) : !allowed ? (
        <div className="rounded-2xl sm:rounded-3xl border border-[#EDE7E0] bg-white p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-2xl bg-[#FFF4F3] flex items-center justify-center shrink-0">
              <ShieldAlert className="size-5 text-[#7A1D1B]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#111111]">
                Business verification required
              </h3>
              <p className="text-xs text-[#746E69] mt-0.5">
                Complete your business profile and KYC approval to manage passenger bookings and manifests.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/business-profile"
            className="inline-flex h-9 items-center justify-center rounded-full bg-[#7A1D1B] px-5 text-xs font-bold text-white shadow-xs transition hover:bg-[#641715] active:scale-[0.98] shrink-0"
          >
            Review business profile
          </Link>
        </div>
      ) : (
        <>
          {/* ── Filter Toolbar Controls ── */}
          <BookingsFilters
            fromDate={from}
            toDate={to}
            status={status}
            onFromDateChange={setFrom}
            onToDateChange={setTo}
            onStatusChange={setStatus}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />

          {/* ── Bookings Data Table & Empty State ── */}
          <BookingsTable
            items={items}
            onSelectBooking={openBookingDetails}
            onOpenManifest={openManifest}
            onClearFilters={handleClearFilters}
            isFiltered={isFiltered}
          />

          {/* ── Pagination Controls ── */}
          {totalItems > 0 && (
            <BookingsPagination
              page={page}
              totalPages={totalPages}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          )}

          {/* ── Booking Details Modal ── */}
          <BookingDetailsModal
            booking={selectedBooking || null}
            loading={detailsLoading}
            onClose={closeBookingDetails}
          />

          {/* ── Departure Manifest Modal ── */}
          <DepartureManifestModal
            manifest={manifest || null}
            loading={manifestLoading}
            page={manifestPage}
            onPageChange={setManifestPage}
            onClose={closeManifest}
          />
        </>
      )}
    </div>
  );
}

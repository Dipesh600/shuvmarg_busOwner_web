"use client";

import React from "react";
import { FinanceHeader } from "./components/FinanceHeader";
import { FinanceMetricCards } from "./components/FinanceMetricCards";
import { FinanceFilters } from "./components/FinanceFilters";
import { FinanceSettlementsTable } from "./components/FinanceSettlementsTable";
import { FinancePagination } from "./components/FinancePagination";
import { RequestSettlementModal } from "./components/RequestSettlementModal";
import { useFinanceData } from "./hooks/useFinanceData";
import { ShieldAlert, Loader2 } from "lucide-react";
import Link from "next/link";

export default function FinancePage() {
  const {
    allowed,
    sessionLoading,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    totalItems,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    statusFilter,
    setStatusFilter,
    brandFilter,
    setBrandFilter,
    brands,
    trips,
    tripsLoading,
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
    selectAllTrips,
    clearAllTrips,
    busy,
    message,
    setMessage,
    error,
    isRefreshing,
    handleRefresh,
    handleConfirmReceipt,
    handleSubmitSettlementRequest,
  } = useFinanceData();

  return (
    <div className="w-full space-y-5 sm:space-y-6">
      {/* ── Panoramic Framed Header Banner matching My Buses ── */}
      <FinanceHeader
        onRequestSettlement={allowed ? () => setIsRequestModalOpen(true) : undefined}
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
                Complete your business profile and KYC approval to review settlements and receive payouts.
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
          {/* ── Metric / KPI Cards Row ── */}
          <FinanceMetricCards
            awaitingPayout={awaitingPayout}
            paidAwaitingReceipt={paidAwaitingReceipt}
            received={received}
            onFilterClick={(status) => setStatusFilter(status)}
          />

          {/* ── Toolbar / Filter Controls ── */}
          <FinanceFilters
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            brandFilter={brandFilter}
            onBrandFilterChange={setBrandFilter}
            brands={brands}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />

          {/* ── Settlements Table & Empty State ── */}
          <FinanceSettlementsTable
            items={filteredItems}
            busy={busy}
            onRequestSettlement={() => setIsRequestModalOpen(true)}
            onConfirmReceipt={handleConfirmReceipt}
            isFiltered={statusFilter !== "all" || brandFilter !== "all"}
          />

          {/* ── Pagination Controls ── */}
          {totalItems > 0 && (
            <FinancePagination
              page={page}
              totalPages={totalPages}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          )}

          {/* ── Request Settlement Modal ── */}
          <RequestSettlementModal
            isOpen={isRequestModalOpen}
            onClose={() => setIsRequestModalOpen(false)}
            brands={brands}
            trips={trips}
            tripsLoading={tripsLoading}
            brandId={modalBrandId}
            onBrandChange={setModalBrandId}
            dates={modalDates}
            onDatesChange={setModalDates}
            selectedTripIds={selectedTripIds}
            onToggleTrip={toggleTripSelection}
            onSelectAll={selectAllTrips}
            onClearAll={clearAllTrips}
            onSubmit={handleSubmitSettlementRequest}
            busy={busy}
            error={error}
          />
        </>
      )}

      {/* ── Toast Feedback Notification ── */}
      {message && (
        <button
          type="button"
          onClick={() => setMessage(null)}
          className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl bg-[#191512] px-5 py-3.5 text-left text-xs font-semibold text-white shadow-2xl transition hover:bg-[#2A2520] cursor-pointer"
        >
          {message}
        </button>
      )}
    </div>
  );
}

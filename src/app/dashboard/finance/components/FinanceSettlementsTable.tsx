import React from "react";
import type { OwnerSettlement } from "@/features/owner-workspace/api";
import { money } from "@/features/owner-workspace/WorkspaceUI";
import { FinanceEmptyState } from "./FinanceEmptyState";
import { Check, CheckCircle2 } from "lucide-react";

interface FinanceSettlementsTableProps {
  items: OwnerSettlement[];
  busy: boolean;
  onRequestSettlement: () => void;
  onConfirmReceipt: (settlementId: string) => void;
  isFiltered?: boolean;
}

export function FinanceSettlementsTable({
  items,
  busy,
  onRequestSettlement,
  onConfirmReceipt,
  isFiltered,
}: FinanceSettlementsTableProps) {
  const getStatusBadge = (status: string, reference?: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case "pending":
        return (
          <span className="inline-flex items-center rounded-md bg-[#FFF8ED] px-2.5 py-1 text-[11px] font-semibold text-[#976B18] border border-[#F8DEAE]">
            Pending
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center rounded-md bg-[#EFF6FF] px-2.5 py-1 text-[11px] font-semibold text-[#1E40AF] border border-[#BFDBFE]">
            Processing
          </span>
        );
      case "paid":
        return (
          <div className="space-y-0.5">
            <span className="inline-flex items-center rounded-md bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-semibold text-[#065F46] border border-[#A7F3D0]">
              Paid
            </span>
            {reference && <p className="text-[10px] text-[#746E69] font-mono truncate max-w-[120px]">{reference}</p>}
          </div>
        );
      case "received":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-[#FAF8F5] px-2.5 py-1 text-[11px] font-semibold text-[#554E48] border border-[#EDE7E0]">
            <Check className="size-3 text-[#2E7D32]" />
            Received
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-md bg-[#F5F5F5] px-2.5 py-1 text-[11px] font-semibold text-[#525252]">
            {status}
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
              <th className="px-5 py-3.5 sm:px-6">Date / operator</th>
              <th className="px-4 py-3.5">Tickets</th>
              <th className="px-4 py-3.5">Gross</th>
              <th className="px-4 py-3.5">Commission</th>
              <th className="px-4 py-3.5">Net payable</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-5 py-3.5 sm:px-6 text-right">Actions</th>
            </tr>
          </thead>
          {items.length > 0 && (
            <tbody className="divide-y divide-[#EDE7E0]">
              {items.map((row) => {
                const dateStr = new Date(row.createdAt).toLocaleDateString("en-NP", {
                  timeZone: "Asia/Kathmandu",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                return (
                  <tr key={row._id} className="hover:bg-[#FAF8F5]/60 transition">
                    <td className="px-5 py-4 sm:px-6">
                      <p className="font-semibold text-[#111111]">{dateStr}</p>
                      <p className="text-xs text-[#746E69] mt-0.5">
                        {row.brandId?.brandName || "Operator unavailable"}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-[#191512] font-medium">
                      {row.totalTicketsSold}
                    </td>
                    <td className="px-4 py-4 text-[#191512]">
                      {money(row.grossAmount)}
                    </td>
                    <td className="px-4 py-4 text-[#746E69]">
                      {money(row.platformCommission)}
                      <span className="text-[11px] text-[#A89F95] block sm:inline sm:ml-1">
                        ({row.commissionRate}%)
                      </span>
                    </td>
                    <td className="px-4 py-4 font-bold text-[#111111]">
                      {money(row.netPayableAmount)}
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(row.status, row.paymentReference)}
                    </td>
                    <td className="px-5 py-4 sm:px-6 text-right">
                      {row.status === "paid" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            if (window.confirm("Confirm only if you have received this payment in your settlement account.")) {
                              onConfirmReceipt(row._id);
                            }
                          }}
                          className="inline-flex h-8 items-center justify-center gap-1 rounded-full bg-[#7A1D1B] px-3.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#641715] transition active:scale-[0.98] disabled:opacity-50"
                        >
                          <CheckCircle2 className="size-3.5" />
                          <span>Confirm receipt</span>
                        </button>
                      )}
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
        <FinanceEmptyState
          onRequestSettlement={onRequestSettlement}
          isFiltered={isFiltered}
        />
      )}
    </div>
  );
}

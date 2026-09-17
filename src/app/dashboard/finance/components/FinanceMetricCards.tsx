import React from "react";
import { Wallet, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { money } from "@/features/owner-workspace/WorkspaceUI";

interface FinanceMetricCardsProps {
  awaitingPayout: number;
  paidAwaitingReceipt: number;
  received: number;
  onFilterClick?: (status: string) => void;
}

export function FinanceMetricCards({
  awaitingPayout,
  paidAwaitingReceipt,
  received,
  onFilterClick,
}: FinanceMetricCardsProps) {
  const cards = [
    {
      id: "pending",
      label: "AWAITING PAYOUT",
      value: awaitingPayout,
      subtext: "Approved, ready for payout",
      icon: Wallet,
      iconBg: "bg-[#FBF4EC]",
      iconColor: "text-[#7A1D1B]",
    },
    {
      id: "paid",
      label: "PAID, AWAITING YOUR RECEIPT",
      value: paidAwaitingReceipt,
      subtext: "Transfer completed, receipt required",
      icon: Clock,
      iconBg: "bg-[#FFF2ED]",
      iconColor: "text-[#B83D35]",
    },
    {
      id: "received",
      label: "RECEIVED",
      value: received,
      subtext: "Confirmed settlements",
      icon: CheckCircle2,
      iconBg: "bg-[#EFF7ED]",
      iconColor: "text-[#2E7D32]",
    },
  ];

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => onFilterClick?.(card.id)}
              className="group rounded-2xl sm:rounded-3xl border border-[#EDE7E0] bg-white p-5 sm:p-6 shadow-xs flex items-center justify-between transition hover:border-[#DCD5CD] cursor-pointer"
            >
              <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
                <div
                  className={`size-10 sm:size-11 rounded-2xl ${card.iconBg} flex items-center justify-center shrink-0 mt-0.5`}
                >
                  <Icon className={`size-5 ${card.iconColor}`} />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-[#746E69] truncate">
                    {card.label}
                  </p>
                  <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#111111] leading-tight truncate">
                    {money(card.value)}
                  </p>
                  <p className="text-xs text-[#8C827A] truncate">{card.subtext}</p>
                </div>
              </div>
              <ChevronRight className="size-4 text-[#A89F95] group-hover:text-[#111111] group-hover:translate-x-0.5 transition shrink-0 ml-2" />
            </div>
          );
        })}
      </div>

      <p className="text-xs text-[#746E69] leading-relaxed px-1">
        Totals cover recorded settlements across all dates. These are net settlement amounts, separate from daily booking sales. Payouts require platform review; this page does not transfer money.
      </p>
    </div>
  );
}

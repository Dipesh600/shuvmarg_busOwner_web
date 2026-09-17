import React from "react";
import { Plus } from "lucide-react";

interface FinanceHeaderProps {
  onRequestSettlement?: () => void;
}

export function FinanceHeader({ onRequestSettlement }: FinanceHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#EDE7E0] bg-[#FAF8F5] shadow-xs">
      {/* Panoramic Mountain Landscape Background matching My Buses */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/my_buses.webp"
          alt=""
          className="size-full object-cover object-[80%_center] sm:object-[88%_center] md:object-right"
        />
        {/* Soft fade overlay on the left for crisp contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/85 sm:via-[#FAF8F5]/50 to-transparent w-full sm:w-2/3 md:w-1/2" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between p-5 sm:p-8 md:p-9 min-h-[175px] sm:min-h-[220px] md:min-h-[230px]">
        <div className="max-w-md sm:max-w-lg space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A1D1B]">
            Finance & settlements
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-[42px] font-bold tracking-tight text-[#111111] leading-tight">
            Finance & settlements
          </h1>
          <p className="text-xs sm:text-sm text-[#554E48]">
            Recorded settlement requests, commission and receipt confirmations.
          </p>
        </div>

        {onRequestSettlement && (
          <div className="mt-4 sm:mt-0 sm:absolute sm:bottom-7 sm:right-7 md:bottom-8 md:right-9">
            <button
              type="button"
              onClick={onRequestSettlement}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#7A1D1B] px-5 text-xs font-bold text-white shadow-sm transition hover:bg-[#641715] active:scale-[0.98]"
            >
              <Plus className="size-4" />
              <span>Request settlement</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

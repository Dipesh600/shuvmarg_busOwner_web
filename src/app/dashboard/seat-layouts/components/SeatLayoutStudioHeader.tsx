import React from "react";
import { ShieldCheck } from "lucide-react";

export function SeatLayoutStudioHeader() {
  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#EDE7E0] bg-[#FAF8F5] shadow-xs">
      {/* Framed Panoramic Mountain Landscape Background */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/my_buses.webp"
          alt="Seat layout studio background"
          className="size-full object-cover object-[80%_center] sm:object-[86%_center] md:object-right"
        />
        {/* Soft fade overlay on the left for crisp text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/90 sm:via-[#FAF8F5]/65 md:via-[#FAF8F5]/35 to-transparent w-full sm:w-3/4 md:w-3/5" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between p-6 sm:p-8 md:p-9 min-h-[160px] sm:min-h-[185px] gap-4">
        <div className="max-w-xl space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A1D1B]">
            Seat layouts
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111] leading-tight">
            Seat layout studio
          </h1>
          <p className="text-xs sm:text-sm text-[#554E48] leading-relaxed pt-0.5">
            Start from a Shuvmarg template, keep your own private copy, and submit only physical changes for review.
          </p>
        </div>

        {/* Running trips badge */}
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#7A1D1B] shrink-0 self-start sm:self-start">
          <ShieldCheck className="size-4 shrink-0 text-[#7A1D1B]" />
          <span>Running trips keep their captured layout</span>
        </div>
      </div>
    </div>
  );
}

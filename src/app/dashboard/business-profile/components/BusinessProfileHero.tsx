import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldAlert, Plus } from "lucide-react";

interface BusinessProfileHeroProps {
  isKyced: boolean;
  companyName: string;
  loading: boolean;
}

export function BusinessProfileHero({
  isKyced,
  companyName,
  loading,
}: BusinessProfileHeroProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-[24px] bg-[#F5F0E8] border border-[#E8E1DB] shadow-xs">
      {/* Background Layers */}
      <div className="absolute inset-0 z-0 bg-[#7A1D1B]">
        {/* Subtle Dot Matrix on Burgundy Side */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* Bottom U-Shaped Dip */}
      <div className="absolute bottom-0 left-0 w-full h-[60px] z-0 pointer-events-none flex justify-center">
        <svg
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
          className="w-full h-full text-[#F5F0E8] fill-current"
        >
          <path d="M 0 100 L 340 100 C 380 100 380 0 430 0 L 570 0 C 620 0 620 100 660 100 L 1000 100 L 1000 101 L 0 101 Z" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-[180px] flex-col items-center justify-between p-6 pb-3 pt-8">
        {loading ? (
          <div className="w-full flex flex-col items-center gap-3 animate-pulse">
            <div className="h-9 w-60 rounded-xl bg-white/20" />
          </div>
        ) : (
          <div className="flex w-full h-full flex-col items-center justify-between text-center gap-6">
            <h1
              className="text-[24px] font-black uppercase tracking-tight text-white sm:text-[28px] md:text-[32px] leading-none"
              style={{ fontFamily: '"Neue Machina", system-ui, sans-serif' }}
            >
              {isKyced ? `${companyName}.` : "Business Profile."}
            </h1>

            {isKyced ? (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
                <Link
                  href="/dashboard/operators/new"
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#D96861] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:bg-[#C25852] hover:shadow-lg active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  Add Operator
                </Link>
              </div>
            ) : (
              <Link
                href="/dashboard/settings"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-black uppercase tracking-wider text-[#7A1D1B] shadow-md transition hover:bg-[#FAF8F5] hover:shadow-lg active:scale-95 border border-neutral-200 mt-2"
              >
                <ShieldAlert className="h-4 w-4 text-[#7A1D1B]" />
                Verify Business
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

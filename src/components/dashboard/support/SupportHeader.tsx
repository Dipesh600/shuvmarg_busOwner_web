"use client";

import React from "react";
import { Search, Headphones, MessageSquarePlus } from "lucide-react";

interface SupportHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenTicketModal: () => void;
}

export default function SupportHeader({
  searchQuery,
  onSearchChange,
  onOpenTicketModal,
}: SupportHeaderProps) {
  return (
    <div className="bg-white rounded-3xl border border-[#EEE8E2] p-6 sm:p-8 shadow-2xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#7A1D1B]/10 border border-[#7A1D1B]/20 flex items-center justify-center text-[#7A1D1B] shrink-0">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 font-display">
              Help &amp; Support
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              We&apos;re here to help you manage your buses, routes, and daily payouts.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenTicketModal}
          className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-[#7A1D1B] hover:bg-[#5C1414] text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-2xs shrink-0"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>Send a Message</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-xl">
        <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search questions (e.g., bank payout, adding bus, tickets)..."
          className="w-full h-11 pl-11 pr-4 bg-[#FAF8F5] rounded-2xl border border-[#EEE8E2] text-xs sm:text-sm font-medium text-neutral-900 outline-none focus:border-[#7A1D1B] focus:ring-2 focus:ring-[#7A1D1B]/10 transition-all placeholder:text-neutral-400"
        />
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageSquare, ArrowRight } from "lucide-react";

export default function OperatorSupportCard() {
  return (
    <div className="bg-white rounded-3xl border border-[#EEE8E2] p-6 sm:p-7 shadow-2xs space-y-4 flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-[#746E69] uppercase tracking-wider mb-1">
              Assisted Setup
            </div>
            <h3
              className="text-lg font-bold text-[#161311]"
              style={{ fontFamily: '"Neue Machina", system-ui, sans-serif' }}
            >
              Operator Support
            </h3>
          </div>
          <Image
            src="/operator-dashboard/illustrations/operator-support.svg"
            alt="Operator Support"
            width={48}
            height={48}
            className="flex-shrink-0"
          />
        </div>

        <p className="text-xs text-[#746E69] leading-relaxed font-medium">
          Need help setting up? Our operator support team can guide you through verification and fleet preparation.
        </p>
      </div>

      <div className="pt-2">
        <Link
          href="/dashboard/support"
          className="w-full py-2.5 px-4 rounded-xl bg-[#FAF8F5] hover:bg-neutral-100 text-[#161311] font-semibold text-xs border border-[#EEE8E2] transition-colors flex items-center justify-center gap-2 group"
        >
          <MessageSquare className="w-4 h-4 text-[#7A1D1B]" />
          <span>Contact Operator Support</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#746E69] group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

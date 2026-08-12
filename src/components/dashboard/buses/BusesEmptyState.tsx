"use client";

import React from "react";
import {
  BusFront,
  ShieldCheck,
  FileText,
  Clock3,
  CheckCircle2,
  Lock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { VerificationStatus } from "@/features/operator-dashboard/operator-dashboard-contract";

interface BusesEmptyStateProps {
  verificationStatus?: VerificationStatus;
  onRegisterFleet?: () => void;
}

export default function BusesEmptyState({
  verificationStatus = "not_submitted",
  onRegisterFleet,
}: BusesEmptyStateProps) {
  const isBusinessApproved = verificationStatus === "approved";

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#E8E1DB] bg-white shadow-2xs">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E1DB] bg-[linear-gradient(110deg,#FFF9F5_0%,#FFFFFF_60%,#FFF3EF_100%)] px-6 py-6 sm:px-8">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#7A1D1B]">
            Fleet Operations
          </div>
          <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold text-[#191512]">
            Register your first bus
          </h2>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-[#E5DCD5] bg-white px-3.5 py-2 text-xs font-bold text-[#655E58] shadow-2xs self-start sm:self-auto">
          {isBusinessApproved ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              <span>Ready for Registration</span>
            </>
          ) : (
            <>
              <Lock className="h-3.5 w-3.5 text-[#7A1D1B]" />
              <span>Requires Business Approval</span>
            </>
          )}
        </div>
      </div>

      {/* 2. Split Editorial Layout */}
      <div className="grid lg:grid-cols-12">
        {/* Left Hero Column */}
        <div className="flex flex-col justify-between border-b border-[#E8E1DB] p-6 sm:p-8 lg:col-span-7 lg:border-b-0 lg:border-r">
          <div className="space-y-4 max-w-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF1EE] text-[#7A1D1B]">
              <BusFront className="h-6 w-6" />
            </div>

            <div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-[#211D1A]">
                Vehicle onboarding &amp; route compliance
              </h3>
              <p className="mt-2 text-xs sm:text-sm font-medium leading-relaxed text-[#746E69]">
                Every bus operating on Shuvmarg must be registered with official Yatayat Bluebook, Route Permit, and seat layout before running on routes and selling tickets.
              </p>
            </div>

            {/* Status Guidance Box */}
            <div className="rounded-2xl border border-[#E8E1DB] bg-[#FFFCFA] p-4 text-xs">
              {isBusinessApproved ? (
                <div className="space-y-1">
                  <div className="font-bold text-[#211D1A] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Business identity verified</span>
                  </div>
                  <p className="text-[#746E69] text-[11px] leading-relaxed">
                    You can now submit your first vehicle for fleet verification.
                  </p>
                  <button
                    type="button"
                    onClick={onRegisterFleet}
                    className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-[#7A1D1B] px-4 text-[11px] font-bold text-white transition hover:bg-[#5C1414]"
                  >
                    <BusFront className="h-4 w-4" />
                    <span>Register bus</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="font-bold text-[#211D1A] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#7A1D1B]" />
                    <span>Step 1 Required: Complete Business Verification</span>
                  </div>
                  <p className="text-[#746E69] text-[11px] leading-relaxed">
                    Vehicle registration is locked until your company registration and tax documents are approved by our compliance team.
                  </p>
                  <div className="pt-1">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7A1D1B] hover:underline"
                    >
                      <span>Check business verification status</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Requirements Column */}
        <aside className="bg-[#FFFCFA] p-6 sm:p-8 lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#817A74]">
              Required for bus registration
            </div>

            <div className="space-y-3">
              {/* Item 1 */}
              <div className="flex items-start gap-3.5 rounded-2xl border border-[#E8E1DB] bg-white p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FAF8F5] text-xs font-bold text-[#7A1D1B] border border-[#EEE8E2]">
                  01
                </div>
                <div>
                  <div className="text-xs font-bold text-[#211D1A]">
                    Vehicle &amp; License Plate
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#746E69] font-medium leading-relaxed">
                    License plate number (e.g. Ba 2 Kha 4920), chassis, and vehicle model.
                  </div>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-start gap-3.5 rounded-2xl border border-[#E8E1DB] bg-white p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FAF8F5] text-xs font-bold text-[#7A1D1B] border border-[#EEE8E2]">
                  02
                </div>
                <div>
                  <div className="text-xs font-bold text-[#211D1A]">
                    Route Permit &amp; Insurance
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#746E69] font-medium leading-relaxed">
                    Valid DoTM route permit and comprehensive commercial vehicle insurance.
                  </div>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-start gap-3.5 rounded-2xl border border-[#E8E1DB] bg-white p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FAF8F5] text-xs font-bold text-[#7A1D1B] border border-[#EEE8E2]">
                  03
                </div>
                <div>
                  <div className="text-xs font-bold text-[#211D1A]">
                    Seating Layout &amp; Amenities
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#746E69] font-medium leading-relaxed">
                    2×2 Deluxe, 2×1 Sofa, or Sleeper seating format with verified amenities.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* 3. Bottom Quiet Verification Timeline */}
      <div className="border-t border-[#E8E1DB] bg-[#FAF8F5] px-6 py-4 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#746E69]">
          <div className="flex items-center gap-2 font-bold text-[#211D1A]">
            <ShieldCheck className="w-4 h-4 text-[#7A1D1B]" />
            <span>Verification Process:</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-neutral-400" />
              1. Submit Vehicle Papers
            </span>
            <span className="text-neutral-300 hidden sm:inline">&rarr;</span>
            <span className="flex items-center gap-1.5">
              <Clock3 className="w-3.5 h-3.5 text-neutral-400" />
              2. 24–48h DoTM Review
            </span>
            <span className="text-neutral-300 hidden sm:inline">&rarr;</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              3. Ready for Routes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

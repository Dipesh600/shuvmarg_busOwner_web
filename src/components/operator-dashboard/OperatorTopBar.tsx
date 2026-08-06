"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  HelpCircle,
  LogOut,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { logout } from "@/lib/auth";
import {
  VerificationStatus,
  getVerificationStatusLabel,
} from "@/features/operator-dashboard/operator-dashboard-contract";

interface OperatorTopBarProps {
  companyName?: string | null;
  ownerName?: string | null;
  verificationStatus: VerificationStatus;
  onMobileMenuToggle?: () => void;
}

export default function OperatorTopBar({
  companyName,
  ownerName,
  verificationStatus,
  onMobileMenuToggle,
}: OperatorTopBarProps) {
  const router = useRouter();

  const displayName = companyName || ownerName || "Your business";

  const handleSignOut = async () => {
    await logout();
    router.replace("/");
  };

  const renderStatusBadge = () => {
    const label = getVerificationStatusLabel(verificationStatus);

    switch (verificationStatus) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#2E7D32] border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {label}
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-[#F59E0B] border border-amber-200">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            {label}
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-[#D32F2F] border border-red-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            {label}
          </span>
        );
      case "not_submitted":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white text-neutral-600 border border-[#EEE8E2]">
            <ShieldAlert className="w-3.5 h-3.5 text-neutral-400" />
            {label}
          </span>
        );
    }
  };

  return (
    <header className="h-24 bg-transparent px-6 lg:px-10 flex items-center justify-between sticky top-0 z-20">
      {/* Left side: Mobile menu toggle + Contextual Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-xl text-neutral-700 bg-white border border-[#EEE8E2] shadow-2xs hover:bg-neutral-50 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Contextual Search Input (UI Affordance) */}
        <div className="relative w-full hidden sm:block">
          <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search setup, fleet, routes…"
            className="w-full h-11 pl-11 pr-4 bg-white rounded-2xl border border-[#EEE8E2] text-xs font-medium text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-[#D96861] transition-all shadow-2xs"
            aria-label="Contextual search"
          />
        </div>
      </div>

      {/* Right side: Status, Support, Notifications, Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden md:block">{renderStatusBadge()}</div>

        {/* Support Affordance */}
        <button
          className="p-2.5 rounded-2xl bg-white border border-[#EEE8E2] text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors shadow-2xs relative"
          title="Operator Support"
          aria-label="Operator support"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Notifications Affordance (No fake badge numbers!) */}
        <button
          className="p-2.5 rounded-2xl bg-white border border-[#EEE8E2] text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors shadow-2xs relative"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-[#EEE8E2] mx-1 hidden sm:block" />

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 h-10 px-3.5 text-xs font-semibold text-red-700 bg-white hover:bg-red-50 rounded-2xl border border-[#EEE8E2] transition-colors shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}

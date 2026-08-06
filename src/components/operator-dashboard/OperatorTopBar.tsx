"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  HelpCircle,
  LogOut,
  Building2,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#2E7D32] border border-emerald-200/80">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {label}
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-[#F59E0B] border border-amber-200/80">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            {label}
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-[#D32F2F] border border-red-200/80">
            <AlertTriangle className="w-3.5 h-3.5" />
            {label}
          </span>
        );
      case "not_submitted":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
            <ShieldAlert className="w-3.5 h-3.5 text-neutral-500" />
            {label}
          </span>
        );
    }
  };

  return (
    <header className="h-16 bg-white border-b border-neutral-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left side: Mobile menu toggle + Company identity */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FDFAF6] border border-[#E8DDCC] flex items-center justify-center text-[#7A1D1B]">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Operator Portal
            </div>
            <div
              className="text-sm font-bold text-neutral-900 truncate max-w-[200px] sm:max-w-[300px]"
              title={displayName}
            >
              {displayName}
            </div>
          </div>
        </div>

        <div className="hidden sm:block ml-2">{renderStatusBadge()}</div>
      </div>

      {/* Right side: Actions & User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Support Affordance */}
        <button
          className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors relative"
          title="Operator Support"
          aria-label="Operator support information"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Notifications Affordance (No fake unread count badge!) */}
        <button
          className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors relative"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-neutral-200 mx-1" />

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 h-9 px-3 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100/80 rounded-xl transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  HelpCircle,
  LogOut,
  Search,
  Clock,
  AlertTriangle,
  ShieldAlert,
  ChevronDown,
  User,
  KeyRound,
} from "lucide-react";
import { logout } from "@/lib/auth";
import {
  VerificationStatus,
  getVerificationStatusLabel,
} from "@/features/operator-dashboard/operator-dashboard-contract";
import NotificationDropdown from "./NotificationDropdown";

interface OperatorTopBarProps {
  companyName?: string | null;
  ownerName?: string | null;
  logoUrl?: string | null;
  verificationStatus: VerificationStatus;
  onMobileMenuToggle?: () => void;
}

export default function OperatorTopBar({
  companyName,
  ownerName,
  logoUrl,
  verificationStatus,
  onMobileMenuToggle,
}: OperatorTopBarProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = companyName || ownerName || "Your business";
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    await logout();
    router.replace("/");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const renderStatusBadge = () => {
    const label = getVerificationStatusLabel(verificationStatus);

    switch (verificationStatus) {
      case "approved":
        return null;
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-[#F59E0B] border border-amber-200 shadow-2xs">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            {label}
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-[#D32F2F] border border-red-200 shadow-2xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            {label}
          </span>
        );
      case "not_submitted":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-neutral-600 border border-[#EEE8E2] shadow-2xs">
            <ShieldAlert className="w-3.5 h-3.5 text-neutral-400" />
            {label}
          </span>
        );
    }
  };

  return (
    <header className="h-24 bg-transparent px-6 lg:px-10 flex items-center justify-between sticky top-0 z-20 gap-4 sm:gap-6">
      {/* Left Column: Mobile Menu Toggle + Left-Aligned Dynamic Search Bar */}
      <div className="flex-1 flex items-center justify-start gap-3 lg:gap-4 min-w-0">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2.5 rounded-2xl text-neutral-700 bg-white border border-[#EEE8E2] shadow-2xs hover:bg-neutral-50 transition-colors shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Left-Aligned Search Bar */}
        <div className="relative w-full max-w-md lg:max-w-xl xl:max-w-2xl 2xl:max-w-4xl hidden sm:block transition-all duration-200">
          <Search className="w-4 h-4 lg:w-5 lg:h-5 text-neutral-400 absolute left-4 lg:left-4.5 top-1/2 -translate-y-1/2 pointer-events-none transition-all" />
          <input
            type="text"
            placeholder="Search buses, routes, setup…"
            className="w-full h-11 lg:h-12 2xl:h-[52px] pl-11 lg:pl-12 pr-4 lg:pr-5 bg-white rounded-2xl border border-[#EEE8E2] text-xs lg:text-sm font-medium text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-[#7A1D1B] focus:ring-2 focus:ring-[#7A1D1B]/10 transition-all shadow-2xs hover:border-neutral-300"
            aria-label="Contextual search"
          />
        </div>
      </div>

      {/* Right Column: Status, Support, Notifications Dropdown, Profile Dropdown */}
      <div className="flex items-center justify-end gap-2.5 sm:gap-3 shrink-0">
        {renderStatusBadge() && (
          <div className="hidden md:block">{renderStatusBadge()}</div>
        )}

        {/* Support Affordance */}
        <button
          className="p-2.5 lg:p-3 rounded-2xl bg-white border border-[#EEE8E2] text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors shadow-2xs relative"
          title="Operator Support"
          aria-label="Operator support"
        >
          <HelpCircle className="w-4 h-4 lg:w-4.5 lg:h-4.5" />
        </button>

        {/* Notifications Affordance & Dropdown Popover */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className="notification-toggle-btn p-2.5 lg:p-3 rounded-2xl bg-white border border-[#EEE8E2] text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors shadow-2xs relative focus:outline-none focus:ring-2 focus:ring-[#7A1D1B]/10"
            title="Notifications"
            aria-label="Notifications"
            aria-expanded={isNotificationsOpen}
          >
            <Bell className="w-4 h-4 lg:w-4.5 lg:h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#D96861] ring-2 ring-white" />
            )}
          </button>

          <NotificationDropdown
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            onUnreadCountChange={setUnreadCount}
          />
        </div>

        <div className="h-6 w-px bg-[#EEE8E2] mx-1 hidden sm:block" />

        {/* Bus Operator Profile & Actions Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex items-center gap-2.5 h-11 lg:h-12 px-3 lg:px-3.5 bg-white hover:bg-neutral-50 rounded-2xl border border-[#EEE8E2] transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#7A1D1B]/10"
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
            aria-label="Operator user menu"
          >
            {logoUrl ? (
              // The operator logo is an authenticated, user-provided remote URL.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={displayName}
                className="w-7 h-7 lg:w-8 lg:h-8 rounded-xl object-cover border border-[#EEE8E2]"
              />
            ) : (
              <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-xl bg-[#7A1D1B] text-white flex items-center justify-center font-bold text-xs lg:text-sm shadow-2xs">
                {initial}
              </div>
            )}
            <span className="text-xs lg:text-sm font-semibold text-neutral-800 max-w-[140px] xl:max-w-[180px] truncate hidden sm:inline-block">
              {displayName}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                isMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Profile Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 lg:w-64 bg-white rounded-2xl border border-[#EEE8E2] shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2.5 border-b border-[#EEE8E2] mb-1">
                <p className="text-xs lg:text-sm font-bold text-neutral-900 truncate">
                  {displayName}
                </p>
                <p className="text-[11px] lg:text-xs font-medium text-neutral-500 truncate mt-0.5">
                  Bus Operator Account
                </p>
              </div>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  router.push("/dashboard/settings");
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs lg:text-sm font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 transition-colors text-left"
              >
                <User className="w-4 h-4 text-neutral-500" />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  router.push("/dashboard/settings?tab=security");
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs lg:text-sm font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 transition-colors text-left"
              >
                <KeyRound className="w-4 h-4 text-neutral-500" />
                <span>Change Password</span>
              </button>

              <div className="my-1 border-t border-[#EEE8E2]" />

              <button
                onClick={async () => {
                  setIsMenuOpen(false);
                  await handleSignOut();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs lg:text-sm font-semibold text-[#D32F2F] hover:bg-red-50 transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-[#D32F2F]" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Lock, X, LogOut } from "lucide-react";
import { logout } from "@/lib/auth";
import {
  OperatorCapabilities,
  VerificationStatus,
  getVerificationStatusLabel,
} from "@/features/operator-dashboard/operator-dashboard-contract";

interface OperatorSidebarProps {
  capabilities: OperatorCapabilities;
  companyName?: string | null;
  ownerName?: string | null;
  ownerCode?: string | null;
  verificationStatus?: VerificationStatus;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  iconPath: string;
  isAllowed: (caps: OperatorCapabilities) => boolean;
}

const navItems: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/dashboard",
    iconPath: "/operator-dashboard/icons/overview.svg",
    isAllowed: () => true,
  },
  {
    id: "business",
    label: "Business Profile",
    href: "/dashboard/business-profile",
    iconPath: "/operator-dashboard/icons/business.svg",
    isAllowed: (caps) => caps.canManageBusiness,
  },
  {
    id: "fleet",
    label: "Fleet Setup",
    href: "/dashboard/fleet",
    iconPath: "/operator-dashboard/icons/fleet.svg",
    isAllowed: (caps) => caps.canPrepareFleet,
  },
  {
    id: "seat-layouts",
    label: "Seat Layouts",
    href: "/dashboard/seat-layouts",
    iconPath: "/operator-dashboard/icons/fleet.svg",
    isAllowed: (caps) => caps.canPrepareFleet,
  },
  {
    id: "trips",
    label: "Trips",
    href: "/dashboard/trips",
    iconPath: "/operator-dashboard/icons/trips.svg",
    isAllowed: (caps) => caps.canManageTrips,
  },
  {
    id: "staff",
    label: "Staff & Agents",
    href: "/dashboard/staff",
    iconPath: "/operator-dashboard/icons/staff.svg",
    isAllowed: () => true,
  },
  {
    id: "bookings",
    label: "Bookings",
    href: "/dashboard/bookings",
    iconPath: "/operator-dashboard/icons/bookings.svg",
    isAllowed: (caps) => caps.canViewBookings,
  },
  {
    id: "finance",
    label: "Finance",
    href: "/dashboard/finance",
    iconPath: "/operator-dashboard/icons/finance.svg",
    isAllowed: (caps) => caps.canViewFinance,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/dashboard/settings",
    iconPath: "/operator-dashboard/icons/settings.svg",
    isAllowed: () => true,
  },
];

export default function OperatorSidebar({
  capabilities,
  companyName,
  ownerName,
  ownerCode,
  verificationStatus = "not_submitted",
  isMobileOpen = false,
  onMobileClose,
}: OperatorSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await logout();
    router.replace("/");
  };

  const displayName = companyName || ownerName || "Your Business";
  const displayCode = ownerCode || "New Account";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const renderNavLinks = () => (
    <nav className="flex-1 px-3.5 space-y-1 overflow-y-auto">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const isUnlocked = item.isAllowed(capabilities);

        if (!isUnlocked) {
          return (
            <div
              key={item.id}
              className="group relative flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-medium text-[#FFF9F5]/70 opacity-80 cursor-not-allowed hover:bg-white/5 transition-all"
              tabIndex={0}
              aria-label={`${item.label} (Locked: Complete business verification to unlock operations)`}
            >
              <div className="flex items-center gap-3.5">
                <span className="w-5 h-5 flex items-center justify-center">
                  <Image
                    src={item.iconPath}
                    alt=""
                    width={18}
                    height={18}
                    className="brightness-0 invert opacity-70"
                  />
                </span>
                <span className="font-manrope text-[13px]">{item.label}</span>
              </div>
              <Lock className="w-3.5 h-3.5 text-white/60" />

              {/* Accessible Tooltip */}
              <div className="absolute left-full ml-3 z-50 hidden group-hover:block group-focus:block px-3 py-1.5 rounded-xl bg-neutral-900 text-[11px] font-medium text-white shadow-xl border border-neutral-800 whitespace-nowrap">
                Complete business verification to unlock operations.
              </div>
            </div>
          );
        }

        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => onMobileClose?.()}
            className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13px] font-semibold transition-all ${
              isActive
                ? "bg-[#FDFAF6] text-neutral-900 shadow-sm font-bold"
                : "text-[#FFF9F5] hover:bg-white/10"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="w-5 h-5 flex items-center justify-center">
              <Image
                src={item.iconPath}
                alt=""
                width={18}
                height={18}
                className={isActive ? "brightness-0" : "brightness-0 invert"}
              />
            </span>
            <span className="font-manrope">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar: Logo sits ABOVE the coral rounded sidebar box */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 h-screen sticky top-0 bg-[#FAF8F5] z-30">
        {/* Brand Logo Header above the coral sidebar */}
        <div className="h-24 px-7 flex items-center flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-0.5">
            <span
              className="text-3xl font-extrabold tracking-tight text-[#161311]"
              style={{ fontFamily: '"Neue Machina", system-ui, sans-serif' }}
            >
              Shuv
            </span>
            <span
              className="text-3xl font-extrabold tracking-tight text-[#D96861]"
              style={{ fontFamily: '"Neue Machina", system-ui, sans-serif' }}
            >
              marg
            </span>
          </Link>
        </div>

        {/* Coral Rounded Sidebar Container starting BELOW the logo */}
        <div className="flex-1 bg-[#D96861] text-[#FFF9F5] rounded-tr-[32px] shadow-xs flex flex-col min-h-0 overflow-hidden pt-4 pb-3">
          {/* Navigation Links */}
          {renderNavLinks()}

          {/* Bottom Operator Identity */}
          <div className="p-3.5 m-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white text-[#7A1D1B] flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {displayName}
                </div>
                <div className="text-[10px] text-white/75 truncate font-mono">
                  {displayCode} · {getVerificationStatusLabel(verificationStatus)}
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title="Sign Out"
              aria-label="Sign out of operator portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 w-72 h-full bg-[#FAF8F5] flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#EEE8E2]">
          <Link href="/dashboard" className="flex items-center gap-0.5">
            <span
              className="text-xl font-bold tracking-tight text-[#161311]"
              style={{ fontFamily: '"Neue Machina", system-ui, sans-serif' }}
            >
              Shuv
            </span>
            <span
              className="text-xl font-bold tracking-tight text-[#D96861]"
              style={{ fontFamily: '"Neue Machina", system-ui, sans-serif' }}
            >
              marg
            </span>
          </Link>
          <button
            onClick={onMobileClose}
            className="p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 bg-[#D96861] text-white flex flex-col min-h-0 overflow-hidden pt-4 pb-3 rounded-tr-3xl">
          {renderNavLinks()}

          <div className="p-3.5 m-3 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-between flex-shrink-0">
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {displayName}
              </div>
              <div className="text-[10px] text-white/75">
                {getVerificationStatusLabel(verificationStatus)}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Bus,
  Route,
  CalendarDays,
  Users,
  Ticket,
  Wallet,
  BarChart3,
  HelpCircle,
  Settings,
  Lock,
  X,
} from "lucide-react";
import { OperatorCapabilities } from "@/features/operator-dashboard/operator-dashboard-contract";

interface OperatorSidebarProps {
  capabilities: OperatorCapabilities;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isAllowed: (caps: OperatorCapabilities) => boolean;
}

const navItems: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    isAllowed: () => true,
  },
  {
    id: "business",
    label: "Business",
    href: "/onboarding", // Compatibility route until /dashboard/business exists
    icon: Building2,
    isAllowed: (caps) => caps.canManageBusiness,
  },
  {
    id: "fleet",
    label: "Fleet",
    href: "/dashboard/fleet",
    icon: Bus,
    isAllowed: (caps) => caps.canPrepareFleet,
  },
  {
    id: "routes",
    label: "Routes",
    href: "/dashboard/routes",
    icon: Route,
    isAllowed: (caps) => caps.canManageRoutes,
  },
  {
    id: "trips",
    label: "Trips",
    href: "/dashboard/trips",
    icon: CalendarDays,
    isAllowed: (caps) => caps.canManageTrips,
  },
  {
    id: "staff",
    label: "Staff",
    href: "/dashboard/staff",
    icon: Users,
    isAllowed: () => true,
  },
  {
    id: "bookings",
    label: "Bookings",
    href: "/dashboard/bookings",
    icon: Ticket,
    isAllowed: (caps) => caps.canViewBookings,
  },
  {
    id: "finance",
    label: "Finance",
    href: "/dashboard/finance",
    icon: Wallet,
    isAllowed: (caps) => caps.canViewFinance,
  },
  {
    id: "reports",
    label: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    isAllowed: (caps) => caps.canViewReports,
  },
  {
    id: "support",
    label: "Support",
    href: "/dashboard/support",
    icon: HelpCircle,
    isAllowed: () => true,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    isAllowed: () => true,
  },
];

export default function OperatorSidebar({
  capabilities,
  isMobileOpen = false,
  onMobileClose,
}: OperatorSidebarProps) {
  const pathname = usePathname();

  const renderNavLinks = () => (
    <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const isUnlocked = item.isAllowed(capabilities);

        if (!isUnlocked) {
          return (
            <div
              key={item.id}
              className="group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-neutral-400 bg-neutral-900/40 border border-neutral-800/50 cursor-not-allowed transition-all"
              tabIndex={0}
              aria-label={`${item.label} (Locked: Complete business verification to unlock operations)`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-neutral-500" />
                <span className="font-manrope">{item.label}</span>
              </div>
              <Lock className="w-3.5 h-3.5 text-neutral-500" />

              {/* Accessible Tooltip */}
              <div className="absolute left-full ml-2 z-50 hidden group-hover:block group-focus:block px-3 py-1.5 rounded-lg bg-neutral-900 text-[11px] font-medium text-neutral-200 shadow-xl border border-neutral-700 whitespace-nowrap">
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
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              isActive
                ? "bg-[#F8F1E3] text-[#7A1D1B] shadow-sm font-bold"
                : "text-neutral-300 hover:text-white hover:bg-white/5"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              className={`w-4 h-4 ${
                isActive ? "text-[#7A1D1B]" : "text-neutral-400"
              }`}
            />
            <span className="font-manrope">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#221715] border-r border-neutral-800 text-white flex-shrink-0 h-screen sticky top-0">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-neutral-800/80">
          <div className="w-8 h-8 rounded-xl bg-[#7A1D1B] flex items-center justify-center text-white font-bold text-base shadow-sm">
            S
          </div>
          <div>
            <div
              className="text-sm font-bold tracking-tight text-white"
              style={{ fontFamily: '"Neue Machina", system-ui, sans-serif' }}
            >
              Shuvmarg
            </div>
            <div className="text-[10px] font-medium text-[#C99A4A] uppercase tracking-wider">
              Operator OS
            </div>
          </div>
        </div>

        {/* Navigation */}
        {renderNavLinks()}

        {/* Bottom Operational Note */}
        <div className="p-4 m-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
          <div className="font-semibold text-neutral-300">
            Platform Access
          </div>
          <p className="text-[10px] leading-relaxed text-neutral-400">
            Verification required before publishing routes & tickets.
          </p>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 w-72 h-full bg-[#221715] text-white flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#7A1D1B] flex items-center justify-center text-white font-bold text-base">
              S
            </div>
            <span
              className="text-base font-bold text-white"
              style={{ fontFamily: '"Neue Machina", system-ui, sans-serif' }}
            >
              Shuvmarg Operator
            </span>
          </div>
          <button
            onClick={onMobileClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {renderNavLinks()}
      </aside>
    </>
  );
}

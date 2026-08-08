"use client";

import React, { useState } from "react";
import OperatorSidebar from "./OperatorSidebar";
import OperatorTopBar from "./OperatorTopBar";
import {
  OperatorCapabilities,
  VerificationStatus,
} from "@/features/operator-dashboard/operator-dashboard-contract";

interface DashboardShellProps {
  children: React.ReactNode;
  companyName?: string | null;
  ownerName?: string | null;
  ownerCode?: string | null;
  logoUrl?: string | null;
  verificationStatus?: VerificationStatus;
  capabilities?: OperatorCapabilities;
}

const defaultCapabilities: OperatorCapabilities = {
  canManageBusiness: true,
  canPrepareFleet: true,
  canManageRoutes: false,
  canManageTrips: false,
  canViewBookings: false,
  canViewFinance: false,
  canViewReports: false,
};

export default function DashboardShell({
  children,
  companyName,
  ownerName,
  ownerCode,
  logoUrl,
  verificationStatus = "not_submitted",
  capabilities = defaultCapabilities,
}: DashboardShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF8F5]">
      {/* Muted Coral Rounded Sidebar */}
      <OperatorSidebar
        capabilities={capabilities}
        companyName={companyName}
        ownerName={ownerName}
        ownerCode={ownerCode}
        verificationStatus={verificationStatus}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Operating Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Transparent Integrated Utility TopBar */}
        <OperatorTopBar
          companyName={companyName}
          ownerName={ownerName}
          logoUrl={logoUrl}
          verificationStatus={verificationStatus}
          onMobileMenuToggle={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        {/* Workspace Canvas */}
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden px-6 lg:px-10 pt-4 sm:pt-6 lg:pt-8"
          data-lenis-prevent="true"
        >
          <div className="max-w-7xl mx-auto space-y-8 pb-12">{children}</div>
        </main>
      </div>
    </div>
  );
}

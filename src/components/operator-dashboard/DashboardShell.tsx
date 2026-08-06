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
  verificationStatus = "not_submitted",
  capabilities = defaultCapabilities,
}: DashboardShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#FDFAF6]">
      {/* Sidebar */}
      <OperatorSidebar
        capabilities={capabilities}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopBar */}
        <OperatorTopBar
          companyName={companyName}
          ownerName={ownerName}
          verificationStatus={verificationStatus}
          onMobileMenuToggle={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        {/* Operating Canvas */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

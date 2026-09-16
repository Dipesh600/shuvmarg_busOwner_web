"use client";

import React from "react";
import { invalidateReadCache } from "@/lib/auth";
import { requestDataRefresh } from "@/lib/data-refresh";
import AuthGuard from "@/components/AuthGuard";
import DashboardShell from "@/components/operator-dashboard/DashboardShell";
import { deriveCapabilities } from "@/features/operator-dashboard/operator-dashboard-contract";
import { SessionProvider, useOperatorSession } from "@/features/operator-dashboard/SessionContext";
import DashboardAutoRefresh from "@/components/operator-dashboard/DashboardAutoRefresh";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard><SessionProvider><SessionShell>{children}</SessionShell></SessionProvider></AuthGuard>;
}

function SessionShell({ children }: { children: React.ReactNode }) {
  const { dashboardState, error } = useOperatorSession();
  return (
    <>
      <DashboardAutoRefresh />
      <DashboardShell
        companyName={dashboardState?.profile?.business?.companyName}
        ownerName={dashboardState?.profile?.profile?.name}
        ownerCode={dashboardState?.profile?.ownerCode}
        verificationStatus={dashboardState?.verificationStatus || "not_submitted"}
        capabilities={
          dashboardState?.capabilities || deriveCapabilities("not_submitted")
        }
      >
        {error && <div role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
          {error} <button type="button" className="ml-2 underline" onClick={() => {
            invalidateReadCache();
            requestDataRefresh();
          }}>Try again</button>
        </div>}
        {children}
      </DashboardShell>
    </>
  );
}

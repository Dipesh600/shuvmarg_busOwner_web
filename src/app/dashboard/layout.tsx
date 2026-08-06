"use client";

import React, { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import DashboardShell from "@/components/operator-dashboard/DashboardShell";
import {
  OperatorDashboardState,
  deriveCapabilities,
} from "@/features/operator-dashboard/operator-dashboard-contract";
import { fetchOperatorDashboardState } from "@/features/operator-dashboard/operator-dashboard-api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dashboardState, setDashboardState] =
    useState<OperatorDashboardState | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchOperatorDashboardState()
      .then((data) => {
        if (isMounted) {
          setDashboardState(data);
        }
      })
      .catch(() => {
        // Handled silently for layout state; page component handles explicit error states
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AuthGuard>
      <DashboardShell
        companyName={dashboardState?.profile?.business?.companyName}
        ownerName={dashboardState?.profile?.profile?.name}
        ownerCode={dashboardState?.profile?.ownerCode}
        verificationStatus={dashboardState?.verificationStatus || "not_submitted"}
        capabilities={
          dashboardState?.capabilities || deriveCapabilities("not_submitted")
        }
      >
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}

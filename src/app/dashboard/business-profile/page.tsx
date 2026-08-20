"use client";

import React, { useEffect, useState } from "react";
import { fetchOperatorDashboardState } from "@/features/operator-dashboard/operator-dashboard-api";
import type { OperatorDashboardState } from "@/features/operator-dashboard/operator-dashboard-contract";
import { BusinessProfileHero } from "./components/BusinessProfileHero";
import { OperatorCard } from "./components/OperatorCard";

export default function BusinessProfilePage() {
  const [dashboardState, setDashboardState] =
    useState<OperatorDashboardState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchOperatorDashboardState()
      .then((state) => {
        if (active) {
          setDashboardState(state);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const isKyced = dashboardState?.verificationStatus === "approved";
  const companyName =
    dashboardState?.profile?.business?.companyName ||
    dashboardState?.profile?.profile?.name ||
    "Business Profile";

  return (
    <div className="w-full">
      <BusinessProfileHero
        isKyced={isKyced}
        companyName={companyName}
        loading={loading}
      />

      {isKyced && (
        <div className="mt-8 flex flex-col gap-5">
          <h2 className="text-lg font-bold text-neutral-900 px-1">Operators</h2>
          <OperatorCard companyName={companyName} />
        </div>
      )}
    </div>
  );
}

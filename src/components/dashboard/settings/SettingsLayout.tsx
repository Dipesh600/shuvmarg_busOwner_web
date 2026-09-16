"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useOperatorSession } from "@/features/operator-dashboard/SessionContext";
import SettingsTabSidebar, { SettingsTabId } from "./SettingsTabSidebar";
import OperatorProfileTab from "./profile/OperatorProfileTab";
import OperatorPayoutTab from "./payout/OperatorPayoutTab";
import OperatorSecurityTab from "./security/OperatorSecurityTab";

export default function SettingsLayout() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabQuery = searchParams.get("tab");
  const activeTab: SettingsTabId =
    tabQuery === "payout" ? "payout" : tabQuery === "security" ? "security" : "profile";

  const { dashboardState: dashboardData, loading: isLoading } = useOperatorSession();

  const handleTabChange = (tabId: SettingsTabId) => {
    router.replace(`/dashboard/settings${tabId === "profile" ? "" : `?tab=${tabId}`}`);
  };

  return (
    <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row gap-6 lg:gap-8">
      {/* Settings Tab Navigation Sidebar */}
      <SettingsTabSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Settings Tab Content Container */}
      <main className="flex-1 min-w-0">
        <div className="bg-white rounded-[24px] border border-neutral-100 p-6 sm:p-8 shadow-sm min-h-[440px]">
          {activeTab === "profile" && (
            <OperatorProfileTab
              profile={dashboardData?.profile || null}
              kycStatus={dashboardData?.kycStatus || null}
              isLoading={isLoading}
            />
          )}

          {activeTab === "payout" && (
            <OperatorPayoutTab
              profile={dashboardData?.profile || null}
              isLoading={isLoading}
            />
          )}

          {activeTab === "security" && <OperatorSecurityTab />}
        </div>
      </main>
    </div>
  );
}

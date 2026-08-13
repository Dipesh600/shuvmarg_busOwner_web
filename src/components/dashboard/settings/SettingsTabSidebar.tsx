"use client";

import React from "react";
import { Building2, Landmark, ShieldCheck, LucideIcon } from "lucide-react";

export type SettingsTabId = "profile" | "payout" | "security";

export interface SettingsTabItem {
  id: SettingsTabId;
  label: string;
  icon: LucideIcon;
}

export const SETTINGS_TABS: SettingsTabItem[] = [
  { id: "profile", label: "Profile", icon: Building2 },
  { id: "payout", label: "Payout Accounts", icon: Landmark },
  { id: "security", label: "Security & Access", icon: ShieldCheck },
];

interface SettingsTabSidebarProps {
  activeTab: SettingsTabId;
  onTabChange: (tabId: SettingsTabId) => void;
}

export default function SettingsTabSidebar({
  activeTab,
  onTabChange,
}: SettingsTabSidebarProps) {
  return (
    <aside className="w-full md:w-64 lg:w-72 shrink-0">
      <div className="bg-white rounded-[24px] border border-neutral-100 p-2 md:p-3 shadow-sm sticky top-24">
        <h2 className="px-4 py-3 text-[18px] font-bold text-neutral-900 mb-2">Settings</h2>

        <nav className="flex flex-col gap-1">
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left w-full ${
                  isActive
                    ? "bg-neutral-100 text-neutral-900 font-semibold"
                    : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 font-medium"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? "text-[#7A1D1B]" : "text-neutral-400"
                  }`}
                />
                <span className="text-[14px]">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

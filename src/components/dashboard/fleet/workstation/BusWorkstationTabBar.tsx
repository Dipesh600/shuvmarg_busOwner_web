"use client";

import React from "react";
import {
  Activity,
  BarChart3,
  Calendar,
  FileText,
  IndianRupee,
  LayoutGrid,
  MessageSquare,
  Users,
} from "lucide-react";

export type WorkstationTabKey =
  | "overview"
  | "operations"
  | "schedule"
  | "timeline"
  | "financial"
  | "crew"
  | "documents"
  | "intelligence";

interface TabItem {
  key: WorkstationTabKey;
  label: string;
  icon: React.ElementType;
}

export const WORKSTATION_TABS: TabItem[] = [
  { key: "overview", label: "Service Overview", icon: LayoutGrid },
  { key: "operations", label: "Operations", icon: Activity },
  { key: "schedule", label: "Schedule", icon: Calendar },
  { key: "timeline", label: "Timeline", icon: BarChart3 },
  { key: "financial", label: "Financial", icon: IndianRupee },
  { key: "crew", label: "Crew", icon: Users },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "intelligence", label: "Intelligence", icon: MessageSquare },
];

interface BusWorkstationTabBarProps {
  activeTab: WorkstationTabKey;
  onSelectTab: (tab: WorkstationTabKey) => void;
}

export function BusWorkstationTabBar({
  activeTab,
  onSelectTab,
}: BusWorkstationTabBarProps) {
  return (
    <div className="w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5">
      <nav
        aria-label="Bus Workstation Navigation"
        style={{
          background:
            "radial-gradient(ellipse at 92% 0%, rgba(220, 101, 94, 0.12) 0%, rgba(220, 101, 94, 0.05) 28%, rgba(220, 101, 94, 0.015) 48%, rgba(255, 255, 255, 0) 68%), #ffffff",
        }}
        className="inline-flex min-w-full sm:min-w-0 sm:w-full items-center justify-start sm:justify-between rounded-2xl sm:rounded-full bg-white p-1.5 border border-[#EDE7E0] shadow-2xs gap-1"
      >
        {WORKSTATION_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelectTab(tab.key)}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl sm:rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-[#7A1D1B] text-white shadow-xs border border-[#7A1D1B]"
                  : "text-[#655E58] hover:text-[#7A1D1B] hover:bg-[#FAF8F5] border border-transparent"
              }`}
            >
              <Icon
                className={`size-3.5 sm:size-4 transition-colors ${
                  isActive ? "text-white" : "text-[#746E69]"
                }`}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

"use client";

import React from "react";

export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

interface ProfileTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (key: string) => void;
}

export default function ProfileTabs({ tabs, activeTab, onChange }: ProfileTabsProps) {
  return (
    <div className="flex border-b border-[#EDE7E0] bg-white overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`group relative flex items-center gap-2 py-3.5 px-5 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              isActive ? "text-[#7A1D1B]" : "text-[#786F66] hover:text-[#111111]"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isActive
                    ? "bg-[#FFF0ED] text-[#7A1D1B]"
                    : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {tab.count}
              </span>
            )}
            {isActive && (
              <div className="absolute bottom-0 inset-x-3 h-[3px] rounded-t-full bg-[#7A1D1B]" />
            )}
          </button>
        );
      })}
    </div>
  );
}

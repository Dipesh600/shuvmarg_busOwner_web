"use client";

import { useState } from "react";
import { Store, Users } from "lucide-react";
import AgentCountersList from "./AgentCountersList";
import CrewMembersList from "./CrewMembersList";

type ActiveTab = "crew" | "agents";

export default function StaffManagementLayout() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("crew");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* ── Top Hero Header Card (Matching Reference media_1789572943066.png) ── */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#EDE7E0] bg-[#FAF8F5] shadow-xs">
        {/* Panoramic Mountain Landscape Background */}
        <div className="absolute inset-0 pointer-events-none select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/my_buses.webp"
            alt="Staff and agents landscape"
            className="size-full object-cover object-[80%_center] sm:object-[88%_center] md:object-right"
          />
          {/* Soft fade overlay on the left to guarantee optimal text contrast across all device sizes */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/85 sm:via-[#FAF8F5]/50 to-transparent w-full sm:w-2/3 md:w-1/2" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-5 sm:p-8 md:p-9 min-h-[160px] sm:min-h-[190px] md:min-h-[200px]">
          <div className="max-w-md sm:max-w-lg space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A1D1B]">
              Staff &amp; agents
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-[42px] font-bold tracking-tight text-[#111111] leading-tight">
              Your team
            </h1>
            <p className="text-xs sm:text-sm text-[#554E48]">
              Manage your onboard crew and ticket-selling agents separately.
            </p>
          </div>
        </div>

        {/* Bottom Attached Tab Bar: Agent & Crew Picker (Flush, no gap, full width, no curves) */}
        <nav
          className="relative z-10 grid grid-cols-1 sm:grid-cols-2 border-t border-[#EDE7E0] bg-white divide-y sm:divide-y-0 sm:divide-x divide-[#EDE7E0]"
          aria-label="People workspace"
        >
          <button
            type="button"
            onClick={() => setActiveTab("crew")}
            className={`group relative flex items-center gap-3.5 p-4 sm:px-6 sm:py-4.5 text-left transition-all duration-200 cursor-pointer focus:outline-none ${
              activeTab === "crew"
                ? "bg-[#FFF8F6]"
                : "bg-white hover:bg-[#FAF8F5]"
            }`}
          >
            {/* Active Dock Indicator: Left accent bar on mobile, bottom dock line on desktop */}
            {activeTab === "crew" && (
              <>
                <div className="sm:hidden absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-[#7A1D1B]" />
                <div className="hidden sm:block absolute bottom-0 inset-x-6 sm:inset-x-8 h-[3.5px] rounded-t-full bg-[#7A1D1B]" />
              </>
            )}
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                activeTab === "crew"
                  ? "bg-[#7A1D1B] text-white shadow-xs scale-[1.02]"
                  : "bg-[#F4EFEA] text-[#786F66] group-hover:bg-[#EBE5DE] group-hover:text-[#111111]"
              }`}
            >
              <Users className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span
                className={`block text-sm font-bold tracking-tight transition-colors ${
                  activeTab === "crew" ? "text-[#7A1D1B]" : "text-[#111111] group-hover:text-black"
                }`}
              >
                Crew
              </span>
              <span className="mt-0.5 block text-xs text-[#786F66] truncate">
                Drivers and conductors assigned to buses
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("agents")}
            className={`group relative flex items-center gap-3.5 p-4 sm:px-6 sm:py-4.5 text-left transition-all duration-200 cursor-pointer focus:outline-none ${
              activeTab === "agents"
                ? "bg-[#FFF8F6]"
                : "bg-white hover:bg-[#FAF8F5]"
            }`}
          >
            {/* Active Dock Indicator: Left accent bar on mobile, bottom dock line on desktop */}
            {activeTab === "agents" && (
              <>
                <div className="sm:hidden absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-[#7A1D1B]" />
                <div className="hidden sm:block absolute bottom-0 inset-x-6 sm:inset-x-8 h-[3.5px] rounded-t-full bg-[#7A1D1B]" />
              </>
            )}
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                activeTab === "agents"
                  ? "bg-[#7A1D1B] text-white shadow-xs scale-[1.02]"
                  : "bg-[#F4EFEA] text-[#786F66] group-hover:bg-[#EBE5DE] group-hover:text-[#111111]"
              }`}
            >
              <Store className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span
                className={`block text-sm font-bold tracking-tight transition-colors ${
                  activeTab === "agents" ? "text-[#7A1D1B]" : "text-[#111111] group-hover:text-black"
                }`}
              >
                Ticket agents
              </span>
              <span className="mt-0.5 block text-xs text-[#786F66] truncate">
                People who sell tickets for your brands
              </span>
            </span>
          </button>
        </nav>
      </div>

      {activeTab === "agents" ? <AgentCountersList /> : <CrewMembersList />}
    </div>
  );
}

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
      <header>
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">Staff &amp; agents</h1>
        <p className="mt-1 text-sm text-neutral-500">Manage your onboard crew and ticket-selling agents separately.</p>
      </header>

      <nav className="grid gap-3 sm:grid-cols-2" aria-label="People workspace">
        <button type="button" onClick={() => setActiveTab("agents")} className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${activeTab === "agents" ? "border-[#7A1D1B] bg-[#FFF7F5] shadow-sm" : "border-neutral-200 bg-white hover:border-neutral-300"}`}>
          <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${activeTab === "agents" ? "bg-[#7A1D1B] text-white" : "bg-neutral-100 text-neutral-500"}`}><Store className="h-5 w-5" /></span>
          <span><span className="block text-sm font-bold text-neutral-900">Ticket agents</span><span className="mt-0.5 block text-xs text-neutral-500">People who sell tickets for your brands</span></span>
        </button>
        <button type="button" onClick={() => setActiveTab("crew")} className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${activeTab === "crew" ? "border-[#7A1D1B] bg-[#FFF7F5] shadow-sm" : "border-neutral-200 bg-white hover:border-neutral-300"}`}>
          <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${activeTab === "crew" ? "bg-[#7A1D1B] text-white" : "bg-neutral-100 text-neutral-500"}`}><Users className="h-5 w-5" /></span>
          <span><span className="block text-sm font-bold text-neutral-900">Crew</span><span className="mt-0.5 block text-xs text-neutral-500">Drivers and conductors assigned to buses</span></span>
        </button>
      </nav>

      {activeTab === "agents" ? <AgentCountersList /> : <CrewMembersList />}
    </div>
  );
}

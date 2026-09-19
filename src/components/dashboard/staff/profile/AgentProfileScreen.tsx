"use client";

import React, { useState } from "react";
import type { AgentAssignment } from "@/features/agent-assignment/agent-assignment-contract";
import { ProfileHeroCard } from "./ProfileHeroCard";
import { AgentCounterTermsCard } from "./AgentCounterTermsCard";
import { AgentSalesActivityCard } from "./AgentSalesActivityCard";
import { AgentDetailsCard } from "./AgentDetailsCard";
import { FileText, X } from "lucide-react";

interface AgentProfileScreenProps {
  assignment: AgentAssignment;
  onBack: () => void;
  onEditTerms?: () => void;
}

export default function AgentProfileScreen({
  assignment,
  onBack,
  onEditTerms,
}: AgentProfileScreenProps) {
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false);

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* ── Top Hero Profile Card with Back Link ── */}
      <ProfileHeroCard
        name={assignment.agent.name || "Ticket agent"}
        roleLabel="Ticket agent"
        status={assignment.status}
        statusLabel={assignment.status === "ACTIVE" ? "Active" : assignment.status === "INVITED" ? "Pending" : assignment.status}
        code={assignment.agent.agentCode}
        codeLabel="Agent Code"
        phone={assignment.agent.phone}
        brandName={assignment.brand.name}
        onBack={onBack}
        onEdit={onEditTerms}
      />

      {/* ── Counter & Access Terms Card ── */}
      <AgentCounterTermsCard
        assignment={assignment}
        onEditTerms={onEditTerms}
      />

      {/* ── Recent Sales Activity Card ── */}
      <AgentSalesActivityCard assignment={assignment} />

      {/* ── Agent Details Card ── */}
      <AgentDetailsCard
        assignment={assignment}
        onEditDetails={onEditTerms}
        onViewDocuments={() => setIsDocumentsOpen(true)}
      />

      {/* ── Documents Modal ── */}
      {isDocumentsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl border border-[#EDE7E0] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#EDE7E0] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-[#7A1D1B]" />
                <h3 className="font-bold text-[#111111] text-sm">Agent documents</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDocumentsOpen(false)}
                className="size-7 rounded-full flex items-center justify-center text-[#746E69] hover:bg-[#FAF8F5]"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EDE7E0] flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#111111]">Agency Registration</p>
                  <p className="text-[11px] text-[#746E69]">Authorized ticketing counter</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#065F46] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md">
                  Active
                </span>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsDocumentsOpen(false)}
                className="rounded-full border border-[#EDE7E0] bg-white px-4 py-1.5 text-xs font-semibold text-[#191512] shadow-2xs hover:bg-[#FAF8F5]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

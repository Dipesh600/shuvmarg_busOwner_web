"use client";

import React, { useState } from "react";
import SupportHeader from "@/components/dashboard/support/SupportHeader";
import PriorityChannelsGrid from "@/components/dashboard/support/PriorityChannelsGrid";
import OperatorFaqSection from "@/components/dashboard/support/OperatorFaqSection";
import CreateSupportTicketModal from "@/components/dashboard/support/CreateSupportTicketModal";

export default function OperatorSupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      {/* 1. Header Banner with Search & Action */}
      <SupportHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenTicketModal={() => setIsTicketModalOpen(true)}
      />

      {/* 2. Direct Contact Channels (Call, WhatsApp, Email) */}
      <PriorityChannelsGrid />

      {/* 3. Common Questions & Answers Accordion */}
      <OperatorFaqSection
        searchQuery={searchQuery}
        onClearSearch={() => setSearchQuery("")}
      />

      {/* 4. Simple Send Message Modal */}
      <CreateSupportTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
      />
    </div>
  );
}

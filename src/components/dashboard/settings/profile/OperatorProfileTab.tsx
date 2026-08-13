"use client";

import React, { useState } from "react";
import {
  BusOwnerProfile,
  BusOwnerKycStatus,
  KycDocumentDescriptor,
} from "@/features/operator-dashboard/operator-dashboard-contract";
import OperatorProfileHeader from "./OperatorProfileHeader";
import BusinessDetailsSection from "./BusinessDetailsSection";
import OperatorPersonalSection from "./OperatorPersonalSection";
import RegisteredAddressSection from "./RegisteredAddressSection";
import SubmittedDocumentsSection from "./SubmittedDocumentsSection";
import AccountTimelineSection from "./AccountTimelineSection";
import SecureDocViewerModal from "./SecureDocViewerModal";

interface OperatorProfileTabProps {
  profile: BusOwnerProfile | null;
  kycStatus: BusOwnerKycStatus | null;
  isLoading: boolean;
}

export default function OperatorProfileTab({
  profile,
  kycStatus,
  isLoading,
}: OperatorProfileTabProps) {
  const [selectedDoc, setSelectedDoc] = useState<{
    url: string;
    label: string;
    documentType: string;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-neutral-100">
          <div className="w-20 h-20 rounded-2xl bg-neutral-100" />
          <div className="space-y-2 flex-1">
            <div className="h-6 bg-neutral-100 rounded w-1/3" />
            <div className="h-4 bg-neutral-100 rounded w-1/4" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-11 bg-neutral-50 rounded-xl" />
          <div className="h-11 bg-neutral-50 rounded-xl" />
          <div className="h-11 bg-neutral-50 rounded-xl" />
          <div className="h-11 bg-neutral-50 rounded-xl" />
        </div>
      </div>
    );
  }

  const companyName = profile?.business?.companyName || "Your Bus Transport Business";
  const ownerName = profile?.profile?.name || "Bus Operator";
  const phone = profile?.profile?.phone || "N/A";
  const email = profile?.profile?.email || null;
  const ownerCode = profile?.ownerCode || "N/A";
  const ownerId = profile?.ownerId || kycStatus?.ownerId || "";
  const verificationStatus = (profile?.verificationStatus || "not_submitted").toLowerCase();

  const address = profile?.business?.registeredAddress;
  const panNumber = kycStatus?.submittedDetails?.panNumber || null;
  const regNumber = kycStatus?.submittedDetails?.registrationNumber || null;
  const documents: KycDocumentDescriptor[] = kycStatus?.documents || [];

  return (
    <div className="space-y-8">
      {/* 1. Header / Operator Identity Badge */}
      <OperatorProfileHeader
        ownerName={ownerName}
        companyName={companyName}
        avatarUrl={profile?.profile?.profilePicture}
        ownerCode={ownerCode}
        verificationStatus={verificationStatus}
      />

      <div className="space-y-8 max-w-4xl">
        {/* 2. Business Details */}
        <BusinessDetailsSection
          companyName={companyName}
          regNumber={regNumber}
          panNumber={panNumber}
          ownerCode={ownerCode}
        />

        {/* 3. Operator Personal Details */}
        <OperatorPersonalSection
          ownerName={ownerName}
          phone={phone}
          email={email}
        />

        {/* 4. Registered Office / Location */}
        <RegisteredAddressSection address={address} />

        {/* 5. Submitted Documents */}
        <SubmittedDocumentsSection
          documents={documents}
          ownerId={ownerId}
          onSelectDoc={setSelectedDoc}
        />

        {/* 6. Account Timeline */}
        <AccountTimelineSection
          createdAt={profile?.createdAt}
          updatedAt={profile?.updatedAt}
        />
      </div>

      {/* 7. Document Preview Modal */}
      <SecureDocViewerModal
        selectedDoc={selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />
    </div>
  );
}

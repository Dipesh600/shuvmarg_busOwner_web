import React from "react";
import OperatorAvatarBadge from "../OperatorAvatarBadge";

interface OperatorProfileHeaderProps {
  ownerName: string;
  companyName: string;
  avatarUrl?: string | null;
  ownerCode: string;
  verificationStatus: string;
}

export default function OperatorProfileHeader({
  ownerName,
  companyName,
  avatarUrl,
  ownerCode,
  verificationStatus,
}: OperatorProfileHeaderProps) {
  const isVerified = verificationStatus === "approved";
  const isPending = verificationStatus === "pending";
  const isRejected = verificationStatus === "rejected";

  return (
    <div className="flex items-center gap-6 pb-8 border-b border-neutral-100">
      <OperatorAvatarBadge
        name={ownerName}
        companyName={companyName}
        avatarUrl={avatarUrl}
        isVerified={isVerified}
        size="lg"
      />

      <div>
        <h3 className="text-[22px] font-bold text-neutral-900 leading-tight mb-1">
          {companyName}
        </h3>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-[13px] text-neutral-500 font-medium">Owner: {ownerName}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
          <span className="text-[13px] text-neutral-500 font-medium font-mono">ID: {ownerCode}</span>

          {isVerified && (
            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[11px] font-bold uppercase tracking-wider rounded-md border border-green-100">
              Verified
            </span>
          )}
          {isPending && (
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[11px] font-bold uppercase tracking-wider rounded-md border border-amber-100">
              Pending Review
            </span>
          )}
          {isRejected && (
            <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[11px] font-bold uppercase tracking-wider rounded-md border border-red-100">
              Rejected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

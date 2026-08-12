"use client";

import React from "react";
import { BusOwnerProfile } from "@/features/operator-dashboard/operator-dashboard-contract";
import PrimaryBankAccountCard from "./PrimaryBankAccountCard";
import PayoutEmptyState from "./PayoutEmptyState";
import PayoutNoticeCard from "./PayoutNoticeCard";

interface OperatorPayoutTabProps {
  profile: BusOwnerProfile | null;
  isLoading: boolean;
}

export default function OperatorPayoutTab({ profile, isLoading }: OperatorPayoutTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-6 bg-neutral-100 rounded w-1/4" />
        <div className="h-32 bg-neutral-50 rounded-2xl" />
      </div>
    );
  }

  const bank = profile?.bank;
  const hasBank = bank && bank.present && (bank.accountNumber || bank.bankName);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-[20px] font-bold text-neutral-900 leading-tight">
          Payout Accounts
        </h2>
        <p className="text-[13px] text-neutral-500 font-medium mt-1">
          Manage where you receive your bus booking settlements and ticket payouts.
        </p>
      </div>

      {hasBank ? (
        <div className="space-y-6 max-w-3xl">
          <PrimaryBankAccountCard bank={bank} profileName={profile?.profile?.name} />
          <PayoutNoticeCard />
        </div>
      ) : (
        <PayoutEmptyState />
      )}
    </div>
  );
}

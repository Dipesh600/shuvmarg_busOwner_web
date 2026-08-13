"use client";

import React, { useState } from "react";
import {
  Landmark,
  Building,
  CheckCircle,
  Hash,
  User,
  ShieldCheck,
  CreditCard,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";
import { BusOwnerProfile } from "@/features/operator-dashboard/operator-dashboard-contract";

interface PrimaryBankAccountCardProps {
  bank: NonNullable<BusOwnerProfile["bank"]>;
  profileName?: string | null;
}

export default function PrimaryBankAccountCard({
  bank,
  profileName,
}: PrimaryBankAccountCardProps) {
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [copied, setCopied] = useState(false);

  // Mask account number (show only last 4 digits)
  const maskAccountNumber = (accNum?: string | null) => {
    if (!accNum) return "•••• •••• ••••";
    const clean = accNum.replace(/\s+/g, "");
    if (clean.length <= 4) return clean;
    const lastFour = clean.slice(-4);
    return `•••• •••• •••• ${lastFour}`;
  };

  const handleCopy = () => {
    if (!bank.accountNumber) return;
    navigator.clipboard.writeText(bank.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm relative overflow-hidden">
      {/* Top Row: Bank Info & Primary Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[#7A1D1B] shrink-0 shadow-sm">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-neutral-900 leading-tight">
              {bank.bankName || "Commercial Bank"}
            </h3>
            <p className="text-[13px] text-neutral-500 mt-0.5">
              {bank.branchName ? `Branch: ${bank.branchName}` : "Designated Settlement Account"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 text-[11px] font-bold rounded-lg uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
            <CheckCircle className="w-3.5 h-3.5" />
            Primary Account
          </span>
        </div>
      </div>

      {/* Account Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-5">
        <div>
          <label className="block text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-neutral-400" />
            Account Holder Name
          </label>
          <div className="min-h-11 px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[14px] font-medium text-neutral-800 flex items-center">
            {bank.accountHolderName || profileName || "—"}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[12px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-neutral-400" />
              Account Number
            </label>
            {bank.accountNumber && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowAccountNumber(!showAccountNumber)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200/80 rounded-md transition-colors"
                  title={showAccountNumber ? "Hide account number" : "Show account number"}
                >
                  {showAccountNumber ? (
                    <>
                      <EyeOff className="w-3 h-3 text-neutral-500" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 text-neutral-500" />
                      <span>Show</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200/80 rounded-md transition-colors"
                  title="Copy account number"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-green-600" />
                      <span className="text-green-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-neutral-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          <div className="min-h-11 px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[14px] font-mono font-semibold text-neutral-900 tracking-wider flex items-center justify-between">
            <span>
              {showAccountNumber
                ? bank.accountNumber || "—"
                : maskAccountNumber(bank.accountNumber)}
            </span>
          </div>
        </div>

        {bank.branchName && (
          <div>
            <label className="block text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-neutral-400" />
              Branch Location
            </label>
            <div className="min-h-11 px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[14px] font-medium text-neutral-700 flex items-center">
              {bank.branchName}
            </div>
          </div>
        )}

        {bank.swiftCode && (
          <div>
            <label className="block text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-neutral-400" />
              SWIFT / Routing Code
            </label>
            <div className="min-h-11 px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[14px] font-mono font-semibold text-neutral-900 flex items-center">
              {bank.swiftCode}
            </div>
          </div>
        )}
      </div>

      {/* Direct Settlement Guarantee */}
      <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center gap-2 text-[12px] text-neutral-600">
        <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
        <span>Verified for automated banking settlements across Nepal clearing networks.</span>
      </div>
    </div>
  );
}

import React from "react";
import { HelpCircle } from "lucide-react";

export default function PayoutNoticeCard() {
  return (
    <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-start gap-3">
      <HelpCircle className="w-4 h-4 text-[#7A1D1B] shrink-0 mt-0.5" />
      <div className="text-[13px] text-neutral-600 space-y-1">
        <p className="font-bold text-neutral-900">Need to update your settlement bank details?</p>
        <p>
          To maintain compliance and protect operator funds, changes to payout bank accounts require formal verification. Please submit an update request to Shuvmarg Operator Support.
        </p>
      </div>
    </div>
  );
}

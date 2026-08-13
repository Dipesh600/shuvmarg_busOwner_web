import React from "react";
import { Landmark } from "lucide-react";

export default function PayoutEmptyState() {
  return (
    <div className="py-12 px-6 text-center bg-neutral-50 border border-neutral-200 rounded-2xl max-w-xl">
      <div className="w-14 h-14 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center text-[#7A1D1B] mx-auto mb-3 shadow-sm">
        <Landmark className="w-7 h-7" />
      </div>
      <h3 className="text-[16px] font-bold text-neutral-900 mb-1">
        No Payout Account Configured Yet
      </h3>
      <p className="text-[13px] text-neutral-500 max-w-md mx-auto mb-5">
        Your ticket revenue settlements will be transferred directly to your bank account. Please complete your business onboarding verification to register your bank details.
      </p>
    </div>
  );
}

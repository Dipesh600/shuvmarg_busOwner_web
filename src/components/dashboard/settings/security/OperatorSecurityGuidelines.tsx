import React from "react";
import { ShieldCheck } from "lucide-react";

export default function OperatorSecurityGuidelines() {
  return (
    <div className="p-5 bg-white border border-neutral-200 rounded-2xl space-y-3 shadow-sm">
      <div className="flex items-center gap-2 text-[14px] font-bold text-neutral-900">
        <ShieldCheck className="w-4 h-4 text-[#7A1D1B]" />
        <span>Security Recommendations for Fleet Operators</span>
      </div>
      <ul className="text-[13px] text-neutral-600 space-y-2 list-disc list-inside">
        <li>Never share your operator credentials or settlement password with unauthorized staff.</li>
        <li>Ensure your registered mobile phone is kept active to receive booking and dispatch alerts.</li>
        <li>Log out of shared counter or ticketing office terminals after each shift.</li>
      </ul>
    </div>
  );
}

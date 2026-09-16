import React from "react";
import { CheckCircle2, Copy } from "lucide-react";
import type { TemplateDetail } from "@/features/seat-layout-v3/types";

interface SeatLayoutMetaFormProps {
  selected: TemplateDetail;
  name: string;
  code: string;
  summary: string;
  busy: boolean;
  onNameChange: (val: string) => void;
  onCodeChange: (val: string) => void;
  onSummaryChange: (val: string) => void;
  onAdopt: () => void;
}

export function SeatLayoutMetaForm({
  selected,
  name,
  code,
  summary,
  busy,
  onNameChange,
  onCodeChange,
  onSummaryChange,
  onAdopt,
}: SeatLayoutMetaFormProps) {
  const isOperator = selected.template.scope === "OPERATOR";

  return (
    <div className="space-y-4">
      {/* Top Grid: Name, Code, Scope Action */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_220px_auto] items-end">
        {/* Layout Name */}
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#938A82]">
          Layout name
          <input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            disabled={isOperator}
            className="mt-1.5 h-11 w-full rounded-xl border border-[#EDE7E0] bg-white px-3.5 text-sm font-semibold text-[#191512] outline-none focus:border-[#7A1D1B] transition disabled:bg-[#FAF8F5] disabled:text-[#44403C]"
            placeholder="Layout name"
          />
        </label>

        {/* Private Code */}
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#938A82]">
          Private code
          <input
            value={code}
            onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
            disabled={isOperator}
            className="mt-1.5 h-11 w-full rounded-xl border border-[#EDE7E0] bg-white px-3.5 text-sm font-mono font-semibold text-[#191512] outline-none focus:border-[#7A1D1B] transition disabled:bg-[#FAF8F5] disabled:text-[#44403C]"
            placeholder="Code"
          />
        </label>

        {/* Action Button / Scope Badge */}
        <div className="flex items-end sm:col-span-2 lg:col-span-1">
          {selected.template.scope === "PLATFORM" ? (
            <button
              type="button"
              onClick={onAdopt}
              disabled={busy}
              className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] px-5 text-xs font-bold text-white shadow-xs transition hover:bg-[#641715] disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              <Copy className="size-4 shrink-0" />
              <span>Copy to my library</span>
            </button>
          ) : (
            <span className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#E8F8F0] px-4 text-xs font-bold text-[#1E7E4A] whitespace-nowrap">
              <CheckCircle2 className="size-4 shrink-0 text-[#1E7E4A]" />
              <span>Private operator layout</span>
            </span>
          )}
        </div>
      </div>

      {/* Summary Field (Only for Operator-owned layouts) */}
      {isOperator && (
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#938A82]">
          What changed?
          <input
            value={summary}
            onChange={(e) => onSummaryChange(e.target.value)}
            className="mt-1.5 h-11 w-full rounded-xl border border-[#EDE7E0] bg-white px-3.5 text-sm font-semibold text-[#191512] outline-none focus:border-[#7A1D1B] transition"
            placeholder="Notes on what changed"
          />
        </label>
      )}
    </div>
  );
}

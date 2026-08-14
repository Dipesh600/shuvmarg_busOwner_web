import React from "react";

interface InfoFieldProps {
  label: string;
  value: string | number | null | undefined;
  mono?: boolean;
}

export default function InfoField({ label, value, mono = false }: InfoFieldProps) {
  return (
    <div>
      <label className="block text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
        {label}
      </label>
      <div
        className={`min-h-11 px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center text-[14px] text-neutral-700 font-medium ${
          mono ? "font-mono font-semibold" : ""
        }`}
      >
        {value ? (
          <span>{value}</span>
        ) : (
          <span className="text-neutral-400 font-normal italic">Not provided</span>
        )}
      </div>
    </div>
  );
}

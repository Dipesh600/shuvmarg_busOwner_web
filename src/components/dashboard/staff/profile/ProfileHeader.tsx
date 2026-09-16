"use client";

import React, { useState } from "react";
import { ArrowLeft, Copy, Check } from "lucide-react";

interface ProfileHeaderProps {
  name: string;
  roleLabel: string;
  statusBadge: React.ReactNode;
  code?: string | null;
  codeLabel?: string;
  brandName?: string | null;
  backLabel: string;
  onBack: () => void;
  avatarContent: React.ReactNode;
  actions?: React.ReactNode;
}

export default function ProfileHeader({
  name,
  roleLabel,
  statusBadge,
  code,
  codeLabel = "ID",
  brandName,
  backLabel,
  onBack,
  avatarContent,
  actions,
}: ProfileHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#554E48] hover:text-[#7A1D1B] transition-colors group cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>{backLabel}</span>
        </button>
      </div>

      {/* Hero Banner Card */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#EDE7E0] bg-[#FAF8F5] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Avatar */}
            <div className="flex h-16 w-16 sm:h-18 sm:w-18 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0ED] text-[#7A1D1B] font-bold text-xl border border-[#FAD8D3] shadow-xs">
              {avatarContent}
            </div>

            {/* Identity Details */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111] truncate">
                  {name}
                </h1>
                <span className="rounded-full bg-[#FAF0ED] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-[#7A1D1B] border border-[#F5D8D3]">
                  {roleLabel}
                </span>
                {statusBadge}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[#554E48]">
                {code && (
                  <>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 font-mono text-neutral-500 hover:text-[#7A1D1B] transition-colors"
                      title={`Copy ${codeLabel}`}
                    >
                      <span className="font-semibold text-neutral-600">{code}</span>
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <span>·</span>
                  </>
                )}
                <span className="font-semibold text-neutral-800">
                  {brandName || "All brands"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

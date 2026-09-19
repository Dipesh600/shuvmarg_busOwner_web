"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Copy,
  Check,
  Phone,
  Building2,
  MoreVertical,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
} from "lucide-react";
import type { StaffOperationalStatus } from "../staff-contract";

interface ProfileHeroCardProps {
  name: string;
  roleLabel: string;
  status: string;
  statusLabel?: string;
  code?: string | null;
  codeLabel?: string;
  phone?: string | null;
  brandName?: string | null;
  onBack: () => void;
  onEdit?: () => void;
  onStatusChange?: (status: StaffOperationalStatus) => void;
  onRemove?: () => void;
}

export function ProfileHeroCard({
  name,
  roleLabel,
  status,
  statusLabel,
  code,
  codeLabel = "Staff Code",
  phone,
  brandName,
  onBack,
  onEdit,
  onStatusChange,
  onRemove,
}: ProfileHeroCardProps) {
  const [copied, setCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false);
    };
    if (isMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const initials = name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  const handleCopyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isAvailable = status.toUpperCase() === "AVAILABLE" || status.toUpperCase() === "ACTIVE";

  return (
    <div className="space-y-4">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#7A1D1B] hover:text-[#641715] transition-colors cursor-pointer group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Staff &amp; Agents</span>
        </button>
      </div>

      {/* Hero Profile Card */}
      <div className="relative rounded-2xl sm:rounded-3xl border border-[#EDE7E0] bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Circular Initials Avatar */}
            <div className="size-14 sm:size-16 shrink-0 rounded-full bg-[#FDE7E6] text-[#7A1D1B] font-bold text-lg sm:text-xl flex items-center justify-center border border-[#F8C9C7] shadow-2xs">
              {initials || "ST"}
            </div>

            {/* Main Info */}
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111] truncate">
                  {name}
                </h1>

                {/* Role Pill */}
                <span className="rounded-full bg-[#FFF5F4] border border-[#F8C9C7] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#7A1D1B]">
                  {roleLabel}
                </span>

                {/* Status Pill */}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                    isAvailable
                      ? "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]"
                      : "bg-[#FFF8ED] text-[#976B18] border-[#F8DEAE]"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      isAvailable ? "bg-[#059669]" : "bg-[#D97706]"
                    }`}
                  />
                  <span>{statusLabel || status}</span>
                </span>
              </div>

              {/* Subline Details */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#554E48]">
                {code && (
                  <>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1 font-mono text-[#554E48] hover:text-[#7A1D1B] transition-colors"
                      title={`Copy ${codeLabel}`}
                    >
                      <span className="font-semibold">{code}</span>
                      {copied ? (
                        <Check className="size-3 text-emerald-600" />
                      ) : (
                        <Copy className="size-3 text-[#A89F95]" />
                      )}
                    </button>
                    <span className="text-[#DCD5CD]">|</span>
                  </>
                )}

                {phone && (
                  <>
                    <a
                      href={`tel:${phone}`}
                      className="inline-flex items-center gap-1 text-[#554E48] hover:text-[#7A1D1B] transition-colors"
                    >
                      <Phone className="size-3 text-[#7A1D1B]" />
                      <span className="font-semibold">{phone}</span>
                    </a>
                    <span className="text-[#DCD5CD]">|</span>
                  </>
                )}

                <div className="inline-flex items-center gap-1 font-medium text-[#554E48]">
                  <Building2 className="size-3 text-[#7A1D1B]" />
                  <span>{brandName || "All brands"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right 3-dots Menu Button */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="size-9 rounded-xl border border-[#EDE7E0] bg-white flex items-center justify-center text-[#554E48] shadow-2xs hover:bg-[#FAF8F5] transition"
              title="More actions"
            >
              <MoreVertical className="size-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-10 z-30 w-48 rounded-2xl border border-[#EDE7E0] bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150 text-xs">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEdit();
                    }}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2 font-medium text-[#111111] hover:bg-[#FAF8F5] transition"
                  >
                    <Edit2 className="size-3.5 text-[#554E48]" />
                    <span>Edit details</span>
                  </button>
                )}

                {onStatusChange && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onStatusChange("AVAILABLE");
                      }}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 font-medium text-[#111111] hover:bg-[#FAF8F5] transition"
                    >
                      <CheckCircle2 className="size-3.5 text-[#059669]" />
                      <span>Mark Available</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onStatusChange("OFF_DUTY");
                      }}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 font-medium text-[#111111] hover:bg-[#FAF8F5] transition"
                    >
                      <Clock className="size-3.5 text-[#D97706]" />
                      <span>Mark Off Duty</span>
                    </button>
                  </>
                )}

                {onRemove && (
                  <>
                    <div className="my-1 border-t border-[#EDE7E0]" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onRemove();
                      }}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 font-semibold text-rose-600 hover:bg-[#FFF5F4] transition"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Remove access</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

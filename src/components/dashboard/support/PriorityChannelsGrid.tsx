"use client";

import React, { useState } from "react";
import { PhoneCall, Mail, MessageSquare, Copy, Check, ExternalLink } from "lucide-react";

export default function PriorityChannelsGrid() {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText("+977-1-5970000");
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("support@shuvmarg.com");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Channel 1: 24/7 Phone Line */}
      <div className="bg-white rounded-3xl border border-[#EEE8E2] p-6 shadow-2xs flex flex-col justify-between hover:border-neutral-300 transition-all space-y-5">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#7A1D1B] border border-red-100 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full border border-emerald-200">
              24/7 Available
            </span>
          </div>

          <h3 className="text-base font-bold text-neutral-900 mb-1">
            Call Support Hotline
          </h3>
          <p className="text-xs text-neutral-500 leading-relaxed font-medium">
            For urgent road issues, bus breakdowns, or immediate passenger emergency assistance.
          </p>
        </div>

        <div className="pt-4 border-t border-[#EEE8E2] flex items-center justify-between">
          <a
            href="tel:+97715970000"
            className="text-sm font-bold text-[#7A1D1B] hover:underline font-mono"
          >
            +977-1-5970000
          </a>
          <button
            type="button"
            onClick={handleCopyPhone}
            className="p-2 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100 transition-colors"
            title="Copy phone number"
          >
            {copiedPhone ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Channel 2: WhatsApp Chat */}
      <div className="bg-white rounded-3xl border border-[#EEE8E2] p-6 shadow-2xs flex flex-col justify-between hover:border-neutral-300 transition-all space-y-5">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full border border-emerald-200">
              Fast Reply
            </span>
          </div>

          <h3 className="text-base font-bold text-neutral-900 mb-1">
            WhatsApp Chat
          </h3>
          <p className="text-xs text-neutral-500 leading-relaxed font-medium">
            For quick counter questions, ticket confirmations, and everyday support.
          </p>
        </div>

        <div className="pt-4 border-t border-[#EEE8E2] flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-600">WhatsApp Desk</span>
          <a
            href="https://wa.me/9779801234567"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#7A1D1B] hover:underline"
          >
            <span>Open Chat</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Channel 3: Email */}
      <div className="bg-white rounded-3xl border border-[#EEE8E2] p-6 shadow-2xs flex flex-col justify-between hover:border-neutral-300 transition-all space-y-5">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 border border-amber-100 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-1 bg-neutral-100 text-neutral-600 text-[11px] font-bold rounded-full border border-[#EEE8E2]">
              Official
            </span>
          </div>

          <h3 className="text-base font-bold text-neutral-900 mb-1">
            Email Support
          </h3>
          <p className="text-xs text-neutral-500 leading-relaxed font-medium">
            For bank account changes, official business documents, and contract questions.
          </p>
        </div>

        <div className="pt-4 border-t border-[#EEE8E2] flex items-center justify-between">
          <a
            href="mailto:support@shuvmarg.com"
            className="text-xs font-bold text-neutral-900 hover:text-[#7A1D1B] hover:underline truncate mr-2"
          >
            support@shuvmarg.com
          </a>
          <button
            type="button"
            onClick={handleCopyEmail}
            className="p-2 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100 transition-colors shrink-0"
            title="Copy email address"
          >
            {copiedEmail ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

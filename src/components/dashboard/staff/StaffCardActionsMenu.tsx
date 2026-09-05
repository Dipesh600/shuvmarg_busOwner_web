"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MoreVertical,
  Phone,
  CheckCircle,
  Clock,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { StaffMember, StaffOperationalStatus } from "./staff-contract";

interface StaffCardActionsMenuProps {
  staff: StaffMember;
  canChangeStatus?: boolean;
  onStatusChange: (status: StaffOperationalStatus) => void;
  onRemove: () => void;
}

export default function StaffCardActionsMenu({
  staff,
  canChangeStatus = true,
  onStatusChange,
  onRemove,
}: StaffCardActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(staff.phone);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setIsOpen(false);
    }, 1500);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
        title="Staff actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-9 z-30 w-52 bg-white rounded-2xl border border-neutral-200 shadow-xl py-2 animate-in fade-in zoom-in-95 duration-150">
          {canChangeStatus && <>
            <div className="px-3 py-1.5 border-b border-neutral-100 mb-1">
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Manage Status
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onStatusChange("AVAILABLE");
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
            >
              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
              <span>Mark Available</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onStatusChange("OFF_DUTY");
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
            >
              <Clock className="w-3.5 h-3.5 text-neutral-500" />
              <span>Mark Off Duty</span>
            </button>
            <div className="my-1 border-t border-neutral-100" />
          </>}

          <button
            type="button"
            onClick={handleCopyPhone}
            className="w-full px-3 py-2 text-left text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" />
                <span className="text-green-600 font-semibold">Phone Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-500" />
                <span>Copy Phone</span>
              </>
            )}
          </button>

          <a
            href={`tel:${staff.phone}`}
            className="w-full px-3 py-2 text-left text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
          >
            <Phone className="w-3.5 h-3.5 text-neutral-500" />
            <span>Call Staff Member</span>
          </a>

          <div className="my-1 border-t border-neutral-100" />

          <button
            type="button"
            onClick={() => {
              onRemove();
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-[13px] font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove crew access</span>
          </button>
        </div>
      )}
    </div>
  );
}

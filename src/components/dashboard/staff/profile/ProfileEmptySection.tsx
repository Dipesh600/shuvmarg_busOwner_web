"use client";

import React from "react";

interface ProfileEmptySectionProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
}

export default function ProfileEmptySection({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  action,
}: ProfileEmptySectionProps) {
  return (
    <div className="py-16 px-6 text-center rounded-2xl border border-dashed border-[#EDE7E0] bg-[#FAF8F5]/40">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-neutral-400 border border-neutral-200/80 shadow-xs">
        <Icon className="h-6 w-6 text-[#7A1D1B]" />
      </div>
      <h3 className="mt-4 text-base font-bold text-[#111111]">{title}</h3>
      <p className="mt-1 text-xs text-[#554E48] max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-xl bg-[#7A1D1B] px-4 py-2 text-xs font-bold text-white hover:bg-[#631715] transition-colors shadow-xs"
        >
          {actionLabel}
        </button>
      )}
      {action}
    </div>
  );
}

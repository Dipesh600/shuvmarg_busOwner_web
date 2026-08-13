"use client";

/* eslint-disable @next/next/no-img-element -- authenticated/external operator avatars are not optimizable here */

import React, { useState } from "react";
import { Bus, Shield } from "lucide-react";

interface OperatorAvatarBadgeProps {
  name?: string | null;
  companyName?: string | null;
  avatarUrl?: string | null;
  isVerified?: boolean;
  size?: "md" | "lg" | "xl";
  className?: string;
}

export default function OperatorAvatarBadge({
  name,
  companyName,
  avatarUrl,
  isVerified = false,
  size = "lg",
  className = "",
}: OperatorAvatarBadgeProps) {
  const primaryName = companyName || name || "Operator";
  const [imgError, setImgError] = useState(false);

  // Extract initials (e.g. "Himalayan Tigers" -> "HT", "Suman Sharma" -> "SS")
  const getInitials = (str: string) => {
    const parts = str.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "OP";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const initials = getInitials(primaryName);

  // Doodle avatar URL using Dicebear Notionists with warm ivory background
  const doodleAvatarUrl =
    avatarUrl ||
    `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(
      primaryName
    )}&backgroundColor=F8F1E3`;

  const sizeClasses = {
    md: "w-14 h-14 rounded-2xl text-base",
    lg: "w-20 h-20 rounded-2xl text-xl",
    xl: "w-24 h-24 rounded-2xl text-2xl",
  }[size];

  return (
    <div className={`relative shrink-0 ${className}`}>
      <div
        className={`${sizeClasses} overflow-hidden border border-neutral-200 bg-neutral-100 flex items-center justify-center shadow-sm select-none`}
      >
        {!imgError ? (
          <img
            src={doodleAvatarUrl}
            alt={primaryName}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center font-black tracking-tight text-[#7A1D1B] bg-gradient-to-br from-[#FAF7F2] via-[#F8F1E3] to-[#EDE5D8]">
            <span className="font-display font-extrabold">{initials}</span>
            <Bus className="w-3 h-3 mt-0.5 text-[#7A1D1B] opacity-60" />
          </div>
        )}
      </div>

      {/* Verified Status Mini Badge */}
      {isVerified && (
        <div
          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#7A1D1B] border-2 border-white flex items-center justify-center text-white shadow-xs"
          title="Verified Bus Operator"
        >
          <Shield className="w-3.5 h-3.5 fill-[#C99A4A] text-[#C99A4A]" />
        </div>
      )}
    </div>
  );
}

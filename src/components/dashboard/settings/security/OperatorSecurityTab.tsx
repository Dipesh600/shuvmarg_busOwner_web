"use client";

import React from "react";
import ChangePasswordForm from "./ChangePasswordForm";
import OperatorSecurityGuidelines from "./OperatorSecurityGuidelines";

export default function OperatorSecurityTab() {
  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-[20px] font-bold text-neutral-900 leading-tight">
          Security &amp; Access
        </h2>
        <p className="text-[13px] text-neutral-500 font-medium mt-1">
          Manage your login credentials and protect your bus operator platform account.
        </p>
      </div>

      {/* Change Password Form */}
      <ChangePasswordForm />

      {/* Operator Security Best Practices */}
      <OperatorSecurityGuidelines />
    </div>
  );
}

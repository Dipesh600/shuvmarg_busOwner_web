"use client";

import React, { useState } from "react";
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Save,
} from "lucide-react";
import { authFetch } from "@/lib/auth";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setFeedback({ type: "error", message: "All password fields are required." });
      return;
    }

    if (newPassword.length < 8) {
      setFeedback({
        type: "error",
        message: "New password must be at least 8 characters long.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({
        type: "error",
        message: "New password and confirmation do not match.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authFetch("/auth/busowner/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error?.message || "Failed to update password. Please check your current password."
        );
      }

      setFeedback({
        type: "success",
        message: "Your password has been changed successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Could not update password. Please check your current password and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-[13px] font-medium border flex items-start gap-2.5 ${
            feedback.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
          <div className="w-9 h-9 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-[#7A1D1B] shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-neutral-900">Change Account Password</h3>
            <p className="text-[12px] text-neutral-500">
              Ensure your operator dashboard stays secure by using a strong password.
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
              Current Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full h-11 pl-11 pr-11 bg-white rounded-xl border border-neutral-200 text-[14px] font-medium text-neutral-900 outline-none focus:border-[#7A1D1B] focus:ring-2 focus:ring-[#7A1D1B]/10 transition-all placeholder:text-neutral-400"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
              New Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 8 characters)"
                className="w-full h-11 pl-11 pr-11 bg-white rounded-xl border border-neutral-200 text-[14px] font-medium text-neutral-900 outline-none focus:border-[#7A1D1B] focus:ring-2 focus:ring-[#7A1D1B]/10 transition-all placeholder:text-neutral-400"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full h-11 pl-11 pr-11 bg-white rounded-xl border border-neutral-200 text-[14px] font-medium text-neutral-900 outline-none focus:border-[#7A1D1B] focus:ring-2 focus:ring-[#7A1D1B]/10 transition-all placeholder:text-neutral-400"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 h-11 px-6 bg-[#7A1D1B] hover:bg-[#5C1414] text-white text-[13px] font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? "Updating Password..." : "Update Password"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

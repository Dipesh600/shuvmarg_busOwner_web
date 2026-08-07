"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { User, KeyRound, CheckCircle2, ShieldAlert, Lock, Save, Phone, Building2, Hash } from "lucide-react";
import { authFetch } from "@/lib/auth";
import { fetchOperatorDashboardState } from "@/features/operator-dashboard/operator-dashboard-api";
import { getVerificationStatusLabel, OperatorDashboardState } from "@/features/operator-dashboard/operator-dashboard-contract";

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab: "profile" | "security" =
    searchParams.get("tab") === "security" ? "security" : "profile";

  // Profile data state
  const [dashboardData, setDashboardData] = useState<OperatorDashboardState | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Form states for password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchOperatorDashboardState()
      .then((data) => {
        if (isMounted) setDashboardData(data);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingProfile(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleTabChange = (tab: "profile" | "security") => {
    setFeedback(null);
    router.replace(`/dashboard/settings${tab === "security" ? "?tab=security" : ""}`);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setFeedback({ type: "error", message: "All password fields are required." });
      return;
    }

    if (newPassword.length < 8) {
      setFeedback({ type: "error", message: "New password must be at least 8 characters long." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", message: "New password and confirmation do not match." });
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
        throw new Error(data.message || data.error?.message || "Failed to update password");
      }

      setFeedback({ type: "success", message: "Password updated successfully!" });
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

  const companyName = dashboardData?.profile?.business?.companyName || "Your Business";
  const ownerName = dashboardData?.profile?.profile?.name || "Operator";
  const phone = dashboardData?.profile?.profile?.phone || "N/A";
  const ownerCode = dashboardData?.profile?.ownerCode || "N/A";
  const verificationStatusLabel = getVerificationStatusLabel(dashboardData?.verificationStatus || "not_submitted");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 font-display">Account Settings</h1>
        <p className="text-xs font-medium text-neutral-600 mt-1">
          Manage your bus operator profile, verification identity, and account security.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-[#EEE8E2] gap-8">
        <button
          onClick={() => handleTabChange("profile")}
          className={`flex items-center gap-2 pb-3.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "profile"
              ? "border-[#7A1D1B] text-[#7A1D1B]"
              : "border-transparent text-neutral-500 hover:text-neutral-900"
          }`}
        >
          <User className="w-4 h-4" />
          <span>My Profile</span>
        </button>

        <button
          onClick={() => handleTabChange("security")}
          className={`flex items-center gap-2 pb-3.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "security"
              ? "border-[#7A1D1B] text-[#7A1D1B]"
              : "border-transparent text-neutral-500 hover:text-neutral-900"
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Change Password</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold border flex items-center gap-2.5 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-[#2E7D32] border-emerald-200"
              : "bg-red-50 text-[#D32F2F] border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tab 1: Profile Information */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EEE8E2] shadow-2xs space-y-6 max-w-2xl">
          <div className="flex items-center justify-between border-b border-[#EEE8E2] pb-4">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Bus Operator Identity</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Official operator credentials registered on Shuvmarg.</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FAF8F5] text-[#7A1D1B] border border-[#7A1D1B]/20">
              {verificationStatusLabel}
            </span>
          </div>

          {isLoadingProfile ? (
            <div className="space-y-4 animate-pulse py-4">
              <div className="h-10 bg-neutral-100 rounded-2xl" />
              <div className="h-10 bg-neutral-100 rounded-2xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                  Business Name
                </label>
                <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EEE8E2] text-xs font-bold text-neutral-900">
                  {companyName}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  Owner Full Name
                </label>
                <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EEE8E2] text-xs font-bold text-neutral-900">
                  {ownerName}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  Registered Phone
                </label>
                <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EEE8E2] text-xs font-bold text-neutral-900 font-mono">
                  {phone}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-neutral-400" />
                  Operator Code
                </label>
                <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EEE8E2] text-xs font-bold text-neutral-900 font-mono">
                  {ownerCode}
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-[#EEE8E2]">
            <p className="text-xs text-neutral-500">
              To request updates to registered business license or legal verification details, please contact Shuvmarg Operator Support.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Security & Change Password */}
      {activeTab === "security" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EEE8E2] shadow-2xs space-y-6 max-w-xl">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">Change Account Password</h2>
            <p className="text-xs font-medium text-neutral-500 mt-1">
              Ensure your bus operator account stays secure by using a strong password.
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Current Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full h-11 pl-11 pr-4 bg-white rounded-2xl border border-[#EEE8E2] text-xs font-medium text-neutral-900 outline-none focus:border-[#7A1D1B] focus:ring-2 focus:ring-[#7A1D1B]/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">New Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 8 characters)"
                  className="w-full h-11 pl-11 pr-4 bg-white rounded-2xl border border-[#EEE8E2] text-xs font-medium text-neutral-900 outline-none focus:border-[#7A1D1B] focus:ring-2 focus:ring-[#7A1D1B]/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full h-11 pl-11 pr-4 bg-white rounded-2xl border border-[#EEE8E2] text-xs font-medium text-neutral-900 outline-none focus:border-[#7A1D1B] focus:ring-2 focus:ring-[#7A1D1B]/10 transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 h-11 px-6 bg-[#7A1D1B] hover:bg-[#5C1414] text-white text-xs font-bold rounded-2xl transition-all shadow-2xs disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? "Updating..." : "Update Password"}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs font-semibold text-neutral-500">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  FileCheck,
  FileWarning,
} from "lucide-react";
import {
  BusOwnerKycStatus,
  VerificationStatus,
  getVerificationStatusLabel,
} from "@/features/operator-dashboard/operator-dashboard-contract";
import { COMPATIBILITY_ONBOARDING_ROUTE } from "@/features/operator-dashboard/next-action";

interface BusinessVerificationCardProps {
  kycStatus: BusOwnerKycStatus | null;
  verificationStatus: VerificationStatus;
  rejectionReason?: string | null;
}

export default function BusinessVerificationCard({
  kycStatus,
  verificationStatus,
  rejectionReason,
}: BusinessVerificationCardProps) {
  const statusLabel = getVerificationStatusLabel(verificationStatus);
  const reason = rejectionReason || kycStatus?.rejectionReason;
  const docs = kycStatus?.documents || [];

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FDFAF6] border border-[#E8DDCC] flex items-center justify-center text-[#7A1D1B]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              Business Verification
            </h3>
            <p className="text-xs text-neutral-500">
              KYC documents & compliance review
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {verificationStatus === "approved" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#2E7D32] border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {statusLabel}
            </span>
          ) : verificationStatus === "pending" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-[#F59E0B] border border-amber-200">
              <Clock className="w-3.5 h-3.5" />
              {statusLabel}
            </span>
          ) : verificationStatus === "rejected" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-[#D32F2F] border border-red-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              {statusLabel}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
              <ShieldAlert className="w-3.5 h-3.5 text-neutral-400" />
              {statusLabel}
            </span>
          )}
        </div>
      </div>

      {/* Rejection Reason Alert if rejected */}
      {verificationStatus === "rejected" && reason && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Rejection Feedback
          </div>
          <p className="leading-relaxed">{reason}</p>
        </div>
      )}

      {/* Pending Info */}
      {verificationStatus === "pending" && (
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
          Your submitted company documents and identity verification are currently being reviewed by Shuvmarg Compliance. Approval typically takes 24–48 business hours.
        </div>
      )}

      {/* Document Descriptors Checklist if returned by backend contract */}
      {docs.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Document Statuses
          </div>
          <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-xl overflow-hidden">
            {docs.map((doc, idx) => (
              <div
                key={doc.documentType || idx}
                className="px-4 py-3 flex items-center justify-between text-xs bg-white"
              >
                <div className="flex items-center gap-2.5">
                  {doc.uploaded ? (
                    <FileCheck className="w-4 h-4 text-[#2E7D32]" />
                  ) : (
                    <FileWarning className="w-4 h-4 text-neutral-400" />
                  )}
                  <span className="font-semibold text-neutral-800">
                    {doc.label || doc.documentType}
                  </span>
                </div>
                <span
                  className={`text-[11px] font-medium ${
                    doc.uploaded ? "text-[#2E7D32]" : "text-neutral-500"
                  }`}
                >
                  {doc.uploaded ? "Uploaded" : "Pending submission"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-2 flex items-center justify-between">
        <div className="text-[11px] text-neutral-500">
          {kycStatus?.updatedAt
            ? `Last updated: ${new Date(kycStatus.updatedAt).toLocaleDateString()}`
            : "Required before fleet activation"}
        </div>

        {verificationStatus !== "approved" && verificationStatus !== "pending" && (
          <Link
            href={COMPATIBILITY_ONBOARDING_ROUTE}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7A1D1B] hover:bg-[#5C1414] text-white text-xs font-semibold transition-colors shadow-2xs"
          >
            <span>
              {verificationStatus === "rejected"
                ? "Review & Resubmit"
                : "Complete Verification"}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

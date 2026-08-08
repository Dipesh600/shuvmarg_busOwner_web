"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
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
import { BUSINESS_SETUP_ROUTE } from "@/features/operator-dashboard/next-action";

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
  const submittedDocs = docs.filter((document) => document.uploaded);

  return (
    <div className="bg-white rounded-3xl border border-[#EEE8E2] p-6 sm:p-7 shadow-2xs space-y-5 flex flex-col justify-between">
      <div className="space-y-4">
        {/* Header with Functional Illustration */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold text-[#746E69] uppercase tracking-wider mb-1">
              KYC & Compliance
            </div>
            <h3
              className="text-lg font-bold text-[#161311]"
              style={{ fontFamily: '"Neue Machina", system-ui, sans-serif' }}
            >
              Business Verification
            </h3>
          </div>
          <Image
            src="/operator-dashboard/illustrations/business-verification.svg"
            alt="Business Verification"
            width={48}
            height={48}
            className="flex-shrink-0"
          />
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF8F5] text-[#746E69] border border-[#EEE8E2]">
              <ShieldAlert className="w-3.5 h-3.5 text-neutral-400" />
              {statusLabel}
            </span>
          )}
        </div>

        {/* Rejection Feedback Alert */}
        {verificationStatus === "rejected" && reason && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Rejection Feedback
            </div>
            <p className="leading-relaxed text-[11px]">{reason}</p>
          </div>
        )}

        {/* Pending Banner */}
        {verificationStatus === "pending" && (
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
            Your application was submitted successfully. We will notify you when the review is complete or if an update is required.
          </div>
        )}

        {/* Document Status Summary if returned by contract */}
        {submittedDocs.length > 0 && (
          <div className="space-y-1.5 pt-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#746E69]">
              Submitted Documents
            </div>
            <div className="divide-y divide-[#EEE8E2] border border-[#EEE8E2] rounded-2xl overflow-hidden text-xs">
              {submittedDocs.map((doc, idx) => (
                <div
                  key={doc.documentType || idx}
                  className="px-3.5 py-2.5 flex items-center justify-between bg-white"
                >
                  <div className="flex items-center gap-2">
                    {doc.uploaded ? (
                      <FileCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
                    ) : (
                      <FileWarning className="w-3.5 h-3.5 text-neutral-400" />
                    )}
                    <span className="font-semibold text-[#161311] text-[11px]">
                      {doc.label || doc.documentType}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-[#746E69]">
                    {doc.uploaded ? "Received" : "Not included"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="pt-3 border-t border-[#EEE8E2]/60 flex items-center justify-between gap-2">
        <div className="text-[10px] text-[#746E69]">
          {kycStatus?.updatedAt
            ? `Updated: ${new Date(kycStatus.updatedAt).toLocaleDateString()}`
            : "Required for live operations"}
        </div>

        {verificationStatus !== "approved" && verificationStatus !== "pending" && (
          <Link
            href={BUSINESS_SETUP_ROUTE}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7A1D1B] hover:bg-[#5C1414] text-white text-xs font-semibold transition-colors shadow-2xs"
          >
            <span>
              {verificationStatus === "rejected"
                ? "Resubmit"
                : "Verify Business"}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Eye, ShieldCheck, X } from "lucide-react";
import type { BusOwnerKycStatus, BusOwnerProfile, KycDocumentDescriptor } from "@/features/operator-dashboard/operator-dashboard-contract";
import BusinessApplicationReview from "./BusinessApplicationReview";
import SecureKycDocumentPreview from "./SecureKycDocumentPreview";

interface SubmittedBusinessPreviewModalProps {
  profile: BusOwnerProfile;
  kycStatus: BusOwnerKycStatus;
  onClose: () => void;
}

export default function SubmittedBusinessPreviewModal({ profile, kycStatus, onClose }: SubmittedBusinessPreviewModalProps) {
  const [selectedDocument, setSelectedDocument] = useState<KycDocumentDescriptor | null>(null);
  const address = profile.business.registeredAddress;
  const addressPreview = [address?.tole, address?.wardNumber ? `Ward ${address.wardNumber}` : null, address?.municipality, address?.district, address?.province, address?.country || "Nepal"].filter(Boolean).join(", ");
  const documents = (kycStatus.documents || []).filter((document) => document.uploaded);

  const ownerId = profile.ownerId || kycStatus.ownerId;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-[#1A1210]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="submitted-business-title">
      <div className="flex h-[94svh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[28px] border border-[#E5DDD7] bg-[#FFFCFA] shadow-2xl sm:h-[760px] sm:max-h-[94svh] sm:rounded-[28px]">
        <header className="flex items-start justify-between gap-4 border-b border-[#EAE3DD] bg-white px-5 py-4 sm:px-7 sm:py-5">
          <div><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A1D1B]">Business verification</div><h2 id="submitted-business-title" className="mt-1 font-display text-xl font-bold text-[#191512]">Submitted application</h2><p className="mt-1 text-[11px] font-medium text-[#7B746E]">This is the information currently held for compliance review.</p></div>
          <button type="button" onClick={onClose} className="rounded-xl border border-[#E6DED8] bg-white p-2 text-[#6D655F] transition hover:bg-[#F8F5F2]" aria-label="Close submitted application"><X className="h-4 w-4" /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <BusinessApplicationReview
            data={{
              companyName: profile.business.companyName,
              ownerName: profile.profile.name,
              panNumber: kycStatus.submittedDetails?.panNumber,
              registrationNumber: kycStatus.submittedDetails?.registrationNumber,
              registeredAddress: addressPreview,
              bankName: profile.bank.bankName,
              accountHolderName: profile.bank.accountHolderName,
              accountNumber: profile.bank.accountNumber,
              branchName: profile.bank.branchName,
              swiftCode: profile.bank.swiftCode,
            }}
            documentsTitle="Submitted documents"
            documents={
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {documents.map((document) => <div key={document.documentType} className={`rounded-xl border p-3 ${document.rejectionReason ? "border-red-200 bg-red-50/60" : "border-[#E5DDD7] bg-[#FCFAF8]"}`}><div className="flex items-start justify-between gap-3"><div><div className="text-xs font-bold text-[#2D2723]">{document.label || document.documentType}</div><div className={`mt-1 text-[9px] font-bold ${document.rejectionReason ? "text-red-700" : "text-emerald-700"}`}>{document.rejectionReason ? "Update requested" : `${document.fileCount || 1} file received`}</div></div><button type="button" onClick={() => setSelectedDocument(document)} disabled={!ownerId} className="rounded-lg border border-[#DDD4CE] bg-white p-2 text-[#7A1D1B] transition hover:bg-[#FFF3F0] disabled:cursor-not-allowed disabled:opacity-40" aria-label={`Preview ${document.label || document.documentType}`}><Eye className="h-3.5 w-3.5" /></button></div>{document.rejectionReason && <p className="mt-2 text-[10px] font-medium leading-relaxed text-red-700">{document.rejectionReason}</p>}</div>)}
              </div>
            }
          />
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#E4D8D1] bg-[#FFF8F5] p-4 text-xs font-medium leading-relaxed text-[#67564E]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#7A1D1B]" />Documents are displayed through a protected preview. Their storage location is never exposed.</div>
        </div>
        <footer className="flex justify-end border-t border-[#EAE3DD] bg-white px-5 py-4 sm:px-7"><button type="button" onClick={onClose} className="rounded-xl bg-[#7A1D1B] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#5C1414]">Done</button></footer>
      </div>
      {selectedDocument && ownerId && <SecureKycDocumentPreview ownerId={ownerId} documentType={selectedDocument.documentType} label={selectedDocument.label || selectedDocument.documentType} fileCount={selectedDocument.fileCount || 1} onClose={() => setSelectedDocument(null)} />}
    </div>
  );
}

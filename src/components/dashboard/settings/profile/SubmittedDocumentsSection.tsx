import React from "react";
import { FileText, CheckCircle, Clock, ZoomIn } from "lucide-react";
import { KycDocumentDescriptor } from "@/features/operator-dashboard/operator-dashboard-contract";

interface SubmittedDocumentsSectionProps {
  documents: KycDocumentDescriptor[];
  ownerId: string;
  onSelectDoc: (doc: { url: string; label: string; documentType: string }) => void;
}

function formatDocLabel(docType: string): string {
  switch (docType) {
    case "companyRegistration":
      return "Company Registration";
    case "taxRegistration":
      return "PAN / Tax Registration";
    case "ownerIdentity":
      return "Owner Citizenship / National ID";
    default:
      return docType
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

function buildDocViewUrl(ownerId: string, documentType: string, fileIndex: number = 0): string {
  const params = new URLSearchParams();
  if (ownerId) params.set("busOwnerId", ownerId);
  params.set("documentType", documentType);
  params.set("fileIndex", String(fileIndex));
  return `/busowner/kycDocumentView?${params.toString()}`;
}

export default function SubmittedDocumentsSection({
  documents,
  ownerId,
  onSelectDoc,
}: SubmittedDocumentsSectionProps) {
  return (
    <div className="pt-6 border-t border-neutral-100">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[15px] font-bold text-neutral-900 mb-0.5 flex items-center gap-2">
            <FileText className="w-4 h-4 text-neutral-500" />
            <span>Submitted Documents</span>
          </h3>
          <p className="text-[13px] text-neutral-500">Documents verified during operator onboarding.</p>
        </div>
        <span className="px-3 py-1.5 bg-neutral-100 text-neutral-600 text-[12px] font-bold rounded-lg border border-neutral-200">
          Read Only
        </span>
      </div>

      {documents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {documents.map((doc, idx) => {
            const label = formatDocLabel(doc.documentType);
            const viewUrl = buildDocViewUrl(ownerId, doc.documentType, 0);

            return (
              <div
                key={doc.documentType || idx}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 flex flex-col justify-between hover:border-neutral-300 transition-all shadow-xs"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-[#7A1D1B] shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  {doc.uploaded ? (
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-100 text-[11px] font-bold rounded flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 text-[11px] font-bold rounded flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-[13px] font-bold text-neutral-900 mb-1">{label}</h4>
                  <p className="text-[12px] text-neutral-500 mb-3">
                    {doc.uploaded ? `${doc.fileCount || 1} file(s) attached` : "No document attached"}
                  </p>
                </div>

                {doc.uploaded && (
                  <button
                    type="button"
                    onClick={() =>
                      onSelectDoc({
                        url: viewUrl,
                        label,
                        documentType: doc.documentType,
                      })
                    }
                    className="w-full h-9 px-3 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 text-[12px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>View Document</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-10 text-center bg-neutral-50 border border-neutral-200 rounded-xl">
          <FileText className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-[14px] text-neutral-500">No documents on file.</p>
        </div>
      )}
    </div>
  );
}

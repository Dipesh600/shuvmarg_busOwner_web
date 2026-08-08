import type { ReactNode } from "react";
import { Building2, FileText, Landmark } from "lucide-react";
import { ReviewDetail, ReviewSection } from "./BusinessSetupReviewControls";

export interface BusinessApplicationReviewData {
  companyName: string | null | undefined;
  ownerName: string | null | undefined;
  panNumber: string | null | undefined;
  registrationNumber: string | null | undefined;
  registeredAddress: string | null | undefined;
  bankName: string | null | undefined;
  accountHolderName: string | null | undefined;
  accountNumber: string | null | undefined;
  branchName: string | null | undefined;
  swiftCode: string | null | undefined;
}

export default function BusinessApplicationReview({ data, documents, documentsTitle, onEditBusiness, onEditSettlement, onEditDocuments }: {
  data: BusinessApplicationReviewData;
  documents: ReactNode;
  documentsTitle: string;
  onEditBusiness?: () => void;
  onEditSettlement?: () => void;
  onEditDocuments?: () => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ReviewSection title="Business details" icon={Building2} onEdit={onEditBusiness}>
        <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2"><ReviewDetail label="Legal company" value={data.companyName} /><ReviewDetail label="Owner" value={data.ownerName} /><ReviewDetail label="PAN / VAT" value={data.panNumber} /><ReviewDetail label="Registration no." value={data.registrationNumber} /><ReviewDetail label="Registered address" value={data.registeredAddress} wide /></dl>
      </ReviewSection>
      <ReviewSection title="Settlement account" icon={Landmark} onEdit={onEditSettlement}>
        <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2"><ReviewDetail label="Institution" value={data.bankName} wide /><ReviewDetail label="Account holder" value={data.accountHolderName} /><ReviewDetail label="Account number" value={data.accountNumber} /><ReviewDetail label="Branch" value={data.branchName} /><ReviewDetail label="SWIFT / BIC" value={data.swiftCode || "Not provided"} /></dl>
      </ReviewSection>
      <div className="lg:col-span-2"><ReviewSection title={documentsTitle} icon={FileText} onEdit={onEditDocuments}>{documents}</ReviewSection></div>
    </div>
  );
}

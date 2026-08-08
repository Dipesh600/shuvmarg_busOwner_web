import { Building2, FileText, Landmark, ShieldCheck } from "lucide-react";
import { BUSINESS_FIELDS, SETTLEMENT_FIELDS } from "@/features/operator-dashboard/business-verification-draft";
import type { KycDocumentField } from "@/features/operator-dashboard/business-verification-draft-storage";

export const BUSINESS_SETUP_STEPS = [
  { label: "Business", icon: Building2 },
  { label: "Settlement", icon: Landmark },
  { label: "Documents", icon: FileText },
  { label: "Review", icon: ShieldCheck },
] as const;

export const BUSINESS_SETUP_DOCUMENTS: Array<{
  field: KycDocumentField;
  label: string;
  hint: string;
  required: boolean;
  multiple?: boolean;
}> = [
  { field: "companyRegistration", label: "Company registration", hint: "PDF, JPG or PNG · max 5 MB", required: true },
  { field: "taxRegistration", label: "PAN / tax registration", hint: "PDF, JPG or PNG · max 5 MB", required: true },
  { field: "transportLicense", label: "Transport licence", hint: "PDF, JPG or PNG · max 5 MB", required: true },
  { field: "insuranceCertificates", label: "Insurance certificates", hint: "Optional · up to 5 files", required: false, multiple: true },
];

export const BUSINESS_SETUP_TEXT_FIELDS = new Set<string>([
  ...BUSINESS_FIELDS,
  ...SETTLEMENT_FIELDS,
  "swiftCode",
]);

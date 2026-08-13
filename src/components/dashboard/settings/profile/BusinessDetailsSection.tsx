import React from "react";
import { Building2 } from "lucide-react";
import InfoField from "./InfoField";
import SectionHeader from "./SectionHeader";

interface BusinessDetailsSectionProps {
  companyName: string;
  regNumber: string | null;
  panNumber: string | null;
  ownerCode: string;
}

export default function BusinessDetailsSection({
  companyName,
  regNumber,
  panNumber,
  ownerCode,
}: BusinessDetailsSectionProps) {
  return (
    <div>
      <SectionHeader icon={Building2} title="Business Details" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoField label="Business / Company Name" value={companyName} />
        <InfoField label="Company Registration No." value={regNumber} mono />
        <InfoField label="PAN / VAT Number" value={panNumber} mono />
        <InfoField label="Operator System Code" value={ownerCode} mono />
      </div>
    </div>
  );
}

import React from "react";
import { User } from "lucide-react";
import InfoField from "./InfoField";
import SectionHeader from "./SectionHeader";

interface OperatorPersonalSectionProps {
  ownerName: string;
  phone: string;
  email: string | null;
}

export default function OperatorPersonalSection({
  ownerName,
  phone,
  email,
}: OperatorPersonalSectionProps) {
  return (
    <div className="pt-6 border-t border-neutral-100">
      <SectionHeader icon={User} title="Authorized Operator Details" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InfoField label="Owner Full Name" value={ownerName} />
        <InfoField label="Registered Phone" value={phone} mono />
        <InfoField label="Email Address" value={email} />
      </div>
    </div>
  );
}

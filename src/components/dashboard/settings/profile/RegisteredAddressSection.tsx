import React from "react";
import { MapPin } from "lucide-react";
import InfoField from "./InfoField";
import SectionHeader from "./SectionHeader";

interface AddressData {
  province?: string | null;
  district?: string | null;
  municipality?: string | null;
  wardNumber?: string | number | null;
  tole?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

interface RegisteredAddressSectionProps {
  address?: AddressData | null;
}

export default function RegisteredAddressSection({ address }: RegisteredAddressSectionProps) {
  return (
    <div className="pt-6 border-t border-neutral-100">
      <SectionHeader icon={MapPin} title="Registered Location" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InfoField label="Province" value={address?.province} />
        <InfoField label="District" value={address?.district} />
        <InfoField
          label="Municipality & Ward"
          value={
            address?.municipality
              ? `${address.municipality}${address.wardNumber ? ` - Ward ${address.wardNumber}` : ""}`
              : null
          }
        />
        <InfoField label="Tole / Place" value={address?.tole} />
        <InfoField label="Postal Code" value={address?.postalCode} mono />
        <InfoField label="Country" value={address?.country || "Nepal"} />
      </div>
    </div>
  );
}

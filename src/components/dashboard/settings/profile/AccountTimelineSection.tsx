import React from "react";
import { Calendar } from "lucide-react";
import InfoField from "./InfoField";
import SectionHeader from "./SectionHeader";

interface AccountTimelineSectionProps {
  createdAt?: string | null;
  updatedAt?: string | null;
}

export default function AccountTimelineSection({
  createdAt,
  updatedAt,
}: AccountTimelineSectionProps) {
  if (!createdAt && !updatedAt) return null;

  return (
    <div className="pt-6 border-t border-neutral-100">
      <SectionHeader icon={Calendar} title="Account Timeline" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {createdAt && (
          <InfoField
            label="Account Registered"
            value={new Date(createdAt).toLocaleDateString("en-NP", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          />
        )}
        {updatedAt && (
          <InfoField
            label="Last Updated"
            value={new Date(updatedAt).toLocaleDateString("en-NP", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          />
        )}
      </div>
    </div>
  );
}

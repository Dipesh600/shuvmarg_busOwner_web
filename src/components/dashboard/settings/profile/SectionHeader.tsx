import React from "react";

interface SectionHeaderProps {
  icon: React.ElementType;
  title: string;
}

export default function SectionHeader({ icon: Icon, title }: SectionHeaderProps) {
  return (
    <h3 className="text-[15px] font-bold text-neutral-900 mb-4 flex items-center gap-2">
      <Icon className="w-4 h-4 text-neutral-500" />
      <span>{title}</span>
    </h3>
  );
}

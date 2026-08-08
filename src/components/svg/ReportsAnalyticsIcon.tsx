import React from "react";
import Image from "next/image";

export const ReportsAnalyticsIcon = ({ className = "w-full h-full" }: { className?: string }) => (
  <div className={className}>
    <Image
      src="/images/reports.png" 
      alt="Reports and Analytics" 
      width={160}
      height={160}
      className="w-full h-full object-contain drop-shadow-sm scale-[1.3]" 
    />
  </div>
);

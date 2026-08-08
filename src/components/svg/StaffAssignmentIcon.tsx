import React from "react";
import Image from "next/image";

export const StaffAssignmentIcon = ({ className = "w-full h-full" }: { className?: string }) => (
  <div className={className}>
    <Image
      src="/images/staff_assignment.png" 
      alt="Staff Assignment" 
      width={160}
      height={160}
      className="w-full h-full object-contain drop-shadow-sm" 
    />
  </div>
);

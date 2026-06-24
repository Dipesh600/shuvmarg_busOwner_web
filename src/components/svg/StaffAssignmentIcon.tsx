import React from "react";

export const StaffAssignmentIcon = ({ className = "w-full h-full" }: { className?: string }) => (
  <div className={className}>
    <img 
      src="/images/staff_assignment.png" 
      alt="Staff Assignment" 
      className="w-full h-full object-contain drop-shadow-sm" 
    />
  </div>
);

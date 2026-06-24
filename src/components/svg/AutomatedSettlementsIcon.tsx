import React from "react";

export const AutomatedSettlementsIcon = ({ className = "w-full h-full" }: { className?: string }) => (
  <div className={className}>
    <img 
      src="/images/automated payments.png" 
      alt="Automated Settlements" 
      className="w-full h-full object-contain drop-shadow-sm scale-[1.3]" 
    />
  </div>
);

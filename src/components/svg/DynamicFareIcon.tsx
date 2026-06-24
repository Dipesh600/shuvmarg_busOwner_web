import React from "react";

export const DynamicFareIcon = ({ className = "w-full h-full" }: { className?: string }) => (
  <div className={className}>
    <img 
      src="/images/dynamic_fare.png" 
      alt="Dynamic Fare Engine" 
      className="w-full h-full object-contain drop-shadow-sm scale-[1.3]" 
    />
  </div>
);

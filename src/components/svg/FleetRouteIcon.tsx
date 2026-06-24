import React from "react";

export const FleetRouteIcon = ({ className = "w-full h-full" }: { className?: string }) => (
  <div className={className}>
    <img 
      src="/images/fleet_and+route.png" 
      alt="Fleet and Route Control" 
      className="w-full h-full object-contain drop-shadow-sm scale-[1.3]" 
    />
  </div>
);

import React from "react";
import Image from "next/image";

export const FleetRouteIcon = ({ className = "w-full h-full" }: { className?: string }) => (
  <div className={className}>
    <Image
      src="/images/fleet_and+route.png" 
      alt="Fleet and Route Control" 
      width={160}
      height={160}
      className="w-full h-full object-contain drop-shadow-sm scale-[1.3]" 
    />
  </div>
);

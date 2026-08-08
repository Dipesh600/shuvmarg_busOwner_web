import React from "react";
import Image from "next/image";

export const RatingsReviewsIcon = ({ className = "w-full h-full" }: { className?: string }) => (
  <div className={className}>
    <Image
      src="/images/review_and_rating.png" 
      alt="Ratings and Reviews" 
      width={160}
      height={160}
      className="w-full h-full object-contain drop-shadow-sm" 
    />
  </div>
);

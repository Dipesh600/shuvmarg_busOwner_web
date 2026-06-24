import React from "react";

export const RatingsReviewsIcon = ({ className = "w-full h-full" }: { className?: string }) => (
  <div className={className}>
    <img 
      src="/images/review_and_rating.png" 
      alt="Ratings and Reviews" 
      className="w-full h-full object-contain drop-shadow-sm" 
    />
  </div>
);

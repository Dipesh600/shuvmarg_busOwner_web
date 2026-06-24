"use client";

import { useState } from "react";
import { FleetRouteIcon } from "../svg/FleetRouteIcon";
import { DynamicFareIcon } from "../svg/DynamicFareIcon";
import { StaffAssignmentIcon } from "../svg/StaffAssignmentIcon";
import { AutomatedSettlementsIcon } from "../svg/AutomatedSettlementsIcon";
import { RatingsReviewsIcon } from "../svg/RatingsReviewsIcon";
import { ReportsAnalyticsIcon } from "../svg/ReportsAnalyticsIcon";

const features = [
  {
    title: "Fleet & Route Control",
    description: "Manage your entire fleet, schedule routes, and monitor real-time availability from a centralized command center.",
    icon: <FleetRouteIcon className="w-full h-full object-contain drop-shadow-md" />,
    image: "/images/fleet_and+route.png",
  },
  {
    title: "Dynamic Fare Engine",
    description: "Automatically adjust seat prices based on real-time demand, holiday seasons, and occupancy levels to maximize revenue.",
    icon: <DynamicFareIcon className="w-full h-full object-contain drop-shadow-md" />,
    image: "/images/dynamic_fare.png",
  },
  {
    title: "Staff Assignment",
    description: "Assign drivers and conductors to trips seamlessly. Track shifts, manage licenses, and monitor crew performance.",
    icon: <StaffAssignmentIcon className="w-full h-full object-contain drop-shadow-md" />,
    image: "/images/staff_assignment.png",
  },
  {
    title: "Automated Settlements",
    description: "Receive fast, transparent payouts with automated daily settlements. No more manual reconciliation or missing payments.",
    icon: <AutomatedSettlementsIcon className="w-full h-full object-contain drop-shadow-md" />,
    image: "/images/automated payments.png",
  },
  {
    title: "Ratings and Reviews",
    description: "Gather authentic passenger feedback to build trust. Monitor your operator rating and improve service quality.",
    icon: <RatingsReviewsIcon className="w-full h-full object-contain drop-shadow-md" />,
    image: "/images/review_and_rating.png",
  },
  {
    title: "Reports and Analytics",
    description: "Access deep insights into revenue, seat occupancy, and route profitability to make data-driven business decisions.",
    icon: <ReportsAnalyticsIcon className="w-full h-full object-contain drop-shadow-md" />,
    image: "/images/reports.png",
  },
];

export default function PlatformFeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <section className="py-24 relative bg-white overflow-hidden">
      <style>
        {`
          @keyframes slideUpFade {
            0% { opacity: 0; transform: translateY(12px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-feature {
            animation: slideUpFade 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          }
        `}
      </style>
      
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left Column - Detailed Info Card */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-start">
            <div className="relative w-full max-w-[500px] h-[550px] rounded-[32px] bg-white border border-neutral-200 shadow-[0_12px_48px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">
              
              {/* Image Area */}
              <div className="relative flex-1 bg-gradient-to-b from-[#F9F9F9] to-white flex items-center justify-center p-12 overflow-hidden border-b border-neutral-100">
                <img 
                  key={`img-${activeFeature}`}
                  src={features[activeFeature].image} 
                  alt={features[activeFeature].title}
                  className="w-full h-full object-contain drop-shadow-xl animate-feature scale-[1.1]"
                />
              </div>
              
              {/* Content Area */}
              <div 
                key={`content-${activeFeature}`}
                className="p-8 bg-white animate-feature"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF4F3] border border-[#F0A09B]/30 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#7A1D1B]">
                    Capability 0{activeFeature + 1}
                  </span>
                </div>
                <h3 className="font-bold text-[#111111] text-[24px] mb-3 tracking-tight leading-tight">
                  {features[activeFeature].title}
                </h3>
                <p className="text-[#666666] text-[15px] leading-relaxed">
                  {features[activeFeature].description}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Text & Interactive Options */}
          <div className="w-full lg:w-1/2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-neutral-200 bg-white mb-6 shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-[#7A1D1B]" />
              <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#7A1D1B]">
                Platform Capabilities
              </span>
            </div>

            <h2 className="font-bold text-[#111111] leading-[1.15] tracking-tight mb-4" style={{ fontSize: "clamp(32px, 4vw, 44px)" }}>
              Smarter operations, <br />
              <span className="text-[#888888]">built with intelligence.</span>
            </h2>

            <p className="text-[#666666] text-lg leading-relaxed mb-10">
              Hover over a capability to see how Shuv Marg helps you fill seats, price every route right, and run your fleet smoothly.
            </p>

            {/* Options List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              {features.map((feature, i) => {
                const isActive = activeFeature === i;
                return (
                  <div 
                    key={i} 
                    onMouseEnter={() => setActiveFeature(i)}
                    className={`flex items-center gap-4 p-3 rounded-[16px] cursor-pointer transition-all duration-300 border ${
                      isActive 
                        ? "bg-white border-neutral-200 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transform scale-[1.02]" 
                        : "bg-transparent border-transparent hover:bg-white/50"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center flex-shrink-0 border overflow-hidden transition-colors duration-300 ${
                      isActive ? "bg-[#FFF4F3] border-[#F0A09B]" : "bg-white border-neutral-200"
                    }`}>
                      {feature.icon}
                    </div>
                    <h3 className={`font-semibold text-[15px] transition-colors duration-300 ${
                      isActive ? "text-[#7A1D1B]" : "text-[#444444]"
                    }`}>
                      {feature.title}
                    </h3>
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

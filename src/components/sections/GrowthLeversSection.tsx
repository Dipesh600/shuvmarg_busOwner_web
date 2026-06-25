"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Camera, Users, PieChart } from "lucide-react";

const levers = [
  {
    id: "pricing",
    title: "Dynamic Pricing Engine",
    subtitle: "Maximize revenue on every trip",
    statValue: "Up to 30%",
    statLabel: "more revenue",
    icon: TrendingUp,
    detailTitle: "Price every seat perfectly",
    detailDesc: "Automatically adjust seat prices based on real-time demand, holiday seasons, and occupancy levels. Capitalize on peak demand while ensuring minimum empty seats during off-peak times."
  },
  {
    id: "agent",
    title: "Nationwide Agent Network",
    subtitle: "Tap into offline demand",
    statValue: "1000+",
    statLabel: "offline agents",
    icon: Users,
    detailTitle: "Distribute inventory everywhere",
    detailDesc: "Connect your inventory directly to thousands of verified travel agents across Nepal. Our integrated agent portal lets you offer special commissions and instantly expand your sales reach without hiring your own team."
  },
  {
    id: "photos",
    title: "Verified Photos & 360°",
    subtitle: "Richer, click-worthy listings",
    statValue: "2X",
    statLabel: "listing views",
    icon: Camera,
    detailTitle: "Showcase your fleet quality",
    detailDesc: "Passengers book what they trust. High-quality exterior photos and 360° interior walkthroughs give travellers the confidence to book your bus over competitors, resulting in higher booking conversion rates."
  },
  {
    id: "analytics",
    title: "Real-time Analytics",
    subtitle: "Data-driven route optimization",
    statValue: "90%+",
    statLabel: "target occupancy",
    icon: PieChart,
    detailTitle: "Eliminate empty runs",
    detailDesc: "Get deep insights into route performance, historical demand, and seat occupancy trends. Identify your most profitable corridors and eliminate empty runs before they hurt your bottom line."
  }
];

export default function GrowthLeversSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeLever = levers[activeIndex];

  return (
    <section className="py-24 relative bg-white overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 relative z-10">
        
        {/* Header Section */}
        <div className="mb-20 text-center max-w-4xl mx-auto">
          <h2 className="font-bold text-[#111111] leading-[1.15] tracking-tight mb-6" style={{ fontSize: "clamp(36px, 5vw, 56px)" }}>
            More visibility, <span className="font-serif italic font-medium text-[#7A1D1B]">more bookings</span>
          </h2>
          <p className="text-[#666666] text-lg leading-relaxed max-w-2xl mx-auto">
            Shuv Marg gives you real levers to grow revenue, boost your search rank, reach the agent network, and unlock funding.
          </p>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Levers List */}
          <div className="w-full lg:w-[55%]">
            <div className="relative w-full rounded-[32px] border border-neutral-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 lg:p-10 overflow-hidden">
              
              {/* Decorative Red Gradient Blob */}
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#F8C9C7]/40 blur-[80px] rounded-full pointer-events-none -translate-y-1/3 translate-x-1/3" />
              
              <div className="relative z-10">
                <span className="block text-[#666666] text-sm font-semibold mb-4 tracking-wide">
                  Four levers, one platform
                </span>
                
                <div className="flex items-baseline gap-2 mb-10">
                  <h3 className="text-4xl lg:text-[42px] font-bold text-[#111111] tracking-tight">More revenue</h3>
                  <span className="text-[#7A1D1B] font-semibold text-lg tracking-wide">per bus</span>
                </div>

                {/* List of Levers */}
                <div className="flex flex-col gap-4">
                  {levers.map((lever, index) => {
                    const isActive = activeIndex === index;
                    const Icon = lever.icon;
                    return (
                      <div
                        key={lever.id}
                        onClick={() => setActiveIndex(index)}
                        className={`group relative flex flex-col p-4 rounded-[16px] cursor-pointer transition-all duration-300 border ${
                          isActive 
                            ? "bg-[#FFFcfc] border-[#F0A09B] shadow-sm" 
                            : "bg-white border-neutral-100 hover:border-neutral-200"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center transition-colors duration-300 border ${
                              isActive 
                                ? "bg-[#7A1D1B] border-[#7A1D1B] text-white" 
                                : "bg-[#FAFAFA] border-neutral-200 text-[#666666] group-hover:text-[#111111]"
                            }`}>
                              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <div>
                              <h4 className={`font-bold text-[16px] mb-0.5 transition-colors duration-300 ${isActive ? "text-[#111111]" : "text-[#444444]"}`}>
                                {lever.title}
                              </h4>
                              <p className="text-[#666666] text-[13px]">{lever.subtitle}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className={`font-bold text-[18px] transition-colors duration-300 ${isActive ? "text-[#7A1D1B]" : "text-[#666666] group-hover:text-[#111111]"}`}>
                              {lever.statValue}
                            </div>
                            <div className="text-[#888888] text-[12px] uppercase tracking-wider font-medium mt-0.5">
                              {lever.statLabel}
                            </div>
                          </div>
                        </div>

                        {/* Mobile Accordion Expansion */}
                        <AnimatePresence>
                          {isActive && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="lg:hidden overflow-hidden"
                            >
                              <div className="mt-4 pt-4 border-t border-neutral-100">
                                <h4 className="text-[15px] font-bold text-[#111111] mb-2">{lever.detailTitle}</h4>
                                <p className="text-[#666666] text-[14px] leading-relaxed">
                                  {lever.detailDesc}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Detail Card */}
          <div className="hidden lg:block w-full lg:w-[45%]">
            <div className="relative border border-[#F0A09B] bg-[#FFFcfc] rounded-[24px] p-8 lg:p-10 shadow-[0_8px_30px_rgba(122,29,27,0.06)]">
              
              {/* Arrow pointer (visible on desktop) */}
              <div className="hidden lg:block absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-6 bg-[#FFFcfc] border-l border-b border-[#F0A09B] rotate-45 rounded-sm" />
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeLever.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <h3 className="text-[22px] font-bold text-[#111111] mb-4 leading-snug">
                    {activeLever.detailTitle}
                  </h3>
                  <p className="text-[#666666] text-[16px] leading-relaxed">
                    {activeLever.detailDesc}
                  </p>
                </motion.div>
              </AnimatePresence>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

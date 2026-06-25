"use client";

import { motion } from "framer-motion";

import Image from "next/image";

export default function ShowcaseSection() {
  return (
    <section id="showcase" className="py-24 relative bg-[#FAFAFA] overflow-hidden scroll-mt-24">
      <div className="max-w-[960px] mx-auto px-6 lg:px-8 relative z-10">
        
        {/* Header Section */}
        <div className="mb-16 text-center max-w-3xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-200 bg-white mb-6 shadow-sm">
            <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#111111]">
              Showcase
            </span>
          </div>
          
          <h2 className="font-bold text-[#111111] leading-[1.15] tracking-tight mb-6" style={{ fontSize: "clamp(36px, 5vw, 56px)" }}>
            Let passengers <span className="font-serif italic font-medium text-[#7A1D1B]">see the bus</span>
          </h2>
          
          <p className="text-[#666666] text-lg leading-relaxed max-w-2xl mx-auto">
            Real photos and 360° interior views build trust before booking and turn more searches into seats.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {/* Card 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            className="group flex flex-col bg-white rounded-[24px] border border-neutral-200 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:border-neutral-300 transition-all duration-500"
          >
            {/* Visual Area */}
            <div className="relative w-full aspect-[16/10] bg-[#FAFAFA] overflow-hidden border-b border-neutral-100">
              <Image 
                src="/images/bus_exterior.jpg" 
                alt="Exterior & on-road photos" 
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transform group-hover:scale-[1.03] transition-transform duration-700 ease-out" 
              />
            </div>
            
            {/* Card Body */}
            <div className="p-8">
              <h3 className="font-bold text-[#111111] text-[22px] mb-3 group-hover:text-[#7A1D1B] transition-colors duration-300">
                Exterior & on-road photos
              </h3>
              <p className="text-[#666666] text-[16px] leading-relaxed">
                High-quality photos of your bus as seen by passengers on Shuv Marg. Good visuals directly improve booking conversions.
              </p>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
            className="group flex flex-col bg-white rounded-[24px] border border-neutral-200 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:border-neutral-300 transition-all duration-500"
          >
            {/* Visual Area */}
            <div className="relative w-full aspect-[16/10] bg-[#FAFAFA] overflow-hidden border-b border-neutral-100">
              <Image 
                src="/images/bus_interrior.png" 
                alt="360° interior walkthrough" 
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transform group-hover:scale-[1.03] transition-transform duration-700 ease-out" 
              />
            </div>
            
            {/* Card Body */}
            <div className="p-8">
              <h3 className="font-bold text-[#111111] text-[22px] mb-3 group-hover:text-[#7A1D1B] transition-colors duration-300">
                360° interior walkthrough
              </h3>
              <p className="text-[#666666] text-[16px] leading-relaxed">
                Passengers virtually step inside before they book. Clean, well-maintained interiors build trust and reduce last-minute cancellations.
              </p>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}

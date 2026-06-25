"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const benefits = [
  {
    image: "/images/revenue_growth.png",
    title: "Revenue Growth",
    description:
      "Access Nepal's largest online passenger pool. Payouts are aggregated and settled automatically to maximize your cash flow.",
    delay: 0.1,
  },
  {
    image: "/images/manifest.png",
    title: "Automated Manifests",
    description:
      "Passenger manifests are sent to your conductor's device automatically right after departure, eliminating manual paperwork.",
    delay: 0.2,
  },
  {
    image: "/images/automated payments.png",
    title: "Automated Settlements",
    description:
      "Receive fast, transparent payouts with automated daily settlements. Spend less time reconciling and more time growing.",
    delay: 0.3,
  },
];

export default function BenefitsSection() {
  return (
    <section id="benefits" className="py-24 relative bg-white overflow-hidden scroll-mt-24">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px w-8 flex-shrink-0 bg-[#C99A4A]" />
              <span className="text-[12px] font-medium tracking-wide text-[#7A1D1B]">
                Why join us
              </span>
              <div className="h-px w-8 flex-shrink-0 bg-[#C99A4A]" />
            </div>
            <h2
              className="font-bold text-[#111111] tracking-tight leading-[1.15]"
              style={{ fontSize: "clamp(32px, 4vw, 44px)" }}
            >
              The infrastructure for <br />
              modern transport operators
            </h2>
          </div>
          <div className="max-w-sm pb-2">
            <p className="text-[16px] text-[#666666] leading-relaxed">
              Nepal&apos;s travel market is digitizing rapidly. Operators who move online now capture the most passengers and scale operations faster.
            </p>
          </div>
        </div>

        {/* 3-Column Grid */}
        <div className="flex flex-wrap justify-center gap-6 lg:gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: benefit.delay, ease: [0.2, 0.8, 0.2, 1] }}
              className="w-full max-w-[400px] sm:max-w-none sm:w-[calc(50%_-_0.75rem)] lg:w-[calc(33.333%_-_1rem)] group flex flex-col bg-white rounded-[24px] border border-neutral-200 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:border-neutral-300 transition-all duration-500"
            >
              {/* Image Header */}
              <div className="relative w-full h-48 bg-[#FAFAFA] border-b border-neutral-100 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#111111_1px,transparent_1px)] [background-size:16px_16px]" />
                <Image
                  src={benefit.image as string}
                  alt={benefit.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-contain drop-shadow-md transform group-hover:scale-[1.05] transition-transform duration-700 ease-out p-6"
                />
              </div>

              {/* Card Body */}
              <div className="flex-1 p-8 flex flex-col">
                <h3 className="font-bold text-[#111111] text-[20px] mb-3 group-hover:text-[#7A1D1B] transition-colors duration-300">
                  {benefit.title}
                </h3>
                <p className="text-[15px] text-[#666666] leading-relaxed flex-1">
                  {benefit.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

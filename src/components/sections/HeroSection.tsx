"use client";

import { motion } from "framer-motion";
import Link from "next/link";
const NM = '"Neue Machina", system-ui, -apple-system, sans-serif';

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[calc(100svh+60px)] md:min-h-[calc(100svh+100px)] lg:min-h-[calc(100svh+120px)] flex flex-col overflow-hidden">
      {/* Background Video Layer */}
      <div className="absolute inset-0 z-0">
        <video
          src="/video.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-90"
        />
        {/* Deep, rich overlay matching the design */}
        <div className="absolute inset-0 bg-black/40 z-10" />
      </div>

      {/* Spacer to balance navbar height */}
      <div className="h-20 md:h-28 shrink-0 z-20 pointer-events-none" />

      {/* Main Hero Content */}
      <div className="relative z-20 flex-grow flex flex-col items-center justify-center text-center px-4 max-w-[1050px] mx-auto w-full py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-2 mb-6 md:mb-8 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-md"
        >
          <span className="text-[12px] md:text-[13px] font-medium tracking-wide text-white" style={{ fontFamily: NM }}>
            For Nepal&apos;s bus operators
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="leading-[1.05] tracking-tight mb-4 md:mb-6 text-white"
          style={{
            fontFamily: NM,
            fontSize: "clamp(36px, 8vw, 82px)",
            fontWeight: 300,
            letterSpacing: "-0.01em",
          }}
        >
          Sell the seats. <br className="hidden sm:block" />
          <em style={{ fontFamily: NM, fontStyle: "italic", fontWeight: 300, color: "rgba(255,255,255,0.88)" }}>
            run the fleet.
          </em>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-[15px] sm:text-lg text-white/80 max-w-3xl mb-8 md:mb-10 leading-relaxed font-medium"
        >
          Manage bookings, routes, and revenue from one dashboard. Fill empty seats,
          schedule every route, and take control of your entire fleet from a single place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto"
        >
          <button
            className="w-full sm:w-auto h-12 px-8 rounded-full text-[15px] text-white border border-white/30 hover:bg-white/10 transition-colors flex items-center justify-center gap-2 backdrop-blur-sm"
            style={{ fontFamily: NM, fontWeight: 300, letterSpacing: "0.02em" }}
          >
            Watch Tutorial
            <span className="material-symbols-rounded text-[18px]">play_arrow</span>
          </button>

          <Link
            href="/register"
            className="w-full sm:w-auto h-12 px-8 rounded-full text-[15px] text-white transition-colors flex items-center justify-center gap-2 hover:bg-[#9A2622]"
            style={{ background: "#7A1D1B", fontFamily: NM, fontWeight: 300, letterSpacing: "0.02em" }}
          >
            Become a Partner
            <span className="material-symbols-rounded text-[18px]">arrow_forward</span>
          </Link>
        </motion.div>
      </div>

      {/* Stats Row - Now in normal document flow instead of absolute positioning */}
      <div className="relative z-20 w-full pb-[calc(60px+32px)] md:pb-[calc(100px+48px)] lg:pb-[calc(120px+48px)] pt-12 md:pt-32 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-[1280px] mx-auto px-4 md:px-8 grid grid-cols-2 md:flex justify-between items-end gap-x-4 gap-y-8 md:gap-x-12 pointer-events-auto"
        >
          {[
            { value: "250+", label: "Operators" },
            { value: "500+", label: "Bus Routes" },
            { value: "1M+", label: "Travellers" },
            { value: "Weekly", label: "Payouts" },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center md:items-start text-center md:text-left">
              <span
                className="text-[28px] sm:text-4xl text-white"
                style={{ fontFamily: NM, fontWeight: 300, letterSpacing: "-0.01em" }}
              >
                {value.replace("+", "")}
                {value.includes("+") && (
                  <span style={{ color: "#C99A4A", fontFamily: NM, fontWeight: 300 }}>+</span>
                )}
              </span>
              <span
                className="text-[11px] sm:text-[13px] text-white/60 mt-1 sm:mt-2 uppercase tracking-widest"
                style={{ fontFamily: NM, fontWeight: 300 }}
              >
                {label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Wave transition to light section below */}
      <div className="absolute bottom-0 inset-x-0 z-30 pointer-events-none overflow-hidden leading-[0]">
        <svg
          viewBox="0 0 1440 120"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-[60px] md:h-[100px] lg:h-[120px]"
          style={{ display: "block" }}
        >
          <path
             d="M0,40 C480,140 960,-40 1440,60 L1440,120 L0,120 Z"
             fill="#FDFAF6"
          />
        </svg>
      </div>
    </section>
  );
}
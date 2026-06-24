"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboardingStore } from "@/lib/store";

const DISTRICTS = [
  "Achham", "Arghakhanchi", "Baglung", "Baitadi", "Bajhang", "Bajura", "Banke", "Bara", "Bardiya", "Bhaktapur",
  "Bhojpur", "Chitwan", "Dadeldhura", "Dailekh", "Dang", "Darchula", "Dhading", "Dhankuta", "Dhanusha", "Dolakha",
  "Dolpa", "Doti", "Eastern Rukum", "Gorkha", "Gulmi", "Humla", "Ilam", "Jajarkot", "Jhapa", "Jumla", "Kailali",
  "Kalikot", "Kanchanpur", "Kapilvastu", "Kaski", "Kathmandu", "Kavrepalanchok", "Khotang", "Lalitpur", "Lamjung",
  "Mahottari", "Makwanpur", "Manang", "Morang", "Mugu", "Mustang", "Myagdi", "Nawalpur", "Nuwakot", "Okhaldhunga",
  "Palpa", "Panchthar", "Parasi", "Parbat", "Parsa", "Pyuthan", "Ramechhap", "Rasuwa", "Rautahat", "Rolpa",
  "Rukum Paschim", "Rupandehi", "Salyan", "Sankhuwasabha", "Saptari", "Sarlahi", "Sindhuli", "Sindhupalchok",
  "Siraha", "Solukhumbu", "Sunsari", "Surkhet", "Syangja", "Tanahun", "Taplejung", "Terhathum", "Udayapur",
];

const dashboardNavItems = [
  { label: "Overview", href: "/dashboard", icon: "dashboard" },
  { label: "Fleet", href: "/dashboard/fleet", icon: "directions_bus" },
  { label: "Routes", href: "/dashboard/routes", icon: "route" },
  { label: "Bookings", href: "/dashboard/bookings", icon: "confirmation_number" },
  { label: "Finance", href: "/dashboard/finance", icon: "account_balance_wallet" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);

  const pathname = usePathname();
  const { onboardingStep, onboardingTitle } = useOnboardingStore();

  const isDashboard = pathname?.startsWith("/dashboard");
  const isOnboarding = pathname === "/onboarding";
  const isFullWidth = isDashboard || isOnboarding;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Calculate exact pixel widths to ensure mathematically perfect bi-directional animations without CSS snapping or delays.
  const expandedWidth = windowWidth;
  const shrunkWidth = Math.min(windowWidth - 32, 950);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  // Hide Navbar completely on the register, login, and forgot-password pages
  if (pathname === "/register" || pathname === "/login" || pathname === "/forgot-password") return null;

  return (
    <>
      {/* ── Fixed header bar ─────────────────────────────────── */}
      <div className="fixed inset-x-0 top-0 z-[100] pointer-events-none flex justify-center">
        <motion.div
          initial={false}
          animate={{
            y: isFullWidth || scrolled ? 0 : 16,
            width: isFullWidth || scrolled ? expandedWidth : shrunkWidth,
            borderRadius: isFullWidth || scrolled ? 0 : 999,
            backgroundColor: isFullWidth
              ? "#FFFFFF"
              : "rgba(235,235,235,0.95)",
            boxShadow: isFullWidth
              ? "0 1px 0 rgba(0,0,0,0.06)"
              : scrolled ? "0 2px 16px rgba(0,0,0,0.08)" : "0 8px 32px rgba(0,0,0,0.04)",
          }}
          transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          className={`pointer-events-auto flex items-center justify-center h-[64px] backdrop-blur-md transition-colors duration-300 ${
            isFullWidth || scrolled ? "border-b border-neutral-200" : "border-b border-transparent"
          }`}
        >
          <motion.div 
            initial={false}
            animate={{ width: isFullWidth || scrolled ? 1050 : 950 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="flex items-center justify-between max-w-full px-4 sm:px-6 lg:px-8"
          >
            {/* ── Left: Logo ───────────────────────── */}
            <div className="flex items-center gap-4 lg:gap-6 min-w-0 flex-1">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <span className="font-black text-[18px] sm:text-[22px] tracking-tighter">
                <span className="text-[#111111]">Shuv</span><span className="text-[#7A1D1B]">marg</span>
                {isDashboard && (
                  <span className="text-neutral-400 font-normal text-xs sm:text-sm ml-1 hidden sm:inline">
                    Partner
                  </span>
                )}
              </span>
            </Link>

            {/* Onboarding step indicator (md+) */}
            <AnimatePresence>
              {isOnboarding && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="hidden md:flex items-center gap-2 pl-4 border-l border-neutral-200"
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: "#FFF4F3", color: "#7A1D1B", border: "1px solid rgba(122,29,27,0.2)" }}
                  >
                    {onboardingStep + 1}
                  </span>
                  <span className="text-sm font-semibold text-neutral-700 truncate max-w-[180px]">
                    {onboardingTitle}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dashboard nav items — desktop only */}
            <AnimatePresence>
              {isDashboard && (
                <motion.nav
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.05 }}
                  className="hidden lg:flex items-center gap-0.5"
                >
                  {dashboardNavItems.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${active
                          ? "bg-[rgba(122,29,27,0.08)] text-maroon"
                          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                          }`}
                      >
                        <span className="material-symbols-rounded text-[16px]">{item.icon}</span>
                        {item.label}
                      </Link>
                    );
                  })}
                </motion.nav>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right: CTAs ──────────────────────── */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <AnimatePresence mode="popLayout">

              {/* Landing state */}
              {!isDashboard && !isOnboarding && (
                <motion.div
                  key="landing-cta"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  {/* Sign in — visible on all sizes */}
                  <Link
                    href="/login"
                    className="h-[42px] px-3 sm:px-5 rounded-lg text-[15px] font-bold text-neutral-700 hover:bg-neutral-100 transition-colors flex items-center"
                  >
                    Sign in
                  </Link>
                  {/* Become a Partner — truncated label on xs */}
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="h-[42px] px-4 sm:px-6 rounded-xl text-[15px] font-bold text-white transition-all flex items-center gap-1.5"
                    style={{ background: "#7A1D1B" }}
                  >
                    <span className="hidden sm:inline">Request Demo</span>
                    <span className="sm:hidden">Demo</span>
                  </button>
                </motion.div>
              )}

              {/* Onboarding state */}
              {isOnboarding && (
                <motion.div
                  key="onboarding-cta"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Link
                    href="/"
                    className="h-9 px-4 rounded-lg text-[13px] font-medium text-neutral-600 hover:bg-neutral-100 transition-colors flex items-center"
                  >
                    Exit Setup
                  </Link>
                </motion.div>
              )}

              {/* Dashboard state */}
              {isDashboard && (
                <motion.div
                  key="dashboard-cta"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  {/* Operator name — sm+ only */}
                  <div className="hidden sm:flex flex-col items-end leading-tight">
                    <span className="text-[12px] font-semibold text-neutral-900">Shuvmarg Travels</span>
                    <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                      Active
                    </span>
                  </div>
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-maroon flex items-center justify-center cursor-pointer hover:bg-maroon-dark transition-colors flex-shrink-0">
                    <span className="text-white text-[11px] font-bold">ST</span>
                  </div>
                  {/* Hamburger — below lg */}
                  <button
                    className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 transition-colors"
                    onClick={() => setMobileMenuOpen((v) => !v)}
                    aria-label="Toggle navigation"
                  >
                    <span className="material-symbols-rounded text-neutral-700 text-[20px]">
                      {mobileMenuOpen ? "close" : "menu"}
                    </span>
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
          </motion.div>
        </motion.div>

        {/* Dashboard mobile nav drawer */}
        <AnimatePresence>
          {isDashboard && mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-x-3 top-[72px] bg-white border border-neutral-200 rounded-xl overflow-hidden pointer-events-auto shadow-lg lg:hidden"
            >
              {dashboardNavItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3.5 text-[14px] font-medium border-b border-neutral-100 last:border-0 transition-colors ${active
                      ? "text-maroon bg-[rgba(122,29,27,0.04)]"
                      : "text-neutral-700 hover:bg-neutral-50"
                      }`}
                  >
                    <span className="material-symbols-rounded text-[20px]">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── "Get a Callback" Modal ─────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
          >
            <motion.div
              drag="y"
              dragConstraints={{ top: -250, bottom: 0 }}
              dragElastic={{ top: 0.2, bottom: 0.8 }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  setIsModalOpen(false);
                  setIsSubmitted(false);
                }
              }}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="w-full sm:max-w-[440px] bg-white sm:rounded-2xl rounded-t-2xl border border-neutral-200 shadow-xl relative"
            >
              {/* Drag handle on mobile */}
              <div className="flex justify-center pt-3 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-neutral-200" />
              </div>

              <div className="p-6">
                {/* Close */}
                <button
                  onClick={() => { setIsModalOpen(false); setIsSubmitted(false); }}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <span className="material-symbols-rounded text-neutral-500 text-[18px]">close</span>
                </button>

                <AnimatePresence mode="wait">
                  {!isSubmitted ? (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="mb-5">
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#C99A4A" }} />
                          <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "#7A1D1B" }}>
                            Request Callback
                          </span>
                        </div>
                        <h3 className="text-[20px] font-bold text-neutral-900 leading-tight">
                          Talk to our partner team
                        </h3>
                        <p className="text-[13px] text-neutral-500 mt-1">
                          Leave your details and we&apos;ll call within 2 hours.
                        </p>
                      </div>

                      <form
                        className="space-y-4"
                        onSubmit={(e) => { e.preventDefault(); setIsSubmitted(true); }}
                      >
                        <div>
                          <label className="form-label">Full Name <span style={{ color: "#7A1D1B" }}>*</span></label>
                          <input type="text" required placeholder="e.g. Ram Bahadur Shrestha" className="form-input" />
                        </div>

                        {/* Fixed phone field — no emoji */}
                        <div>
                          <label className="form-label">Phone Number <span style={{ color: "#7A1D1B" }}>*</span></label>
                          <div
                            className="flex overflow-hidden"
                            style={{ border: "1.5px solid #DDDDDD", borderRadius: 10 }}
                          >
                            <div
                              className="flex items-center gap-1 px-3 flex-shrink-0 select-none"
                              style={{ borderRight: "1.5px solid #EEEEEE", background: "#FAFAFA", minWidth: 72 }}
                            >
                              <span className="text-[13px] font-bold" style={{ color: "#444" }}>NP</span>
                              <span className="text-[12px]" style={{ color: "#AAAAAA" }}>+977</span>
                            </div>
                            <input
                              type="tel"
                              required
                              placeholder="98XXXXXXXX"
                              className="flex-1 h-[44px] px-3 text-[14px] outline-none bg-transparent"
                              style={{ color: "#111" }}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="form-label">District <span style={{ color: "#7A1D1B" }}>*</span></label>
                          <div className="relative">
                            <div
                              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                              className="form-input flex items-center justify-between cursor-pointer select-none"
                            >
                              <span className={selectedDistrict ? "text-neutral-900" : "text-neutral-400"}>
                                {selectedDistrict || "Select your district"}
                              </span>
                              <span className={`material-symbols-rounded text-neutral-500 text-[18px] transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}>
                                expand_more
                              </span>
                            </div>

                            <AnimatePresence>
                              {isDropdownOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  transition={{ duration: 0.12 }}
                                  className="absolute bottom-full mb-1 sm:bottom-auto sm:top-full sm:mb-0 sm:mt-1 left-0 w-full bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden z-50"
                                >
                                  <div className="p-2 border-b border-neutral-100">
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-rounded text-neutral-400 text-[15px]">search</span>
                                      <input
                                        type="text"
                                        autoFocus
                                        placeholder="Search district..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full h-8 pl-8 pr-3 text-[13px] border border-neutral-200 rounded-lg outline-none focus:border-maroon text-neutral-900"
                                      />
                                    </div>
                                  </div>
                                  <ul className="max-h-[180px] overflow-y-auto py-1">
                                    {DISTRICTS.filter((d) =>
                                      d.toLowerCase().includes(searchQuery.toLowerCase())
                                    ).length > 0 ? (
                                      DISTRICTS.filter((d) =>
                                        d.toLowerCase().includes(searchQuery.toLowerCase())
                                      ).map((d) => (
                                        <li
                                          key={d}
                                          onClick={() => { setSelectedDistrict(d); setIsDropdownOpen(false); setSearchQuery(""); }}
                                          className={`px-4 py-2 text-[13px] cursor-pointer transition-colors ${selectedDistrict === d
                                            ? "bg-[rgba(122,29,27,0.08)] text-maroon font-semibold"
                                            : "text-neutral-700 hover:bg-neutral-50"
                                            }`}
                                        >
                                          {d}
                                        </li>
                                      ))
                                    ) : (
                                      <li className="px-4 py-3 text-[13px] text-center text-neutral-400">
                                        No districts found
                                      </li>
                                    )}
                                  </ul>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full h-[44px] rounded-[10px] font-semibold text-[14px] text-white mt-1"
                          style={{ background: "#7A1D1B" }}
                        >
                          Request Callback
                        </button>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center text-center py-6"
                    >
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                        style={{ background: "rgba(122,29,27,0.08)" }}
                      >
                        <span className="material-symbols-rounded text-maroon text-[32px]">check_circle</span>
                      </div>
                      <h3 className="text-[18px] font-bold text-neutral-900 mb-1.5">Request Received</h3>
                      <p className="text-[13px] text-neutral-500 leading-relaxed mb-6 max-w-xs">
                        Our partner team will call you back within 2 business hours.
                      </p>
                      <button
                        onClick={() => { setIsModalOpen(false); setIsSubmitted(false); }}
                        className="w-full h-[44px] rounded-[10px] font-semibold text-[14px] text-white"
                        style={{ background: "#7A1D1B" }}
                      >
                        Done
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

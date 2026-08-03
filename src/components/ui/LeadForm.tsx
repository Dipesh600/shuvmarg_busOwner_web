"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Nepal districts (77) ──────────────────────────────────────────────────────
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

import { API_URL } from "@/lib/config";
const nepalMobilePattern = /^[9][678][0-9]{8}$/;

export default function LeadForm() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredDistricts = districtSearch.trim()
    ? DISTRICTS.filter((d) => d.toLowerCase().includes(districtSearch.toLowerCase()))
    : DISTRICTS;

  const phoneError =
    phone.length > 0 && !nepalMobilePattern.test(phone)
      ? "Enter a valid Nepal number (98/97/96XXXXXXXX)"
      : "";

  const isValid = fullName.trim().length >= 2 && nepalMobilePattern.test(phone) && district !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/public/partner-leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone,
          district,
          leadType: "contact_form",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      layout
      className="w-full overflow-hidden"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E8E0D4",
        borderRadius: "16px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 32px rgba(122,29,27,0.08)",
      }}
    >
      <AnimatePresence mode="wait">
        {/* ── Success state ── */}
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-7 flex flex-col items-center text-center"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
              style={{ background: "#FFF4F3", border: "1.5px solid rgba(122,29,27,0.15)" }}
            >
              <span className="material-symbols-rounded text-[24px]" style={{ color: "#7A1D1B" }}>
                check_circle
              </span>
            </div>
            <h3
              className="text-[20px] font-bold mb-2"
              style={{ color: "#111111", letterSpacing: "-0.02em" }}
            >
              We&apos;ll be in touch!
            </h3>
            <p className="text-[13px] leading-relaxed" style={{ color: "#888888" }}>
              Thanks, <strong style={{ color: "#444444" }}>{fullName.split(" ")[0]}</strong>. Our partner team will reach out to{" "}
              <strong style={{ color: "#444444" }}>+977 {phone}</strong> within 24 hours.
            </p>
          </motion.div>
        ) : (
          /* ── Form state ── */
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onSubmit={handleSubmit}
            className="p-7 space-y-5"
          >
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 mb-3">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#C99A4A" }} />
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: "#7A1D1B" }}
                >
                  Free to Join
                </span>
              </div>
              <h3
                className="text-[22px] font-bold leading-tight"
                style={{ color: "#111111", letterSpacing: "-0.02em" }}
              >
                Start selling seats<br />
                <span style={{ color: "#7A1D1B" }}>across Nepal.</span>
              </h3>
              <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "#888888" }}>
                Leave your details and our partner team will reach out to get you started.
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label
                className="block text-[12px] font-semibold mb-1.5"
                style={{ color: "#444444" }}
              >
                Full Name
              </label>
              <input
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-[46px] px-3 rounded-[10px] text-[14px] outline-none transition-all duration-200"
                style={{
                  border: "1.5px solid #DDDDDD",
                  color: "#111111",
                  background: "#FFFFFF",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#7A1D1B";
                  e.target.style.boxShadow = "0 0 0 3px rgba(122,29,27,0.10)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#DDDDDD";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Phone */}
            <div>
              <label
                className="block text-[12px] font-semibold mb-1.5"
                style={{ color: "#444444" }}
              >
                Mobile Number
              </label>
              <div
                className="flex overflow-hidden transition-all duration-200"
                style={{
                  border: phoneError ? "1.5px solid #D32F2F" : "1.5px solid #DDDDDD",
                  borderRadius: "10px",
                  background: "#FFFFFF",
                }}
                onFocus={(e) => {
                  if (e.currentTarget.contains(e.target as Node)) {
                    e.currentTarget.style.borderColor = phoneError ? "#D32F2F" : "#7A1D1B";
                    e.currentTarget.style.boxShadow = phoneError
                      ? "0 0 0 3px rgba(211,47,47,0.08)"
                      : "0 0 0 3px rgba(122,29,27,0.10)";
                  }
                }}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    e.currentTarget.style.borderColor = phoneError ? "#D32F2F" : "#DDDDDD";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                <div
                  className="flex items-center gap-1.5 px-3 flex-shrink-0 select-none"
                  style={{ borderRight: "1.5px solid #EEEEEE", background: "#FAFAFA", minWidth: 76 }}
                >
                  <span className="text-[13px] font-bold" style={{ color: "#444444" }}>NP</span>
                  <span className="text-[12px]" style={{ color: "#AAAAAA" }}>+977</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="98XXXXXXXX"
                  value={phone}
                  maxLength={10}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 h-[46px] px-3 text-[14px] outline-none bg-transparent"
                  style={{ color: "#111111" }}
                />
                {phone.length === 10 && !phoneError && (
                  <div className="flex items-center pr-3">
                    <span className="material-symbols-rounded text-[18px]" style={{ color: "#2E7D32" }}>
                      check_circle
                    </span>
                  </div>
                )}
              </div>
              {phoneError && (
                <p className="text-[11px] mt-1.5" style={{ color: "#D32F2F" }}>{phoneError}</p>
              )}
            </div>

            {/* District */}
            <div className="relative" ref={dropdownRef}>
              <label
                className="block text-[12px] font-semibold mb-1.5"
                style={{ color: "#444444" }}
              >
                Operating District
              </label>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((o) => !o)}
                className="w-full h-[46px] px-3 rounded-[10px] text-[14px] text-left flex items-center justify-between transition-all duration-200"
                style={{
                  border: "1.5px solid #DDDDDD",
                  background: "#FFFFFF",
                  color: district ? "#111111" : "#AAAAAA",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#7A1D1B";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(122,29,27,0.10)";
                }}
                onBlur={(e) => {
                  if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
                    e.currentTarget.style.borderColor = "#DDDDDD";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                <span>{district || "Select your district"}</span>
                <span
                  className="material-symbols-rounded text-[18px] transition-transform duration-200"
                  style={{ color: "#AAAAAA", transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                  keyboard_arrow_down
                </span>
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden"
                    style={{
                      background: "#FFFFFF",
                      border: "1.5px solid #E8E0D4",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                    }}
                  >
                    <div className="p-2 border-b" style={{ borderColor: "#F0EBE3" }}>
                      <input
                        type="text"
                        placeholder="Search district..."
                        value={districtSearch}
                        onChange={(e) => setDistrictSearch(e.target.value)}
                        className="w-full px-3 py-2 text-[13px] rounded-lg outline-none"
                        style={{ background: "#F8F4EF", color: "#111111" }}
                        autoFocus
                      />
                    </div>
                    <div className="max-h-[180px] overflow-y-auto">
                      {filteredDistricts.length === 0 ? (
                        <p className="text-[13px] text-center py-4" style={{ color: "#AAAAAA" }}>
                          No districts found
                        </p>
                      ) : (
                        filteredDistricts.map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => {
                              setDistrict(d);
                              setDistrictSearch("");
                              setIsDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-[13px] transition-colors duration-100"
                            style={{
                              color: d === district ? "#7A1D1B" : "#333333",
                              background: d === district ? "#FFF4F3" : "transparent",
                              fontWeight: d === district ? 600 : 400,
                            }}
                            onMouseEnter={(e) => {
                              if (d !== district) e.currentTarget.style.background = "#FAF7F2";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = d === district ? "#FFF4F3" : "transparent";
                            }}
                          >
                            {d}
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Error */}
            {error && (
              <p className="text-[12px] text-center" style={{ color: "#D32F2F" }}>
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="w-full h-[46px] rounded-[10px] font-semibold text-[14px] text-white transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: isValid ? "#7A1D1B" : "#CCCCCC",
                cursor: isValid && !isSubmitting ? "pointer" : "not-allowed",
              }}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="material-symbols-rounded text-[16px] animate-spin"
                    style={{ color: "rgba(255,255,255,0.8)" }}
                  >
                    progress_activity
                  </span>
                  Submitting...
                </>
              ) : (
                <>
                  Request Partnership
                  <span className="material-symbols-rounded text-[16px]">arrow_forward</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-center" style={{ color: "#AAAAAA" }}>
              No commitment required. We&apos;ll reach out within 24 hours.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

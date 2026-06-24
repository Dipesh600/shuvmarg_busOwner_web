"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const nepalMobilePattern = /^[9][678][0-9]{8}$/;

export default function LeadForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [mobile, setMobile] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isGeneratingOTP, setIsGeneratingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);

  const handleGenerateOTP = async () => {
    if (!nepalMobilePattern.test(mobile)) {
      setMobileError("Enter a valid 10-digit Nepal number (98/97/96...).");
      return;
    }
    setMobileError("");
    setIsGeneratingOTP(true);
    await new Promise((r) => setTimeout(r, 900));
    setIsGeneratingOTP(false);
    setStep(1);
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setOtpError("Enter the 6-digit code.");
      return;
    }
    setOtpError("");
    setIsVerifyingOTP(true);
    await new Promise((r) => setTimeout(r, 900));
    setIsVerifyingOTP(false);
    router.push("/onboarding");
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
      {/* Progress bar at top */}
      <div className="flex h-[3px]">
        <div
          className="transition-all duration-500"
          style={{
            width: step >= 0 ? "50%" : "0%",
            background: "#7A1D1B",
          }}
        />
        <div
          className="transition-all duration-500"
          style={{
            width: step >= 1 ? "50%" : "0%",
            background: "#C99A4A",
          }}
        />
        <div
          className="flex-1"
          style={{ background: "#F0EBE3" }}
        />
      </div>

      <div className="p-7">
        <AnimatePresence mode="wait">
          {/* ── Step 0: Phone Number ── */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 mb-3">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "#C99A4A" }}
                  />
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: "#7A1D1B" }}
                  >
                    Free Registration
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
                  Enter your mobile number. We&apos;ll send a verification code.
                </p>
              </div>

              {/* Phone field */}
              <div className="mb-4">
                <label
                  className="block text-[12px] font-semibold mb-2"
                  style={{ color: "#444444", letterSpacing: "0.01em" }}
                >
                  Mobile Number
                </label>
                <div
                  className="flex overflow-hidden transition-all duration-200"
                  style={{
                    border: mobileError
                      ? "1.5px solid #D32F2F"
                      : "1.5px solid #DDDDDD",
                    borderRadius: "10px",
                    background: "#FFFFFF",
                    boxShadow: mobileError
                      ? "0 0 0 3px rgba(211,47,47,0.08)"
                      : "none",
                  }}
                  onFocus={(e) => {
                    if (e.currentTarget.contains(e.target)) {
                      e.currentTarget.style.borderColor = "#7A1D1B";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(122,29,27,0.10)";
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      e.currentTarget.style.borderColor = mobileError ? "#D32F2F" : "#DDDDDD";
                      e.currentTarget.style.boxShadow = mobileError
                        ? "0 0 0 3px rgba(211,47,47,0.08)"
                        : "none";
                    }
                  }}
                >
                  {/* Country prefix */}
                  <div
                    className="flex items-center gap-1.5 px-3 flex-shrink-0 select-none"
                    style={{
                      borderRight: "1.5px solid #EEEEEE",
                      background: "#FAFAFA",
                      minWidth: 76,
                    }}
                  >
                    <span className="text-[13px] font-bold" style={{ color: "#444444" }}>
                      NP
                    </span>
                    <span className="text-[12px]" style={{ color: "#AAAAAA" }}>+977</span>
                  </div>
                  {/* Input */}
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="98XXXXXXXX"
                    value={mobile}
                    maxLength={10}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setMobile(val);
                      if (val.length > 0 && val.length < 10)
                        setMobileError("Must be 10 digits.");
                      else setMobileError("");
                    }}
                    className="flex-1 h-[46px] px-3 text-[14px] outline-none bg-transparent"
                    style={{
                      color: "#111111",
                      fontFamily: "var(--font-sans)",
                    }}
                  />
                  {/* Tick when valid */}
                  {mobile.length === 10 && !mobileError && (
                    <div className="flex items-center pr-3">
                      <span
                        className="material-symbols-rounded text-[18px]"
                        style={{ color: "#2E7D32" }}
                      >
                        check_circle
                      </span>
                    </div>
                  )}
                </div>
                {mobileError && (
                  <p className="text-[11px] mt-1.5" style={{ color: "#D32F2F" }}>
                    {mobileError}
                  </p>
                )}
              </div>

              <button
                onClick={handleGenerateOTP}
                disabled={isGeneratingOTP || mobile.length !== 10 || !!mobileError}
                className="w-full h-[46px] rounded-[10px] font-semibold text-[14px] text-white transition-all duration-200 flex items-center justify-center gap-2"
                style={{
                  background:
                    mobile.length === 10 && !mobileError
                      ? "#7A1D1B"
                      : "#CCCCCC",
                  cursor:
                    mobile.length === 10 && !mobileError && !isGeneratingOTP
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                {isGeneratingOTP ? (
                  <>
                    <span
                      className="material-symbols-rounded text-[16px] animate-spin"
                      style={{ color: "rgba(255,255,255,0.8)" }}
                    >
                      progress_activity
                    </span>
                    Sending code...
                  </>
                ) : (
                  <>
                    Get Verification Code
                    <span className="material-symbols-rounded text-[16px]">
                      arrow_forward
                    </span>
                  </>
                )}
              </button>

              <p
                className="text-[11px] text-center mt-4"
                style={{ color: "#AAAAAA" }}
              >
                By continuing, you agree to our{" "}
                <a href="#" style={{ color: "#7A1D1B" }}>
                  Terms of Service
                </a>
              </p>
            </motion.div>
          )}

          {/* ── Step 1: Verify OTP ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#C99A4A" }} />
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: "#7A1D1B" }}
                  >
                    Verify Number
                  </span>
                </div>
                <h3
                  className="text-[22px] font-bold leading-tight"
                  style={{ color: "#111111", letterSpacing: "-0.02em" }}
                >
                  Check your phone
                </h3>
                <p className="text-[13px] mt-2" style={{ color: "#888888" }}>
                  Code sent to{" "}
                  <span className="font-semibold" style={{ color: "#444444" }}>
                    +977&nbsp;{mobile}
                  </span>
                </p>
              </div>

              <div className="mb-4">
                <label
                  className="block text-[12px] font-semibold mb-2"
                  style={{ color: "#444444", letterSpacing: "0.01em" }}
                >
                  6-Digit Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="——————"
                  value={otp}
                  maxLength={6}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setOtpError("");
                  }}
                  className="w-full h-[52px] rounded-[10px] text-center text-[24px] font-bold tracking-[0.4em] outline-none transition-all duration-200"
                  style={{
                    border: otpError ? "1.5px solid #D32F2F" : "1.5px solid #DDDDDD",
                    color: "#111111",
                    fontFamily: "var(--font-sans), monospace",
                    boxShadow: otpError ? "0 0 0 3px rgba(211,47,47,0.08)" : "none",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#7A1D1B";
                    e.target.style.boxShadow = "0 0 0 3px rgba(122,29,27,0.10)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = otpError ? "#D32F2F" : "#DDDDDD";
                    e.target.style.boxShadow = otpError
                      ? "0 0 0 3px rgba(211,47,47,0.08)"
                      : "none";
                  }}
                />
                {otpError && (
                  <p className="text-[11px] mt-1.5 text-center" style={{ color: "#D32F2F" }}>
                    {otpError}
                  </p>
                )}
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={isVerifyingOTP || otp.length !== 6}
                className="w-full h-[46px] rounded-[10px] font-semibold text-[14px] text-white transition-all duration-200 flex items-center justify-center gap-2"
                style={{
                  background: otp.length === 6 ? "#7A1D1B" : "#CCCCCC",
                  cursor: otp.length === 6 && !isVerifyingOTP ? "pointer" : "not-allowed",
                }}
              >
                {isVerifyingOTP ? "Verifying..." : "Verify & Continue"}
              </button>

              <button
                onClick={() => { setStep(0); setOtp(""); setOtpError(""); }}
                className="w-full text-[12px] text-center mt-4 transition-colors"
                style={{ color: "#AAAAAA" }}
              >
                ← Use a different number
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

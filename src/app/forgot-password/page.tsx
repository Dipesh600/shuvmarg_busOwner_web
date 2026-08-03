"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoveLeft } from "lucide-react";

/**
 * Forgot Password Flow
 *
 * Step 1 — phone  → POST /api/auth/busowner/requestPasswordReset
 * Step 2 — otp    → POST /api/auth/busowner/verifyOtpForReset   (non-consuming check)
 *           resend → POST /api/auth/busowner/resendOtpForReset
 * Step 3 — reset  → POST /api/auth/busowner/resetPassword       (consumes the OTP)
 *
 * We carry `phone` and `otp` across steps because resetPassword needs
 * both to do a final re-verification before committing the new password.
 */

type Step = "phone" | "otp" | "password";

const NM = '"Neue Machina", system-ui, -apple-system, sans-serif';
import { API_URL as API } from "@/lib/config";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");

  // Step 1
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Step 2
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Step 3
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetError, setResetError] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // ── Step 1: Request reset OTP ───────────────────────────────────────────────
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");
    if (phone.length < 10) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API}/auth/busowner/requestPasswordReset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPhoneError(data.message || "Failed to send reset code. Please try again.");
        return;
      }

      // Backend always returns success=true here (even for unknown numbers —
      // intentional anti-enumeration). We proceed to OTP step regardless.
      setOtp("");
      setOtpError("");
      setStep("otp");
      setResendTimer(60);
    } catch {
      setPhoneError("Network error. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2a: Resend OTP ─────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendTimer > 0 || isLoading) return;
    setOtpError("");
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/auth/busowner/resendOtpForReset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.message || "Failed to resend. Please try again.");
        return;
      }
      setOtp("");
      setResendTimer(60);
    } catch {
      setOtpError("Network error. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2b: Verify OTP (non-consuming — just confirms code is valid) ────────
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    if (otp.length !== 6) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API}/auth/busowner/verifyOtpForReset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.message || "Invalid or expired code. Please try again.");
        return;
      }

      // OTP is valid — move to set new password
      setStep("password");
    } catch {
      setOtpError("Network error. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 3: Reset password (consuming — marks OTP as used) ─────────────────
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");

    if (password.length < 6) {
      setResetError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API}/auth/busowner/resetPassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Backend re-verifies the OTP here (consuming it) before saving password
        body: JSON.stringify({ phone, otp, newPassword: password }),
      });
      const data = await res.json();

      if (!res.ok) {
        // If OTP somehow expired between verify and reset, send them back to OTP step
        if (res.status === 400 && data.message?.toLowerCase().includes("otp")) {
          setOtpError(data.message);
          setStep("otp");
          return;
        }
        setResetError(data.message || "Failed to reset password. Please try again.");
        return;
      }

      // Success — redirect to login with a clean slate
      router.push("/login?reset=success");
    } catch {
      setResetError("Network error. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Back navigation ─────────────────────────────────────────────────────────
  const handleBack = () => {
    if (step === "otp") { setStep("phone"); setOtpError(""); }
    else if (step === "password") { setStep("otp"); setResetError(""); }
    else router.back();
  };

  return (
    <div className="min-h-[100svh] w-full flex items-center justify-center bg-[#FFFCF8] p-2 sm:p-4 lg:p-6">

      <div className="w-full max-w-[1600px] h-[calc(100svh-1rem)] sm:h-[calc(100svh-2rem)] lg:h-[calc(100svh-3rem)] min-h-[600px] bg-neutral-900 rounded-[24px] lg:rounded-[32px] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.16)] flex flex-col lg:flex-row relative">

        {/* Background Video */}
        <video
          src="/video.mp4"
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-40 hidden lg:block"
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none hidden lg:block" />

        {/* ─── LEFT SIDE (Desktop) ─── */}
        <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 z-10">
          <div className="relative z-10">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10"
            >
              <MoveLeft className="w-[18px] h-[18px]" strokeWidth={2.5} />
              <span className="text-[14px] font-medium tracking-wide">Back</span>
            </button>
          </div>

          <div className="relative z-10 max-w-lg mt-auto pb-16">
            <h1
              className="text-[48px] leading-[1.1] text-white mb-6"
              style={{ fontFamily: NM, fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              Secure Your.<br />
              <span style={{ color: "#D96B62" }}>Account.</span>
            </h1>
            <p className="text-[16px] leading-[1.6] text-white/80 font-medium">
              Reset your password securely to regain access to your operator command center. Keep your fleet moving safely.
            </p>
          </div>

          <div className="relative z-10 w-full border-t border-white/20 pt-8 mt-auto">
            <div className="grid grid-cols-3 gap-6 mb-12">
              <div className="border-r border-white/20 pr-6">
                <h3 className="text-white text-[24px] font-bold mb-1" style={{ fontFamily: NM }}>500+</h3>
                <p className="text-white/60 text-[13px]">Operators on Shuv Marg</p>
              </div>
              <div className="border-r border-white/20 px-6">
                <h3 className="text-white text-[24px] font-bold mb-1" style={{ fontFamily: NM }}>10k+</h3>
                <p className="text-white/60 text-[13px]">Tickets managed daily</p>
              </div>
              <div className="pl-6">
                <h3 className="text-white text-[24px] font-bold mb-1" style={{ fontFamily: NM }}>Instant</h3>
                <p className="text-white/60 text-[13px]">Operator Settlements</p>
              </div>
            </div>
            <p className="text-white/40 text-[12px]">Powered by Shuv Marg · &copy; 2026 Shuv Marg</p>
          </div>
        </div>

        {/* ─── RIGHT SIDE: FORM PANEL ─── */}
        <div className="w-full lg:w-1/2 flex-1 flex flex-col relative overflow-y-auto z-10 bg-white lg:rounded-bl-[100px] lg:shadow-[-24px_0_48px_rgba(0,0,0,0.15)]">

          {/* Mobile back button */}
          <div className="lg:hidden absolute top-6 left-6 z-10">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <MoveLeft className="w-5 h-5" strokeWidth={2.5} />
              <span className="text-[14px] font-medium">Back</span>
            </button>
          </div>

          {/* Logo */}
          <div className="absolute top-6 right-6 lg:right-8 z-10">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="font-black text-[20px] lg:text-[22px] tracking-tighter">
                <span className="text-[#111111]">Shuv</span><span className="text-[#D96B62]">marg</span>
                <span className="text-neutral-400 font-normal text-[13px] ml-1">Partner</span>
              </span>
            </Link>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 md:p-20 w-full max-w-[560px] mx-auto mt-12 lg:mt-0">

            {/* Header */}
            <div className="w-full mb-10">
              <h2 className="text-[28px] md:text-[32px] font-bold text-neutral-900 mb-2">
                {step === "phone" && "Forgot Password?"}
                {step === "otp" && "Verify Phone"}
                {step === "password" && "Reset Password"}
              </h2>
              <p className="text-[15px] text-neutral-500">
                {step === "phone" && "Enter your registered mobile number and we'll send a reset code."}
                {step === "otp" && (
                  <>Enter the 6-digit code sent to <strong className="text-neutral-900">+977-{phone}</strong></>
                )}
                {step === "password" && "Create a new, secure password for your account."}
              </p>
            </div>

            <div className="w-full relative">
              <AnimatePresence mode="wait">

                {/* ─── STEP 1: PHONE ─── */}
                {step === "phone" && (
                  <motion.form
                    key="phone-form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handlePhoneSubmit}
                    className="space-y-6 w-full"
                  >
                    <div className="space-y-2">
                      <label className="text-[13px] font-semibold text-neutral-800">
                        Registered Mobile Number
                      </label>
                      <div
                        className="relative flex items-center h-[52px] rounded-xl overflow-hidden transition-all duration-200 bg-white"
                        style={{
                          border: phoneError ? "1.5px solid #D32F2F" : "1.5px solid #e5e7eb",
                          boxShadow: phoneError ? "0 0 0 3px rgba(211,47,47,0.08)" : "0 1px 2px rgba(0,0,0,0.04)",
                        }}
                      >
                        <div className="h-full px-4 flex items-center justify-center border-r border-neutral-200 bg-neutral-50">
                          <span className="text-neutral-600 text-[15px] font-medium">+977</span>
                        </div>
                        <input
                          type="tel"
                          placeholder="Enter Mobile Number"
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                            setPhoneError("");
                          }}
                          className="flex-1 h-full px-4 outline-none text-[15px] text-neutral-900 bg-transparent placeholder:text-neutral-400"
                          autoFocus
                        />
                      </div>
                      {phoneError && (
                        <p className="text-[12px] mt-1" style={{ color: "#D32F2F" }}>{phoneError}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || phone.length < 10}
                      className="w-full h-[52px] rounded-xl text-white font-semibold text-[16px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#9A2622]"
                      style={{ background: "#7A1D1B" }}
                    >
                      {isLoading ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        "Send Reset Code"
                      )}
                    </button>

                    <p className="text-[14px] text-neutral-500 text-center">
                      Remember your password?{" "}
                      <Link href="/login" className="text-[#7A1D1B] font-semibold hover:underline">
                        Back to Sign In
                      </Link>
                    </p>
                  </motion.form>
                )}

                {/* ─── STEP 2: OTP ─── */}
                {step === "otp" && (
                  <motion.form
                    key="otp-form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleOtpSubmit}
                    className="space-y-6 w-full"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[13px] font-semibold text-neutral-800">
                          6-Digit Reset Code
                        </label>
                        <button
                          type="button"
                          onClick={() => { setStep("phone"); setOtp(""); setOtpError(""); }}
                          className="text-[#7A1D1B] text-[13px] hover:underline font-medium"
                        >
                          Change Number
                        </button>
                      </div>
                      <div
                        className="relative flex items-center h-[52px] rounded-xl overflow-hidden transition-all duration-200 bg-white"
                        style={{
                          border: otpError ? "1.5px solid #D32F2F" : "1.5px solid #e5e7eb",
                          boxShadow: otpError ? "0 0 0 3px rgba(211,47,47,0.08)" : "0 1px 2px rgba(0,0,0,0.04)",
                        }}
                      >
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="• • • • • •"
                          value={otp}
                          onChange={(e) => {
                            setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                            setOtpError("");
                          }}
                          className="w-full h-full px-4 text-center tracking-[0.5em] outline-none text-[18px] text-neutral-900 bg-transparent placeholder:text-neutral-300 placeholder:tracking-normal font-semibold"
                          autoFocus
                        />
                      </div>
                      {otpError && (
                        <p className="text-[12px] mt-1 text-center" style={{ color: "#D32F2F" }}>{otpError}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || otp.length !== 6}
                      className="w-full h-[52px] rounded-xl text-white font-semibold text-[16px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#9A2622]"
                      style={{ background: "#7A1D1B" }}
                    >
                      {isLoading ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        "Verify Code"
                      )}
                    </button>

                    <p className="text-[14px] text-neutral-500 text-center mt-4">
                      Didn&apos;t receive the code?{" "}
                      {resendTimer > 0 ? (
                        <span className="text-neutral-400 font-semibold">Resend in {resendTimer}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={isLoading}
                          className="text-neutral-900 font-semibold hover:underline disabled:opacity-50"
                        >
                          Resend Code
                        </button>
                      )}
                    </p>
                  </motion.form>
                )}

                {/* ─── STEP 3: NEW PASSWORD ─── */}
                {step === "password" && (
                  <motion.form
                    key="password-form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handlePasswordSubmit}
                    className="space-y-5 w-full"
                  >
                    {/* New Password */}
                    <div className="space-y-2">
                      <label className="text-[13px] font-semibold text-neutral-800">New Password</label>
                      <div className="relative flex items-center h-[52px] rounded-xl border border-neutral-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-neutral-300 focus-within:border-[#7A1D1B] focus-within:ring-4 focus-within:ring-[#7A1D1B]/10 overflow-hidden transition-all duration-200 bg-white px-4">
                        <span className="material-symbols-rounded text-neutral-400 mr-3 text-[20px]">lock</span>
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Minimum 6 characters"
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setResetError(""); }}
                          className="flex-1 h-full outline-none text-[15px] text-neutral-900 bg-transparent placeholder:text-neutral-400 pr-10"
                          autoFocus
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 text-neutral-400 hover:text-neutral-600 focus:outline-none flex items-center justify-center"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          <span className="material-symbols-rounded text-[20px]">
                            {showPassword ? "visibility_off" : "visibility"}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <label className="text-[13px] font-semibold text-neutral-800">Confirm New Password</label>
                      <div className={`relative flex items-center h-[52px] rounded-xl border shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-200 bg-white px-4 ${
                        confirmPassword && password !== confirmPassword
                          ? "border-red-500 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10"
                          : "border-neutral-200 hover:border-neutral-300 focus-within:border-[#7A1D1B] focus-within:ring-4 focus-within:ring-[#7A1D1B]/10"
                      }`}>
                        <span className="material-symbols-rounded text-neutral-400 mr-3 text-[20px]">lock_reset</span>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Repeat your password"
                          value={confirmPassword}
                          onChange={(e) => { setConfirmPassword(e.target.value); setResetError(""); }}
                          className="flex-1 h-full outline-none text-[15px] text-neutral-900 bg-transparent placeholder:text-neutral-400 pr-10"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 text-neutral-400 hover:text-neutral-600 focus:outline-none flex items-center justify-center"
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          <span className="material-symbols-rounded text-[20px]">
                            {showConfirmPassword ? "visibility_off" : "visibility"}
                          </span>
                        </button>
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <p className="text-[12px] text-red-500 mt-1">Passwords do not match.</p>
                      )}
                    </div>

                    {/* Server error */}
                    {resetError && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                        <span className="material-symbols-rounded text-[18px] text-red-500 flex-shrink-0 mt-0.5">error</span>
                        <p className="text-[13px] text-red-600 font-medium leading-snug">{resetError}</p>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isLoading || password.length < 6 || password !== confirmPassword}
                        className="w-full h-[52px] rounded-xl text-white font-semibold text-[16px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#9A2622]"
                        style={{ background: "#7A1D1B" }}
                      >
                        {isLoading ? (
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          "Reset Password"
                        )}
                      </button>
                    </div>
                  </motion.form>
                )}

              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

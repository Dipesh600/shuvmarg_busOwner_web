"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoveLeft } from "lucide-react";

import { saveTokens } from "@/lib/auth";

type Step = "phone" | "otp" | "details";

const NM = '"Neue Machina", system-ui, -apple-system, sans-serif';
import { API_URL as API } from "@/lib/config";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");

  // Step 1 — Phone
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Step 2 — OTP
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Step 3 — Account details
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  // Step 2 → Step 3 continuation proof — returned flat on the verifyOTP response body.
  // Must be forwarded to /register as req.body.verificationToken (canonical contract).
  const [verificationToken, setVerificationToken] = useState("");

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");
    if (phone.length < 10) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API}/auth/busowner/sendOTP`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPhoneError(data.message || "Failed to send OTP. Please try again.");
        return;
      }

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

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    if (otp.length !== 6) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API}/auth/busowner/verifyOTP`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.message || "Invalid or expired code. Please try again.");
        return;
      }

      // Capture the verification token — required to continue to Step 3.
      // The token is returned flat on the response body (data.verificationToken),
      // NOT nested under data.data. Without this token the register call returns 401.
      if (!data.verificationToken) {
        setOtpError("Verification failed. Please try again.");
        return;
      }
      setVerificationToken(data.verificationToken);

      setStep("details");
    } catch {
      setOtpError("Network error. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: Resend OTP ──────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setOtpError("");
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/auth/busowner/resendOTP`, {
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

  // ── Step 3: Register ────────────────────────────────────────────────────────
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDetailsError("");

    if (name.trim().length < 3) {
      setDetailsError("Name must be at least 3 characters.");
      return;
    }
    if (companyName.trim().length < 3) {
      setDetailsError("Company name must be at least 3 characters.");
      return;
    }
    if (password.length < 6) {
      setDetailsError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setDetailsError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API}/auth/busowner/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name: name.trim(), companyName: companyName.trim(), password, verificationToken }),
      });
      const data = await res.json();

      if (!res.ok) {
        setDetailsError(data.message || "Registration failed. Please try again.");
        return;
      }

      // Store token and redirect to onboarding
      saveTokens(data.accessToken);
      router.push("/onboarding");
    } catch {
      setDetailsError("Network error. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] w-full flex items-center justify-center bg-[#FFFCF8] p-2 sm:p-4 lg:p-6">
      
      <div className="w-full max-w-[1600px] h-[calc(100svh-1rem)] sm:h-[calc(100svh-2rem)] lg:h-[calc(100svh-3rem)] min-h-[600px] bg-neutral-900 rounded-[24px] lg:rounded-[32px] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.16)] flex flex-col lg:flex-row relative">
        
        {/* Background Video */}
        <video
          src="/video.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-40 hidden lg:block"
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none hidden lg:block" />

        {/* ─── LEFT SIDE (Desktop) ─── */}
        <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 z-10">
          <div className="relative z-10">
            <button
              onClick={() => {
                if (step === "otp") { setStep("phone"); setOtpError(""); }
                else if (step === "details") { setStep("otp"); setDetailsError(""); }
                else router.back();
              }}
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
              Fill More Seats.<br />
              <span style={{ color: "#D96B62" }}>Earn More.</span>
            </h1>
            <p className="text-[16px] leading-[1.6] text-white/80 font-medium">
              Sign in to your Shuv Marg command center — manage routes, track ratings, boost visibility and keep your fleet moving.
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
            <p className="text-white/40 text-[12px]">
              Powered by Shuv Marg · &copy; 2026 Shuv Marg
            </p>
          </div>
        </div>

        {/* ─── RIGHT SIDE: FORM PANEL ─── */}
        <div className="w-full lg:w-1/2 flex-1 flex flex-col relative overflow-y-auto z-10 bg-white lg:rounded-bl-[100px] lg:shadow-[-24px_0_48px_rgba(0,0,0,0.15)]">
          
          {/* Mobile back button */}
          <div className="lg:hidden absolute top-6 left-6 z-10">
            <button
              onClick={() => {
                if (step === "otp") { setStep("phone"); setOtpError(""); }
                else if (step === "details") { setStep("otp"); setDetailsError(""); }
                else router.back();
              }}
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

          <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 md:p-16 lg:p-20 w-full max-w-[560px] mx-auto mt-12 lg:mt-0">

            {/* Header */}
            <div className="w-full mb-10">
              <h2 className="text-[28px] md:text-[32px] font-bold text-neutral-900 mb-2">
                {step === "phone" && "Become a Partner"}
                {step === "otp" && "Verify Phone"}
                {step === "details" && "Set Up Account"}
              </h2>
              <p className="text-[15px] text-neutral-500">
                {step === "phone" && "Welcome to Shuv Marg Portal"}
                {step === "otp" && (
                  <>Enter the 6-digit code sent to <strong className="text-neutral-900">+977-{phone}</strong></>
                )}
                {step === "details" && "Create your operator account to get started."}
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
                        Register with OTP
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
                        "Send OTP"
                      )}
                    </button>

                    <div className="relative py-4 flex items-center">
                      <div className="flex-grow border-t border-neutral-200" />
                      <span className="flex-shrink-0 mx-4 text-neutral-400 text-[13px] bg-white">Or</span>
                      <div className="flex-grow border-t border-neutral-200" />
                    </div>

                    <p className="text-[14px] text-neutral-500 text-center">
                      Already have an account?{" "}
                      <Link href="/login" className="text-[#7A1D1B] font-semibold hover:underline">
                        Login with Password
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
                        <label className="text-[13px] font-semibold text-neutral-800">6-Digit OTP</label>
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
                        "Verify OTP"
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
                          Resend OTP
                        </button>
                      )}
                    </p>
                  </motion.form>
                )}

                {/* ─── STEP 3: ACCOUNT DETAILS ─── */}
                {step === "details" && (
                  <motion.form
                    key="details-form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleDetailsSubmit}
                    className="space-y-4 w-full"
                  >
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-neutral-800">Your Full Name</label>
                      <div className="relative flex items-center h-[52px] rounded-xl border border-neutral-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-neutral-300 focus-within:border-[#7A1D1B] focus-within:ring-4 focus-within:ring-[#7A1D1B]/10 overflow-hidden transition-all duration-200 bg-white px-4">
                        <span className="material-symbols-rounded text-neutral-400 mr-3 text-[20px]">person</span>
                        <input
                          type="text"
                          placeholder="e.g. Ram Bahadur Shrestha"
                          value={name}
                          onChange={(e) => { setName(e.target.value); setDetailsError(""); }}
                          className="flex-1 h-full outline-none text-[15px] text-neutral-900 bg-transparent placeholder:text-neutral-400"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Company Name */}
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-neutral-800">Company / Business Name</label>
                      <div className="relative flex items-center h-[52px] rounded-xl border border-neutral-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-neutral-300 focus-within:border-[#7A1D1B] focus-within:ring-4 focus-within:ring-[#7A1D1B]/10 overflow-hidden transition-all duration-200 bg-white px-4">
                        <span className="material-symbols-rounded text-neutral-400 mr-3 text-[20px]">business</span>
                        <input
                          type="text"
                          placeholder="e.g. Himalayan Bus Service Pvt. Ltd."
                          value={companyName}
                          onChange={(e) => { setCompanyName(e.target.value); setDetailsError(""); }}
                          className="flex-1 h-full outline-none text-[15px] text-neutral-900 bg-transparent placeholder:text-neutral-400"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-neutral-800">Create Password</label>
                      <div className="relative flex items-center h-[52px] rounded-xl border border-neutral-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-neutral-300 focus-within:border-[#7A1D1B] focus-within:ring-4 focus-within:ring-[#7A1D1B]/10 overflow-hidden transition-all duration-200 bg-white px-4">
                        <span className="material-symbols-rounded text-neutral-400 mr-3 text-[20px]">lock</span>
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Minimum 6 characters"
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setDetailsError(""); }}
                          className="flex-1 h-full outline-none text-[15px] text-neutral-900 bg-transparent placeholder:text-neutral-400 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 text-neutral-400 hover:text-neutral-600 focus:outline-none flex items-center justify-center"
                        >
                          <span className="material-symbols-rounded text-[20px]">
                            {showPassword ? "visibility_off" : "visibility"}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-neutral-800">Confirm Password</label>
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
                          onChange={(e) => { setConfirmPassword(e.target.value); setDetailsError(""); }}
                          className="flex-1 h-full outline-none text-[15px] text-neutral-900 bg-transparent placeholder:text-neutral-400 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 text-neutral-400 hover:text-neutral-600 focus:outline-none flex items-center justify-center"
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
                    {detailsError && (
                      <p className="text-[12px] text-center" style={{ color: "#D32F2F" }}>{detailsError}</p>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={
                          isLoading ||
                          name.trim().length < 3 ||
                          companyName.trim().length < 3 ||
                          password.length < 6 ||
                          password !== confirmPassword
                        }
                        className="w-full h-[52px] rounded-xl text-white font-semibold text-[16px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#9A2622]"
                        style={{ background: "#7A1D1B" }}
                      >
                        {isLoading ? (
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          "Create Account"
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

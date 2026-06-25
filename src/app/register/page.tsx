"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Step = "phone" | "otp" | "password";

const NM = '"Neue Machina", system-ui, -apple-system, sans-serif';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpSentTo, setOtpSentTo] = useState("");

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;

    if (phone === otpSentTo) {
      setStep("otp");
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    
    setOtpSentTo(phone);
    setOtp("");
    setStep("otp");
    setResendTimer(60);
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setOtp("");
    setResendTimer(60);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setStep("password");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword || password.length < 6) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    
    router.push("/onboarding");
  };

  return (
    <div className="min-h-[100svh] w-full flex items-center justify-center bg-[#FFFCF8] p-2 sm:p-4 lg:p-6">
      
      <div className="w-full max-w-[1600px] h-[calc(100svh-1rem)] sm:h-[calc(100svh-2rem)] lg:h-[calc(100svh-3rem)] min-h-[600px] bg-neutral-900 rounded-[24px] lg:rounded-[32px] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.16)] flex flex-col lg:flex-row relative">
        
        {/* Background Video (Shared across the whole card, visible through the right panel's cutout) */}
        <video
          src="/video.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-40 hidden lg:block"
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none hidden lg:block" />

        {/* ─── LEFT SIDE: HERO/INFO PANEL (Hidden on Mobile) ─── */}
        <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 z-10">

          {/* Top: Navigation Link */}
          <div className="relative z-10">
            {step === "phone" ? (
              <Link href="/login" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                <span className="material-symbols-rounded text-[18px]">arrow_back</span>
                <span className="text-[14px] font-medium tracking-wide">Back to Login</span>
              </Link>
            ) : (
              <button 
                onClick={() => {
                  if (step === "password") {
                    setStep("otp");
                    setPassword("");
                    setConfirmPassword("");
                  }
                  if (step === "otp") {
                    setStep("phone");
                  }
                }}
                className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10"
              >
                <span className="material-symbols-rounded text-[18px]">arrow_back</span>
                <span className="text-[14px] font-medium tracking-wide">Back</span>
              </button>
            )}
          </div>

          {/* Middle: Brand Message */}
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

          {/* Bottom: Stats & Footer */}
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
          {/* Mobile-only Navigation Link */}
          <div className="lg:hidden absolute top-6 left-6 z-10">
            {step === "phone" ? (
              <Link href="/login" className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors">
                <span className="material-symbols-rounded text-[20px]">arrow_back</span>
                <span className="text-[14px] font-medium">Back to Login</span>
              </Link>
            ) : (
              <button 
                onClick={() => {
                  if (step === "password") {
                    setStep("otp");
                    setPassword("");
                    setConfirmPassword("");
                  }
                  if (step === "otp") {
                    setStep("phone");
                  }
                }}
                className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <span className="material-symbols-rounded text-[20px]">arrow_back</span>
                <span className="text-[14px] font-medium">Back</span>
              </button>
            )}
          </div>

          {/* Logo on Right Panel */}
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
              {step === "password" && "Secure Account"}
            </h2>
            <p className="text-[15px] text-neutral-500">
              {step === "phone" && "Welcome to Shuv Marg Portal"}
              {step === "otp" && (
                <>Enter the 6-digit code sent to <strong className="text-neutral-900">+977-{phone}</strong></>
              )}
              {step === "password" && "Create a secure password for your new operator account."}
            </p>
          </div>

          <div className="w-full relative">
            <AnimatePresence mode="wait">
              {/* ─── STEP 1: PHONE ───────────────────────────── */}
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
                    <div className="relative flex items-center h-[52px] rounded-xl border border-neutral-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-neutral-300 focus-within:border-[#7A1D1B] focus-within:ring-4 focus-within:ring-[#7A1D1B]/10 overflow-hidden transition-all duration-200 bg-white">
                      <div className="h-full px-4 flex items-center justify-center border-r border-neutral-200 bg-neutral-50">
                        <span className="text-neutral-600 text-[15px] font-medium">+977</span>
                      </div>
                      <input
                        type="tel"
                        placeholder="Enter Mobile Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="flex-1 h-full px-4 outline-none text-[15px] text-neutral-900 bg-transparent placeholder:text-neutral-400"
                        autoFocus
                      />
                    </div>
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

              {/* ─── STEP 2: OTP ─────────────────────────────── */}
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
                        6-Digit OTP
                      </label>
                      <button 
                        type="button" 
                        onClick={() => {
                          setStep("phone");
                          setOtp("");
                        }}
                        className="text-[#7A1D1B] text-[13px] hover:underline font-medium"
                      >
                        Change Number
                      </button>
                    </div>
                    <div className="relative flex items-center h-[52px] rounded-xl border border-neutral-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-neutral-300 focus-within:border-[#7A1D1B] focus-within:ring-4 focus-within:ring-[#7A1D1B]/10 overflow-hidden transition-all duration-200 bg-white">
                      <input
                        type="text"
                        placeholder="• • • • • •"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="w-full h-full px-4 text-center tracking-[0.5em] outline-none text-[18px] text-neutral-900 bg-transparent placeholder:text-neutral-300 placeholder:tracking-normal font-semibold"
                        autoFocus
                      />
                    </div>
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
                      <span className="text-neutral-400 font-semibold">
                        Resend in {resendTimer}s
                      </span>
                    ) : (
                      <button 
                        type="button" 
                        onClick={handleResendOtp}
                        className="text-neutral-900 font-semibold hover:underline"
                      >
                        Resend OTP
                      </button>
                    )}
                  </p>
                </motion.form>
              )}

              {/* ─── STEP 3: PASSWORD ────────────────────────── */}
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
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-neutral-800">
                      Create Password
                    </label>
                    <div className="relative flex items-center h-[52px] rounded-xl border border-neutral-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-neutral-300 focus-within:border-[#7A1D1B] focus-within:ring-4 focus-within:ring-[#7A1D1B]/10 overflow-hidden transition-all duration-200 bg-white px-4">
                      <span className="material-symbols-rounded text-neutral-400 mr-3 text-[20px]">lock</span>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimum 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex-1 h-full outline-none text-[15px] text-neutral-900 bg-transparent placeholder:text-neutral-400 pr-10"
                        autoFocus
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

                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-neutral-800">
                      Confirm Password
                    </label>
                    <div className={`relative flex items-center h-[52px] rounded-xl border shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-200 bg-white px-4 ${
                      confirmPassword && password !== confirmPassword 
                        ? 'border-red-500 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10' 
                        : 'border-neutral-200 hover:border-neutral-300 focus-within:border-[#7A1D1B] focus-within:ring-4 focus-within:ring-[#7A1D1B]/10'
                    }`}>
                      <span className="material-symbols-rounded text-neutral-400 mr-3 text-[20px]">lock_reset</span>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isLoading || password.length < 6 || password !== confirmPassword}
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

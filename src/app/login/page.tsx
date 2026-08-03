"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MoveLeft } from "lucide-react";
import { saveTokens } from "@/lib/auth";

const NM = '"Neue Machina", system-ui, -apple-system, sans-serif';
import { API_URL as API } from "@/lib/config";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Show success banner when redirected from forgot-password
  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      setSuccessMsg("Password reset successful. Please sign in with your new password.");
    }
  }, [searchParams]);


  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10 || password.length < 6) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/auth/busowner/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Surface the exact error message from the backend
        // (wrong credentials, account locked, banned, wrong role, etc.)
        setError(data.message || "Login failed. Please try again.");
        return;
      }

      // Admin set a temporary password — redirect to force-change flow
      if (data.forcePasswordChange) {
        // Store the short-lived tempToken for the change-password page
        sessionStorage.setItem("busowner_temp_token", data.tempToken || "");
        router.push("/change-password");
        return;
      }

      // Normal successful login — save tokens and go to dashboard
      saveTokens(data.accessToken);
      router.push("/dashboard");
    } catch {
      setError("Network error. Check your connection and try again.");
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
              onClick={() => router.back()}
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
              Welcome Back.<br />
              <span style={{ color: "#D96B62" }}>Let&apos;s Move Nepal.</span>
            </h1>
            <p className="text-[16px] leading-[1.6] text-white/80 font-medium">
              Access your operator command center to manage live bookings, track fleet performance, and process seamless daily settlements.
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
              onClick={() => router.back()}
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
                Sign in to Dashboard
              </h2>
              <p className="text-[15px] text-neutral-500">
                Welcome back to your Shuv Marg Operator Portal
              </p>
            </div>

            <div className="w-full relative">
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleLoginSubmit}
                className="space-y-6 w-full"
              >
                {/* Phone Input */}
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-neutral-800">
                    Mobile Number
                  </label>
                  <div
                    className="relative flex items-center h-[52px] rounded-xl overflow-hidden transition-all duration-200 bg-white"
                    style={{ border: "1.5px solid #e5e7eb", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
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
                        setError("");
                      }}
                      className="flex-1 h-full px-4 outline-none text-[15px] text-neutral-900 bg-transparent placeholder:text-neutral-400"
                      autoFocus
                      autoComplete="tel"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-semibold text-neutral-800">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-[#7A1D1B] text-[13px] hover:underline font-medium"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative flex items-center h-[52px] rounded-xl border border-neutral-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-neutral-300 focus-within:border-[#7A1D1B] focus-within:ring-4 focus-within:ring-[#7A1D1B]/10 overflow-hidden transition-all duration-200 bg-white px-4">
                    <span className="material-symbols-rounded text-neutral-400 mr-3 text-[20px]">lock</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      className="flex-1 h-full outline-none text-[15px] text-neutral-900 bg-transparent placeholder:text-neutral-400 pr-10"
                      autoComplete="current-password"
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

                {/* Password reset success */}
                {successMsg && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-green-50 border border-green-100">
                    <span className="material-symbols-rounded text-[18px] text-green-600 flex-shrink-0 mt-0.5">check_circle</span>
                    <p className="text-[13px] text-green-700 font-medium leading-snug">{successMsg}</p>
                  </div>
                )}

                {/* Server error */}
                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                    <span className="material-symbols-rounded text-[18px] text-red-500 flex-shrink-0 mt-0.5">error</span>
                    <p className="text-[13px] text-red-600 font-medium leading-snug">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || phone.length < 10 || password.length < 6}
                  className="w-full h-[52px] rounded-xl text-white font-semibold text-[16px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#9A2622]"
                  style={{ background: "#7A1D1B" }}
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Sign In"
                  )}
                </button>

                <div className="relative py-4 flex items-center">
                  <div className="flex-grow border-t border-neutral-200" />
                  <span className="flex-shrink-0 mx-4 text-neutral-400 text-[13px] bg-white">New to Shuv Marg?</span>
                  <div className="flex-grow border-t border-neutral-200" />
                </div>

                <p className="text-[14px] text-neutral-500 text-center">
                  <Link href="/register" className="text-[#7A1D1B] font-semibold hover:underline">
                    Create a partner account
                  </Link>
                </p>
              </motion.form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

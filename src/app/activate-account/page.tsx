"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, ChevronLeft, KeyRound, MessageSquareText, ShieldCheck } from "lucide-react";
import { API_URL as API } from "@/lib/config";
import { saveTokens } from "@/lib/auth";

type Step = "phone" | "activate";

async function readResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "We could not complete account activation.");
  return data;
}

export default function ActivateAccountPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds(value => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  const requestCode = async () => {
    if (phone.length !== 10) return;
    setBusy(true);
    setError("");
    try {
      await readResponse(await fetch(`${API}/auth/activate/sendOTP`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-App-Source": "busowner" },
        body: JSON.stringify({ phone }),
      }));
      setOtp("");
      setStep("activate");
      setResendSeconds(60);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not send the activation code.");
    } finally {
      setBusy(false);
    }
  };

  const activate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (otp.length !== 6) return setError("Enter the six-digit code sent to your phone.");
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return setError("Use at least 8 characters with one uppercase letter and one number.");
    }
    if (password !== confirmPassword) return setError("Passwords do not match.");
    setBusy(true);
    try {
      const data = await readResponse(await fetch(`${API}/auth/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-App-Source": "busowner" },
        credentials: "include",
        body: JSON.stringify({ phone, otp, newPassword: password }),
      }));
      saveTokens(data.accessToken);
      setOtp("");
      setPassword("");
      setConfirmPassword("");
      router.replace("/dashboard");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not activate this account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-[100svh] bg-[#FFFCF8] px-4 py-8 sm:px-6 flex items-center justify-center">
      <section className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-[0_24px_70px_rgba(56,31,24,0.12)] grid lg:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-[#241C1A] p-8 sm:p-12 text-white flex flex-col justify-between gap-16">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-white/75 hover:text-white">
            <ChevronLeft className="h-4 w-4" /> Back to sign in
          </Link>
          <div>
            <ShieldCheck className="h-10 w-10 text-[#E6857D] mb-6" />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Activate your operator account</h1>
            <p className="text-white/70 leading-7">Confirm the phone number invited by Shuvmarg, then create a password that only you know.</p>
          </div>
          <div className="space-y-4 text-sm text-white/70">
            <p className="flex gap-3"><MessageSquareText className="h-5 w-5 text-[#E6857D] shrink-0" /> The activation code is short-lived and is never saved in your browser.</p>
            <p className="flex gap-3"><KeyRound className="h-5 w-5 text-[#E6857D] shrink-0" /> Shuvmarg staff will never ask for your code or password.</p>
          </div>
        </div>

        <div className="p-8 sm:p-12 lg:p-16 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="font-black text-2xl tracking-tighter"><span>Shuv</span><span className="text-[#D96B62]">marg</span></span>
              <span className="rounded-full bg-[#F8E9E6] px-3 py-1 text-xs font-semibold text-[#7A1D1B]">Partner</span>
            </div>

            {step === "phone" ? (
              <form onSubmit={(event) => { event.preventDefault(); void requestCode(); }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">Find your invitation</h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">Use the mobile number your administrator registered.</p>
                </div>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-neutral-800">Mobile number</span>
                  <span className="flex h-13 overflow-hidden rounded-xl border border-neutral-300 focus-within:border-[#7A1D1B] focus-within:ring-4 focus-within:ring-[#7A1D1B]/10">
                    <span className="flex items-center border-r border-neutral-200 bg-neutral-50 px-4 text-sm text-neutral-600">+977</span>
                    <input value={phone} onChange={event => { setPhone(event.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }}
                      type="tel" inputMode="numeric" autoComplete="tel" autoFocus
                      className="min-w-0 flex-1 px-4 outline-none" placeholder="98XXXXXXXX" />
                  </span>
                </label>
                {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                <button disabled={busy || phone.length !== 10} className="h-13 w-full rounded-xl bg-[#7A1D1B] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                  {busy ? "Sending code…" : "Send activation code"}
                </button>
              </form>
            ) : (
              <form onSubmit={activate} className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">Secure your account</h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">Enter the code sent to +977 {phone}, then choose your password.</p>
                </div>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-neutral-800">Six-digit code</span>
                  <input value={otp} onChange={event => { setOtp(event.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                    inputMode="numeric" autoComplete="one-time-code" autoFocus
                    className="h-13 w-full rounded-xl border border-neutral-300 px-4 text-center text-xl tracking-[0.4em] outline-none focus:border-[#7A1D1B] focus:ring-4 focus:ring-[#7A1D1B]/10" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-neutral-800">New password</span>
                  <input value={password} onChange={event => { setPassword(event.target.value); setError(""); }} type="password" autoComplete="new-password"
                    className="h-13 w-full rounded-xl border border-neutral-300 px-4 outline-none focus:border-[#7A1D1B] focus:ring-4 focus:ring-[#7A1D1B]/10" />
                  <span className="text-xs text-neutral-500">8+ characters, one uppercase letter and one number</span>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-neutral-800">Confirm password</span>
                  <input value={confirmPassword} onChange={event => { setConfirmPassword(event.target.value); setError(""); }} type="password" autoComplete="new-password"
                    className="h-13 w-full rounded-xl border border-neutral-300 px-4 outline-none focus:border-[#7A1D1B] focus:ring-4 focus:ring-[#7A1D1B]/10" />
                </label>
                {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                <button disabled={busy} className="h-13 w-full rounded-xl bg-[#7A1D1B] font-semibold text-white disabled:opacity-50">
                  {busy ? "Activating…" : <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Activate account</span>}
                </button>
                <div className="flex items-center justify-between text-sm">
                  <button type="button" onClick={() => { setStep("phone"); setError(""); }} className="font-medium text-neutral-600 hover:text-neutral-900">Change number</button>
                  <button type="button" disabled={busy || resendSeconds > 0} onClick={() => void requestCode()}
                    className="font-semibold text-[#7A1D1B] disabled:text-neutral-400">
                    {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Resend code"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

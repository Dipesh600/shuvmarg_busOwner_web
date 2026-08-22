"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, LockKeyhole } from "lucide-react";
import { API_URL } from "@/lib/config";
import { saveTokens } from "@/lib/auth";

const TEMP_TOKEN_KEY = "busowner_temp_token";
const NM = '"Neue Machina", system-ui, -apple-system, sans-serif';

export default function FirstLoginPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionStorage.getItem(TEMP_TOKEN_KEY)) {
      router.replace("/login");
    }
  }, [router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError("Use at least 8 characters with an uppercase letter and a number.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    const tempToken = sessionStorage.getItem(TEMP_TOKEN_KEY);
    if (!tempToken) {
      router.replace("/login");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/changeForcePassword`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, newPassword }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.accessToken) {
        if (response.status === 401 || response.status === 410) {
          sessionStorage.removeItem(TEMP_TOKEN_KEY);
          router.replace("/login");
          return;
        }
        throw new Error(payload.message || "Could not set your password. Please try again.");
      }
      saveTokens(payload.accessToken);
      sessionStorage.removeItem(TEMP_TOKEN_KEY);
      router.replace("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not set your password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[100svh] bg-[#FFFCF8] p-3 sm:p-6 flex items-center justify-center">
      <section className="w-full max-w-5xl overflow-hidden rounded-[28px] bg-neutral-950 shadow-[0_30px_90px_rgba(0,0,0,0.18)] grid lg:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden lg:flex min-h-[620px] flex-col justify-between bg-[#7A1D1B] p-12 text-white">
          <div className="h-12 w-12 rounded-2xl border border-white/20 bg-white/10 flex items-center justify-center">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/60">First sign in</p>
            <h1 className="mt-5 text-5xl leading-[1.05]" style={{ fontFamily: NM }}>
              Make the account yours.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">
              The password sent by Shuvmarg was only for account activation. Choose a private password before entering your operator workspace.
            </p>
          </div>
          <p className="text-xs text-white/50">Shuvmarg Operator Platform</p>
        </div>

        <div className="bg-white p-7 sm:p-12 lg:p-16 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <div className="h-12 w-12 rounded-2xl bg-[#7A1D1B]/10 text-[#7A1D1B] flex items-center justify-center lg:hidden">
              <LockKeyhole className="h-6 w-6" />
            </div>
            <p className="mt-8 lg:mt-0 text-xs font-black uppercase tracking-[0.2em] text-[#7A1D1B]">Password required</p>
            <h2 className="mt-3 text-3xl text-neutral-950" style={{ fontFamily: NM }}>Create your password</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-500">
              You will go directly to the operator dashboard after this step.
            </p>

            <form onSubmit={submit} className="mt-9 space-y-5">
              <PasswordField
                label="New password"
                value={newPassword}
                show={showPassword}
                onChange={setNewPassword}
                onToggle={() => setShowPassword((value) => !value)}
              />
              <PasswordField
                label="Confirm password"
                value={confirmPassword}
                show={showPassword}
                onChange={setConfirmPassword}
                onToggle={() => setShowPassword((value) => !value)}
              />
              <p className="text-xs leading-5 text-neutral-500">
                Minimum 8 characters, including an uppercase letter and a number.
              </p>
              {error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="h-12 w-full rounded-xl bg-[#7A1D1B] px-5 text-sm font-bold text-white transition hover:bg-[#641716] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Securing your account…" : "Set password and continue"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

function PasswordField({
  label, value, show, onChange, onToggle,
}: {
  label: string;
  value: string;
  show: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</span>
      <span className="relative block">
        <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="new-password"
          className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-11 pr-12 text-sm font-medium outline-none transition focus:border-[#7A1D1B] focus:ring-2 focus:ring-[#7A1D1B]/10"
        />
        <button type="button" onClick={onToggle} aria-label={show ? "Hide password" : "Show password"} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}

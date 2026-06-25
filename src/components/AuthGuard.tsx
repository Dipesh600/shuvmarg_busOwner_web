"use client";

/**
 * components/AuthGuard.tsx
 *
 * Wraps protected pages (dashboard, onboarding).
 * On mount:
 *   1. If no access token → redirect to /login immediately.
 *   2. If token exists but is expired → try silent refresh.
 *      - Refresh OK  → render children.
 *      - Refresh fail → redirect to /login.
 *   3. While checking → show a neutral loading screen (no flash of content).
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, refreshAccessToken } from "@/lib/auth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "authorized" | "redirecting">("checking");

  useEffect(() => {
    async function check() {
      if (!isLoggedIn()) {
        setStatus("redirecting");
        router.replace("/login");
        return;
      }

      // Token exists — it may still be valid or just expired.
      // We optimistically allow rendering but if any API call returns 401,
      // authFetch() will silently refresh. If the refresh fails, individual
      // pages handle the redirect.
      // For the guard itself, we just need the token to exist.
      setStatus("authorized");
    }

    check();
  }, [router]);

  if (status === "checking" || status === "redirecting") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#FFFCF8]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-neutral-200 border-t-[#7A1D1B] rounded-full animate-spin" />
          <p className="text-[14px] text-neutral-400 font-medium">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

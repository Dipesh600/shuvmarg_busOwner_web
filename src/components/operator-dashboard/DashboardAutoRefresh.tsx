"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { requestDataRefresh } from "@/lib/data-refresh";

const REFRESH_INTERVAL_MS = 60_000;
const MIN_REFRESH_GAP_MS = 10_000;

export default function DashboardAutoRefresh() {
  const router = useRouter();
  const lastRefresh = useRef(0);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      const now = Date.now();
      if (now - lastRefresh.current < MIN_REFRESH_GAP_MS) return;
      lastRefresh.current = now;
      requestDataRefresh();
      router.refresh();
    };
    const onVisibility = () => document.visibilityState === "visible" && refresh();
    const interval = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router]);

  return null;
}

import React from "react";
import AuthGuard from "@/components/AuthGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden" style={{ paddingTop: "72px" }}>
        {/* ── Main ─────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-neutral-100">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Mail, Phone, Settings2, UserRound } from "lucide-react";
import type { BusOwnerProfile } from "@/features/operator-dashboard/operator-dashboard-contract";
import { fetchOperatorDashboardState } from "@/features/operator-dashboard/operator-dashboard-api";

export default function BusinessProfilePage() {
  const [profile, setProfile] = useState<BusOwnerProfile | null>(null);

  useEffect(() => {
    let active = true;
    fetchOperatorDashboardState()
      .then((state) => {
        if (active) setProfile(state.profile);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const details = [
    {
      label: "Operator name",
      value: profile?.profile.name || "—",
      icon: UserRound,
    },
    {
      label: "Company name",
      value: profile?.business.companyName || "—",
      icon: Building2,
    },
    {
      label: "Phone",
      value: profile?.profile.phone || "—",
      icon: Phone,
    },
    {
      label: "Email",
      value: profile?.profile.email || "Not added",
      icon: Mail,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A1D1B]">
            Business profile
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold text-[#191512]">
            Operator identity
          </h1>
        </div>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#5C1414]"
        >
          <Settings2 className="h-4 w-4" />
          Edit in My Profile
        </Link>
      </div>

      <section className="rounded-[28px] border border-[#E8E1DB] bg-white p-5 shadow-2xs sm:p-7">
        <div className="grid gap-3 sm:grid-cols-2">
          {details.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl border border-[#E8E1DB] bg-[#FFFCFA] p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#7A1D1B]">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8A837D]">{label}</div>
                <div className="mt-1 truncate text-sm font-bold text-[#211D1A]">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

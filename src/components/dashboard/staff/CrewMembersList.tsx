"use client";

import { Users } from "lucide-react";

export default function CrewMembersList() {
  return (
    <section className="rounded-3xl border border-neutral-200 bg-white px-6 py-16 text-center shadow-sm">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-[#7A1D1B]"><Users className="h-7 w-7" /></span>
      <h2 className="mt-4 text-lg font-bold text-neutral-900">Crew management is coming next</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">Drivers and conductors will appear here after crew onboarding is connected. No crew records are available yet.</p>
    </section>
  );
}

"use client";

import { ArrowRight, BusFront, Plus } from "lucide-react";
import type { FleetListItem } from "@/features/fleet-registration/api";

export default function FleetSetupResumeBar({ fleets, hasLocalDraft, onAdd }: { fleets: FleetListItem[]; businessApproved: boolean; hasLocalDraft: boolean; onAdd: () => void }) {
  const next = fleets.find((fleet) => String(fleet.approvalStatus).toUpperCase() === "DRAFT");
  if (hasLocalDraft) return <section className="flex flex-col gap-3 rounded-2xl bg-[#211D1A] px-4 py-3.5 text-white sm:flex-row sm:items-center"><div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10"><BusFront className="size-4" /></div><div className="min-w-0 flex-1"><p className="text-sm font-bold">Bus setup saved</p><p className="mt-0.5 text-[10px] text-white/65">Continue from where you stopped on this device.</p></div><button type="button" onClick={onAdd} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-white px-3 text-[10px] font-bold text-[#211D1A]">Continue setup<ArrowRight className="size-3" /></button></section>;
  if (!next) return null;
  const documents = next.documentSummary?.present || 0;
  return <section className="flex flex-col gap-3 rounded-2xl bg-[#211D1A] px-4 py-3.5 text-white sm:flex-row sm:items-center"><div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10"><BusFront className="size-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{next.busName} · {next.busNumber}</p><p className="mt-0.5 text-[10px] text-white/65">Draft{documents ? ` · ${documents} documents added` : ""}</p></div><div className="flex gap-2"><button type="button" onClick={onAdd} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/15 px-3 text-[10px] font-bold"><Plus className="size-3" />Add bus</button><a href={`#fleet-${next.fleetId}`} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-[10px] font-bold text-[#211D1A]">Open draft<ArrowRight className="size-3" /></a></div></section>;
}

"use client";

import Link from "next/link";
import { ArrowRight, BusFront, Plus } from "lucide-react";
import type { OperatorFleetListItem } from "@/features/operator-dashboard/operator-dashboard-contract";

export default function FleetSetupOverview({ fleets, onAddVehicle }: { fleets: OperatorFleetListItem[]; businessApproved: boolean; onAddVehicle: () => void }) {
  return (
    <div className="p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#817A74]">Fleet setup</p><h3 className="mt-1 text-lg font-bold text-[#211D1A]">{fleets.length ? `${fleets.length} vehicle${fleets.length === 1 ? "" : "s"}` : "No vehicles yet"}</h3></div>
        <button type="button" onClick={onAddVehicle} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#7A1D1B] px-4 text-xs font-bold text-white"><Plus className="size-4" />Add bus</button>
      </div>

      <div className="mt-5 space-y-2.5">
        {fleets.length ? fleets.map((fleet) => {
          const status = String(fleet.approvalStatus || "DRAFT").toUpperCase();
          const label = status === "APPROVED" ? "Ready" : status === "PENDING" ? "In review" : status === "REJECTED" ? "Needs changes" : "Draft";
          return (
            <article key={fleet.fleetId} className="flex flex-col gap-3 rounded-2xl border border-[#E8E1DB] bg-white p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#7A1D1B]"><BusFront className="size-4" /></div><div className="min-w-0"><h4 className="truncate text-sm font-bold text-[#211D1A]">{fleet.busName}</h4><p className="mt-0.5 font-mono text-[10px] font-bold text-[#817A74]">{fleet.busNumber}</p></div></div>
              <span className="w-fit rounded-full bg-[#FAF8F5] px-3 py-1.5 text-[10px] font-bold text-[#655E58]">{label}</span>
              <Link href={`/dashboard/fleet?vehicle=${fleet.fleetId}#fleet-${fleet.fleetId}`} className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-xl border border-[#DCCFC8] px-3 text-[10px] font-bold text-[#7A1D1B]">Open<ArrowRight className="size-3" /></Link>
            </article>
          );
        }) : (
          <button type="button" onClick={onAddVehicle} className="flex w-full items-center justify-between rounded-2xl border border-dashed border-[#DCCFC8] bg-[#FFFCFA] p-5 text-left"><span><strong className="block text-sm text-[#211D1A]">Add your first bus</strong><span className="mt-1 block text-xs text-[#746E69]">You can add more buses anytime.</span></span><ArrowRight className="size-4 text-[#7A1D1B]" /></button>
        )}
      </div>
    </div>
  );
}

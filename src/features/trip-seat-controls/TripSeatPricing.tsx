import { useState } from "react";
import type { TripSeatControl } from "./types";

export default function TripSeatPricing({ value, busy, onSave }: {
  value: TripSeatControl;
  busy: boolean;
  onSave: (fare: number) => Promise<void>;
}) {
  const [fare, setFare] = useState(String(value.pricing.defaultFare || ""));
  return <section className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-[#E8E1DB] bg-white p-4">
    <div><p className="text-sm font-black text-[#211D1A]">Default fare</p><p className="mt-1 text-xs text-[#746E69]">Applied to every place unless it has its own price.</p></div>
    <div className="flex gap-2"><label className="rounded-xl border border-[#DCD4CD] bg-white px-3 py-2 text-xs font-bold text-[#746E69]">Rs. <input aria-label="Default fare" type="number" min="1" value={fare} onChange={(event) => setFare(event.target.value)} className="w-24 bg-transparent text-sm font-black text-[#211D1A] outline-none" /></label><button disabled={busy || Number(fare) <= 0} onClick={() => void onSave(Number(fare))} className="rounded-xl bg-[#7A1D1B] px-4 text-xs font-black text-white disabled:opacity-40">Save fare</button></div>
  </section>;
}

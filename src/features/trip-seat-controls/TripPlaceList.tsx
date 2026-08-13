import { useState } from "react";
import type { TripSeatControl } from "./types";

export default function TripPlaceList({ value, busy, onChange }: {
  value: TripSeatControl;
  busy: boolean;
  onChange: (elementId: string, state: "OPEN" | "WITHDRAWN", reason?: string) => Promise<void>;
}) {
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const elements = value.layout.sections.flatMap((section) => section.elements)
    .filter((element) => element.kind === "SEAT" || element.kind === "BERTH");
  const states = new Map(value.places.map((place) => [place.elementId, place.state]));
  const fares = new Map(value.pricing.overrides.map((item) => [item.elementId, item.fare]));

  return <section className="rounded-3xl border border-[#E8E1DB] bg-white p-5">
    <div className="mb-4"><h2 className="text-lg font-black text-[#211D1A]">Passenger places</h2><p className="mt-1 text-xs text-[#746E69]">Opening is immediate. Withdrawal is checked against bookings, active holds and the seven-day rule.</p></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {elements.map((element) => { const state = states.get(element.elementId) || "OPEN"; return <article key={element.elementId} className="rounded-2xl border border-[#E8E1DB] bg-[#FAF8F5] p-4">
        <div className="flex items-start justify-between gap-3"><div><p className="font-black text-[#211D1A]">{element.label}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#938A82]">{element.kind === "BERTH" ? "Sleeper berth" : "Seat"} · Rs. {fares.get(element.elementId) ?? value.pricing.defaultFare ?? "—"}</p></div><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${state === "OPEN" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{state}</span></div>
        {withdrawing === element.elementId ? <div className="mt-3 space-y-2"><input autoFocus value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why is this place being withdrawn?" className="h-10 w-full rounded-xl border border-[#DCD4CD] px-3 text-xs" /><div className="flex gap-2"><button onClick={() => { setWithdrawing(null); setReason(""); }} className="h-9 flex-1 rounded-xl border text-xs font-bold">Cancel</button><button disabled={busy || reason.trim().length < 3} onClick={() => void onChange(element.elementId, "WITHDRAWN", reason).then(() => { setWithdrawing(null); setReason(""); })} className="h-9 flex-1 rounded-xl bg-[#7A1D1B] text-xs font-black text-white disabled:opacity-40">Withdraw</button></div></div> : <button disabled={busy} onClick={() => state === "OPEN" ? setWithdrawing(element.elementId) : void onChange(element.elementId, "OPEN")} className="mt-3 h-9 w-full rounded-xl border border-[#DCD4CD] text-xs font-black text-[#655E58]">{state === "OPEN" ? "Withdraw safely" : "Open for booking"}</button>}
      </article>; })}
    </div>
  </section>;
}

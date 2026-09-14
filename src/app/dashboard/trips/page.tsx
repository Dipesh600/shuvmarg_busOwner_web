"use client";

import { useCallback, useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import LiveServiceChangeModal from "@/components/operator-dashboard/LiveServiceChangeModal";
import TripList from "@/features/trip-seat-controls/TripList";
import { getTripSeatControl, listOwnerTrips } from "@/features/trip-seat-controls/api";
import type { OwnerTrip, TripSeatControl } from "@/features/trip-seat-controls/types";

export default function TripsPage() {
  const [trips, setTrips] = useState<OwnerTrip[]>([]);
  const [selected, setSelected] = useState<OwnerTrip | null>(null);
  const [control, setControl] = useState<TripSeatControl | null>(null);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [liveChangeOpen, setLiveChangeOpen] = useState(false);
  const error = useCallback((cause: unknown) => { setMessage(cause instanceof Error ? cause.message : "Unable to manage trip seats."); }, []);
  const choose = useCallback(async (trip: OwnerTrip) => { setSelected(trip); setBusy(true); setMessage(null); try { setControl(await getTripSeatControl(trip._id)); } catch (cause) { setControl(null); error(cause); } finally { setBusy(false); } }, [error]);
  useEffect(() => { listOwnerTrips().then((items) => { setTrips(items); if (items[0]) void choose(items[0]); }).catch(error).finally(() => setBusy(false)); }, [choose, error]);

  const openPlaces = control?.places.filter((place) => place.state === "OPEN").length || 0;
  return <div className="space-y-6 p-4 sm:p-6 lg:p-8"><header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A1D1B]">Trip operations</p><h1 className="mt-2 text-3xl font-black text-[#211D1A]">Live service</h1><p className="mt-1 text-sm text-[#746E69]">Choose a trip, then change one operational detail with a clear date scope.</p></div><button type="button" disabled={!selected || selected.status !== "scheduled"} onClick={() => setLiveChangeOpen(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#7A1D1B] bg-white px-4 text-sm font-black text-[#7A1D1B] disabled:cursor-not-allowed disabled:border-[#D8D0C9] disabled:text-[#9B938C]"><SlidersHorizontal className="size-4" />Manage live service</button></header>{message && <div className="rounded-2xl border border-[#E8E1DB] bg-white p-4 text-sm font-bold text-[#655E58]">{message}</div>}<div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]"><TripList trips={trips} selectedId={selected?._id} onSelect={(trip) => void choose(trip)} /><main className="min-w-0">{control ? <div className="rounded-3xl border border-[#E8E1DB] bg-white p-5 sm:p-6"><div className="flex flex-col gap-2 border-b border-[#EEE8E2] pb-5"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7A1D1B]">Selected departure</p><h2 className="text-xl font-black text-[#211D1A]">{selected ? new Date(selected.tripDate).toLocaleDateString() : ""} · {selected?.departureTime}</h2><p className="text-sm text-[#746E69]">These values are read-only here. Use Manage live service so the date scope and passenger impact are always checked.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-[#F8F5F2] border border-[#E8E1DB] p-4"><p className="text-[10px] font-black uppercase tracking-wider text-[#918A84]">Current base fare</p><p className="mt-2 text-2xl font-black text-[#211D1A]">NPR {Number(control.pricing.defaultFare || 0).toLocaleString()}</p></div><div className="rounded-2xl border border-[#E8E1DB] bg-[#F8F5F2] p-4"><p className="text-[10px] font-black uppercase tracking-wider text-[#918A84]">Available seats</p><p className="mt-2 text-2xl font-black text-[#211D1A]">{openPlaces} <span className="text-sm text-[#746E69]">of {control.places.length}</span></p></div></div></div> : <div className="rounded-3xl border border-dashed border-[#DCD4CD] bg-white p-10 text-center text-sm text-[#746E69]">{busy ? "Loading trip details…" : "Choose a scheduled trip with an approved V3 seat layout."}</div>}</main></div>{liveChangeOpen && selected && <LiveServiceChangeModal trip={selected} control={control} onClose={() => setLiveChangeOpen(false)} onSaved={(savedMessage) => { setLiveChangeOpen(false); setMessage(savedMessage); listOwnerTrips().then((items) => { setTrips(items); const refreshed = items.find((item) => item._id === selected._id); if (refreshed) void choose(refreshed); }).catch(error); }} />}</div>;
}

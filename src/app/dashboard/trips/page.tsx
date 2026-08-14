"use client";

import { useCallback, useEffect, useState } from "react";
import TripList from "@/features/trip-seat-controls/TripList";
import TripPlaceList from "@/features/trip-seat-controls/TripPlaceList";
import TripSeatPricing from "@/features/trip-seat-controls/TripSeatPricing";
import { changeTripPlaceState, changeTripPricing, getTripSeatControl, listOwnerTrips } from "@/features/trip-seat-controls/api";
import type { OwnerTrip, TripSeatControl } from "@/features/trip-seat-controls/types";

export default function TripsPage() {
  const [trips, setTrips] = useState<OwnerTrip[]>([]);
  const [selected, setSelected] = useState<OwnerTrip | null>(null);
  const [control, setControl] = useState<TripSeatControl | null>(null);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const error = useCallback((cause: unknown) => { setMessage(cause instanceof Error ? cause.message : "Unable to manage trip seats."); }, []);
  const choose = useCallback(async (trip: OwnerTrip) => { setSelected(trip); setBusy(true); setMessage(null); try { setControl(await getTripSeatControl(trip._id)); } catch (cause) { setControl(null); error(cause); } finally { setBusy(false); } }, [error]);
  useEffect(() => { listOwnerTrips().then((items) => { setTrips(items); if (items[0]) void choose(items[0]); }).catch(error).finally(() => setBusy(false)); }, [choose, error]);
  async function state(elementId: string, next: "OPEN" | "WITHDRAWN", reason?: string) { if (!selected) return; setBusy(true); setMessage(null); try { setControl(await changeTripPlaceState(selected._id, elementId, next, reason)); setMessage(next === "OPEN" ? "Place opened for booking." : "Place withdrawn safely."); } catch (cause) { error(cause); } finally { setBusy(false); } }
  async function pricing(defaultFare: number) { if (!selected || !control) return; setBusy(true); setMessage(null); try { setControl(await changeTripPricing(selected._id, defaultFare, control.pricing.overrides)); setMessage("Trip fare updated."); } catch (cause) { error(cause); } finally { setBusy(false); } }

  return <div className="space-y-6 p-6 lg:p-8"><header><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A1D1B]">Trip operations</p><h1 className="mt-2 text-3xl font-black text-[#211D1A]">Seats and fares</h1><p className="mt-1 text-sm text-[#746E69]">Manage a departure without changing the bus&apos;s approved physical layout.</p></header>{message && <div className="rounded-2xl border border-[#E8E1DB] bg-white p-4 text-sm font-bold text-[#655E58]">{message}</div>}<div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]"><TripList trips={trips} selectedId={selected?._id} onSelect={(trip) => void choose(trip)} /><main className="min-w-0 space-y-4">{control ? <><TripSeatPricing key={`${control.tripId}:${control.controlVersion}`} value={control} busy={busy} onSave={pricing} /><TripPlaceList value={control} busy={busy} onChange={state} /></> : <div className="rounded-3xl border border-dashed border-[#DCD4CD] bg-white p-10 text-center text-sm text-[#746E69]">{busy ? "Loading trip seat map…" : "Choose a scheduled trip with an approved V3 seat layout."}</div>}</main></div></div>;
}

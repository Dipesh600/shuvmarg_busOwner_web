"use client";
import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Search, X } from "lucide-react";
import type { OwnerTrip } from "@/features/trip-seat-controls/types";
import { listCrewTrips, setConductorTrip } from "@/features/crew-management/api";
import type { StaffMember } from "./staff-contract";

interface Props { conductor: StaffMember; onClose: () => void; onSaved: (message: string) => void; }
const terminal = new Set(["completed", "cancelled"]);
export default function ConductorTripsDialog({ conductor, onClose, onSaved }: Props) {
  const [trips, setTrips] = useState<OwnerTrip[]>([]);
  const [assigned, setAssigned] = useState(() => new Set(conductor.assignedTrips?.map(trip => trip.id) || []));
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    listCrewTrips().then(value => { if (active) setTrips(value); })
      .catch(failure => { if (active) setError((failure as Error).message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const visible = useMemo(() => trips.filter(trip => {
    if (trip.brandId && trip.brandId !== conductor.brandId) return false;
    if (terminal.has(trip.status) && !assigned.has(trip._id)) return false;
    const text = [trip.tripId, trip.busId?.busName, trip.busId?.busNumber, trip.routeId?.routeName].filter(Boolean).join(" ").toLowerCase();
    return text.includes(query.trim().toLowerCase());
  }).sort((a, b) => new Date(a.tripDate).getTime() - new Date(b.tripDate).getTime()), [assigned, conductor.brandId, query, trips]);
  const toggle = async (trip: OwnerTrip) => {
    const next = !assigned.has(trip._id);
    setSaving(trip._id); setError("");
    try {
      await setConductorTrip(conductor.id, trip._id, next);
      setAssigned(current => {
        const value = new Set(current);
        if (next) value.add(trip._id); else value.delete(trip._id);
        return value;
      });
      onSaved(next ? "Trip assigned to conductor." : "Trip removed from conductor.");
    } catch (failure) { setError((failure as Error).message); }
    finally { setSaving(""); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="trip-dialog-title">
    <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
      <header className="flex items-start justify-between border-b border-neutral-200 px-6 py-5"><div><h2 id="trip-dialog-title" className="text-xl font-bold text-neutral-900">Trips for {conductor.fullName}</h2><p className="mt-1 text-sm text-neutral-500">Only selected trips appear in this conductor’s manifest.</p></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-neutral-500 hover:bg-neutral-100" aria-label="Close"><X className="h-5 w-5" /></button></header>
      <div className="border-b border-neutral-100 p-4"><label className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search bus, route or trip ID" className="h-11 w-full rounded-xl border border-neutral-200 pl-10 pr-3 text-sm outline-none focus:border-[#7A1D1B]" /></label></div>
      <div className="min-h-52 flex-1 overflow-y-auto p-4">{loading ? <div className="flex h-48 items-center justify-center"><LoaderCircle className="h-6 w-6 animate-spin text-[#7A1D1B]" /></div>
        : visible.length === 0 ? <p className="py-16 text-center text-sm text-neutral-500">No matching trips for this brand.</p>
        : <div className="space-y-2">{visible.map(trip => {
          const selected = assigned.has(trip._id);
          const disabled = saving === trip._id || (terminal.has(trip.status) && !selected);
          const routeLabel = trip.routeId?.routeName || (trip.routeId?.fromCity || "Route") + " to " + (trip.routeId?.toCity || "destination");
          const timeLabel = new Date(trip.tripDate).toLocaleDateString() + " · " + trip.departureTime
            + (trip.arrivalTime ? "–" + trip.arrivalTime : "") + " · " + (trip.busId?.busNumber || trip.busId?.busName || "Bus");
          return <label key={trip._id} className="flex items-start gap-3 rounded-2xl border border-neutral-200 p-4 hover:bg-neutral-50">
            <input type="checkbox" checked={selected} disabled={disabled} onChange={() => void toggle(trip)} className="mt-1 h-4 w-4 accent-[#7A1D1B]" />
            <span className="min-w-0 flex-1"><span className="block font-bold text-neutral-900">{routeLabel}</span><span className="mt-1 block text-xs text-neutral-500">{timeLabel}</span></span>
            <span className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-bold uppercase text-neutral-600">{trip.status.replaceAll("-", " ")}</span>
          </label>;
        })}</div>}
        {error && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}</div>
      <footer className="border-t border-neutral-200 px-6 py-4 text-right"><button type="button" onClick={onClose} className="rounded-xl bg-[#7A1D1B] px-5 py-2.5 text-sm font-bold text-white">Done</button></footer>
    </div>
  </div>;
}

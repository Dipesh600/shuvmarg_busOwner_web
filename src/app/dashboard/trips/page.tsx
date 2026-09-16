"use client";
import { useState } from "react";
import Link from "next/link";
import LiveServiceChangeModal from "@/components/operator-dashboard/LiveServiceChangeModal";
import TripList from "@/features/trip-seat-controls/TripList";
import { ownerTripsPath, nepalServiceDate, shiftServiceDate } from "@/features/trip-seat-controls/owner-trip-range";
import type { OwnerTrip, TripSeatControl } from "@/features/trip-seat-controls/types";
import { useOperatorSession } from "@/features/operator-dashboard/SessionContext";
import { useOwnerResource } from "@/features/owner-workspace/use-owner-resource";
import { WorkspaceHeader, ReadStatus, Metric, panel, input, button, money } from "@/features/owner-workspace/WorkspaceUI";
import { requestDataRefresh } from "@/lib/data-refresh";
export default function TripsPage() {
  const { dashboardState, loading: sessionLoading } = useOperatorSession();
  const allowed = dashboardState?.verificationStatus === "approved";
  const [dates, setDates] = useState(() => ({ from: shiftServiceDate(nepalServiceDate(), -30), to: shiftServiceDate(nepalServiceDate(), 60) }));
  const [selectedId, setSelectedId] = useState<string | null>(null), [liveChangeOpen, setLiveChangeOpen] = useState(false), [message, setMessage] = useState<string | null>(null);
  const list = useOwnerResource<OwnerTrip[]>(allowed ? ownerTripsPath(dates.from, dates.to) : null);
  const selected = list.data?.find(trip => trip._id === selectedId) || null;
  const control = useOwnerResource<TripSeatControl>(allowed && selected ? `/busowner/seat-layout-v3/trips/${selected._id}` : null);
  return <div className="space-y-6"><WorkspaceHeader title="Trips & schedules" description="Select a departure to inspect capacity or preview a scoped service change." />
  {!allowed ? <p className={panel}>{sessionLoading ? "Loading verification…" : "Business approval is required to manage trips."}</p> : <>
  <div className="flex flex-wrap gap-3"><label className="text-xs">From<input aria-label="Trip dates from" className={`${input} ml-2`} type="date" value={dates.from} onChange={event => setDates({ ...dates, from: event.target.value })} /></label><label className="text-xs">To<input aria-label="Trip dates to" className={`${input} ml-2`} type="date" value={dates.to} onChange={event => setDates({ ...dates, to: event.target.value })} /></label><span className="self-center text-xs">Maximum 91 days</span></div><ReadStatus {...list} />{message && <p role="status" className={panel}>{message}</p>}
  {list.data && <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]"><div><TripList trips={list.data} selectedId={selectedId || undefined} onSelect={trip => { setSelectedId(trip._id); setMessage(null); }} />{!list.data.length && <p className="mt-3 text-sm">No departures in this range.</p>}</div><main className="space-y-4">
  {!selected ? <p className={panel}>Choose a departure to view its details.</p> : <><section className={panel}><h2 className="font-black">{selected.tripDate.slice(0, 10)} · {selected.departureTime} · {selected.status}</h2><p className="mt-2 text-sm">{selected.directionLabel || selected.routeId?.routeName || "Route unavailable"}</p><div className="mt-4 flex flex-wrap gap-3"><Link className={button} href={`/dashboard/bookings?tripId=${selected._id}&from=${selected.tripDate.slice(0, 10)}&to=${selected.tripDate.slice(0, 10)}`}>Bookings & manifest</Link><button className={button} disabled={selected.status !== "scheduled" || Boolean(list.error)} onClick={() => setLiveChangeOpen(true)}>Manage live service</button></div><p className="mt-3 text-xs text-[#746E69]">These values are read-only here. Use Manage live service to check date scope and passenger impact before applying changes.</p></section><ReadStatus {...control} />{control.data && <div className="grid gap-3 sm:grid-cols-2"><Metric label="Base fare" value={control.data.pricing.defaultFare === null ? "Unavailable" : money(control.data.pricing.defaultFare)} /><Metric label="Places open for booking" value={`${control.data.places.filter(place => place.state === "OPEN").length} / ${control.data.places.length}`} /></div>}<p className="text-xs text-[#746E69]">Open places describe the seat control configuration; bookings and temporary holds are checked separately.</p></>}
  </main></div>}{liveChangeOpen && selected && <LiveServiceChangeModal trip={selected} control={control.data} onClose={() => setLiveChangeOpen(false)} onSaved={savedMessage => { setLiveChangeOpen(false); setMessage(savedMessage); requestDataRefresh(); }} />}
  </>}</div>;
}

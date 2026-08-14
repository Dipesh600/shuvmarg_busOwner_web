import type { OwnerTrip } from "./types";

const routeName = (trip: OwnerTrip) => trip.routeId?.routeName
  || [trip.routeId?.fromCity, trip.routeId?.toCity].filter(Boolean).join(" → ")
  || "Scheduled route";

export default function TripList({ trips, selectedId, onSelect }: {
  trips: OwnerTrip[];
  selectedId?: string;
  onSelect: (trip: OwnerTrip) => void;
}) {
  return <aside className="rounded-3xl border border-[#E8E1DB] bg-white p-3">
    <p className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#938A82]">Scheduled trips</p>
    <div className="space-y-2">
      {trips.map((trip) => <button key={trip._id} onClick={() => onSelect(trip)} className={`w-full rounded-2xl border p-4 text-left ${selectedId === trip._id ? "border-[#7A1D1B] bg-[#FFF1EE]" : "border-transparent bg-[#FAF8F5]"}`}>
        <p className="text-sm font-black text-[#211D1A]">{routeName(trip)}</p>
        <p className="mt-1 text-xs text-[#746E69]">{new Date(trip.tripDate).toLocaleDateString()} · {trip.departureTime}</p>
        <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-[#938A82]">{trip.busId?.busName || trip.busId?.busNumber || trip.status}</p>
      </button>)}
    </div>
  </aside>;
}

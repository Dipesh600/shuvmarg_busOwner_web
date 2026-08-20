"use client";

import { useMemo, useState } from "react";
import { Compass, MapPin, X } from "lucide-react";
import RouteEndpointPicker from "./RouteEndpointPicker";
import RoutePlaceMapPicker from "./RoutePlaceMapPicker";
import type { FleetRouteAddedPlace, FleetRouteEndpoint, FleetRouteStop, StopUsage } from "../route-types";

const EMPTY_DETAILS = {
  displayName: "",
  counterNumber: "",
  contactName: "",
  contactPhone: "",
  reportingInstructions: "",
};

export default function AddServedPlaceDialog({
  stops,
  onClose,
  onAdd,
}: {
  stops: FleetRouteStop[];
  onClose: () => void;
  onAdd: (place: FleetRouteAddedPlace) => void;
}) {
  const [existing, setExisting] = useState<FleetRouteEndpoint | null>(null);
  const [manual, setManual] = useState(false);
  const [name, setName] = useState("");
  const [afterStopId, setAfterStopId] = useState(stops[0]?.id || "");
  const [usage, setUsage] = useState<StopUsage>("BOTH");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");

  const center = useMemo(() => {
    const index = Math.max(0, stops.findIndex((stop) => stop.id === afterStopId));
    const a = stops[index]?.coordinates;
    const b = stops[index + 1]?.coordinates;
    if (a && b) return { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
    return a || b || { lat: 27.7172, lng: 85.324 };
  }, [afterStopId, stops]);

  const valid = existing || (name.trim() && coordinates);

  function submit() {
    if (!valid) return;
    onAdd({
      clientKey: globalThis.crypto?.randomUUID?.() || `place-${Date.now()}`,
      name: existing?.name || name.trim(),
      existingStopId: existing?.id || null,
      insertAfterStopId: afterStopId,
      coordinates: existing?.coordinates || coordinates,
      address: existing
        ? [existing.municipality, existing.district, existing.province].filter(Boolean).join(", ")
        : address,
      usage,
      meetingDetails: { ...EMPTY_DETAILS },
    });
  }

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add a custom place this bus serves"
        className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#EAE3DC] bg-white px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-[#FFF4F1] text-[#7A1D1B]">
              <Compass className="size-4" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7A1D1B]">
                Custom Stop
              </p>
              <h3 className="text-base font-black text-[#211D1A]">
                Add Place or Chowk Served by This Bus
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl border border-[#E0D8D0] text-[#7D756E] transition hover:bg-[#F5F0EA] hover:text-[#211D1A]"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="space-y-5 p-6">
          <div>
            <RouteEndpointPicker
              label="Find an existing database stop"
              purpose="ROUTE_STOP"
              value={existing}
              onChange={(val) => {
                setExisting(val);
                if (val) setManual(false);
              }}
            />
            <button
              type="button"
              onClick={() => {
                setExisting(null);
                setManual(true);
              }}
              className="mt-2 text-xs font-black text-[#7A1D1B] hover:underline"
            >
              Can’t find your stop in the list? Pin it directly on the map →
            </button>
          </div>

          {manual && (
            <div className="space-y-3.5 rounded-2xl border border-[#E3DBD4] bg-[#FAF8F5] p-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#756E67]">
                  Custom Place / Junction Name *
                </label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Gwarko Chowk / Malekhu Bridge"
                  className="mt-1 h-11 w-full rounded-xl border border-[#D5CCC3] bg-white px-3.5 text-sm font-bold text-[#211D1A] outline-none focus:border-[#7A1D1B]"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-[#756E67]">
                  Pin Coordinates on Highway
                </label>
                <RoutePlaceMapPicker
                  center={center}
                  value={coordinates}
                  onChange={(point, nextAddress) => {
                    setCoordinates(point);
                    setAddress(nextAddress);
                  }}
                />
              </div>

              {address && (
                <p className="flex items-start gap-1.5 text-xs text-[#746C65]">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#7A1D1B]" />
                  <span>{address}</span>
                </p>
              )}
            </div>
          )}

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-[#756E67]">
                Place Sequence After
              </label>
              <select
                value={afterStopId}
                onChange={(event) => setAfterStopId(event.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-[#D5CCC3] bg-white px-3 text-xs font-bold text-[#211D1A] outline-none focus:border-[#7A1D1B]"
              >
                {stops.slice(0, -1).map((stop) => (
                  <option key={stop.id} value={stop.id}>
                    {stop.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-[#756E67]">
                Passenger Service Type
              </label>
              <select
                value={usage}
                onChange={(event) => setUsage(event.target.value as StopUsage)}
                className="mt-1 h-11 w-full rounded-xl border border-[#D5CCC3] bg-white px-3 text-xs font-bold text-[#211D1A] outline-none focus:border-[#7A1D1B]"
              >
                <option value="BOTH">Boarding &amp; Dropping (Both)</option>
                <option value="PICKUP">Boarding Only</option>
                <option value="DROP">Dropping Only</option>
              </select>
            </div>
          </div>
        </div>

        <footer className="sticky bottom-0 flex justify-end gap-2.5 border-t border-[#EAE3DC] bg-[#FAF8F5] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-[#D5CCC3] bg-white px-4 text-xs font-black text-[#5C544E] transition hover:bg-[#F3ECE5]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={submit}
            className="h-10 rounded-xl bg-[#7A1D1B] px-5 text-xs font-black text-white shadow-xs transition hover:bg-[#601715] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add Stop to Route
          </button>
        </footer>
      </div>
    </div>
  );
}

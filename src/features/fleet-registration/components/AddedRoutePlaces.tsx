"use client";

import { MapPin, Trash2 } from "lucide-react";
import type { FleetRouteAddedPlace } from "../route-types";

export default function AddedRoutePlaces({
  places,
  onRemove,
}: {
  places: FleetRouteAddedPlace[];
  onRemove: (clientKey: string) => void;
}) {
  if (!places.length) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-[#E8DCCB] bg-[#FFFBF5] p-4 shadow-2xs">
      <div className="flex items-center justify-between border-b border-[#F0E4D3] pb-2.5">
        <p className="text-[11px] font-black uppercase tracking-wider text-[#8A5F20]">
          Custom Stops Added by You ({places.length})
        </p>
        <span className="text-[10px] font-bold text-[#8A7E73]">
          Reviewed with fleet verification
        </span>
      </div>

      <div className="space-y-2">
        {places.map((place) => (
          <div
            key={place.clientKey}
            className="flex items-center justify-between gap-3 rounded-xl border border-[#EBE2D5] bg-white p-3 shadow-2xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#FAF3EA] text-[#8A5F20] border border-[#E8D8C2]">
                <MapPin className="size-3.5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-[#211D1A]">{place.name}</p>
                <p className="truncate text-[11px] text-[#837B73]">
                  {place.existingStopId
                    ? "Existing database stop · sequence placement confirmed"
                    : place.address || "Custom map coordinate"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="rounded-md bg-[#FAF8F5] px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#736A62] border border-[#E5DDD5]">
                {place.usage === "BOTH" ? "Pickup & Drop" : place.usage}
              </span>
              <button
                type="button"
                onClick={() => onRemove(place.clientKey)}
                className="flex size-7 items-center justify-center rounded-lg text-[#9B9188] transition hover:bg-red-50 hover:text-red-700"
                title={`Remove ${place.name}`}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

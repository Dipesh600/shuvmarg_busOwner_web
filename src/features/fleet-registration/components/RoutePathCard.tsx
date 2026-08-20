import { Check, Route } from "lucide-react";
import type { FleetRouteVariantOption } from "../route-types";

function cleanVariantTitle(variant: FleetRouteVariantOption): string {
  // Strip raw DB codes like "KTM-LBD-MLG - " or "restored"
  const clean = variant.name
    .replace(/^[A-Z0-9]+-[A-Z0-9-]+(\s*-\s*)?/i, "")
    .replace(/\s*\(?restored\)?/gi, "")
    .replace(/\s*\(?default\)?/gi, "")
    .trim();

  // If name was just the origin and destination (e.g. "Kathmandu to Malangwa"), show key via stops
  const majorStops = variant.stops.filter((s) => s.isMajor);
  if (majorStops.length > 2) {
    const viaStops = majorStops.slice(1, -1).map((s) => s.name).slice(0, 2).join(", ");
    return `Via ${viaStops}`;
  }

  return clean || "Standard Road Path";
}

function pathSummary(variant: FleetRouteVariantOption): string {
  const names = variant.stops.filter((stop) => stop.isMajor).map((stop) => stop.name);
  if (names.length <= 1) return "";
  return names.length > 4
    ? [names[0], ...names.slice(1, 3), names.at(-1)].join(" → ")
    : names.join(" → ");
}

export default function RoutePathCard({
  variant,
  selected,
  onSelect,
}: {
  variant: FleetRouteVariantOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const friendlyTitle = cleanVariantTitle(variant);
  const summary = pathSummary(variant);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-[#7A1D1B] bg-[#FFF4F1] ring-2 ring-[#7A1D1B]/10 shadow-xs"
          : "border-[#E2DAD3] bg-white hover:border-[#BBAFA5]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-xl transition ${
            selected ? "bg-[#7A1D1B] text-white" : "bg-[#F3EFEB] text-[#716962]"
          }`}
        >
          {selected ? <Check className="size-4" /> : <Route className="size-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <strong className="text-sm font-black text-[#211D1A] truncate">{friendlyTitle}</strong>
            {variant.distanceKm != null && variant.distanceKm > 0 && (
              <span className="shrink-0 text-[11px] font-bold text-[#766E67]">
                {Math.round(variant.distanceKm)} km
              </span>
            )}
          </span>
          {summary && <span className="mt-1 block truncate text-xs text-[#7C746D]">{summary}</span>}
          <span className="mt-2 block text-[10px] font-black uppercase tracking-[0.1em] text-[#9A423E]">
            {variant.stops.length} route stops
            {variant.durationMinutes != null && variant.durationMinutes > 0
              ? ` · ~${Math.floor(variant.durationMinutes / 60)}h ${variant.durationMinutes % 60}m`
              : ""}
          </span>
        </span>
      </div>
    </button>
  );
}

import type { OwnerTrip } from "@/features/trip-seat-controls/types";

export const STATUS_FILTERS = [
  "all",
  "scheduled",
  "boarding",
  "in-transit",
  "completed",
  "cancelled",
] as const;

export type TripFilterStatus = (typeof STATUS_FILTERS)[number];

export const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const fmtCurrency = (n?: number | null) => {
  return `NPR ${(n || 0).toLocaleString("en-NP")}`;
};

export const getDirection = (trip: OwnerTrip): string => {
  if (trip.directionLabel) return trip.directionLabel;
  if (trip.routeSnapshot?.routeVersion?.name) return trip.routeSnapshot.routeVersion.name;
  if (trip.routeId?.routeName) return trip.routeId.routeName;
  const from = trip.fromStopName || trip.routeId?.fromCity;
  const to = trip.toStopName || trip.routeId?.toCity;
  if (from && to) return `${from} → ${to}`;
  return "Route unavailable";
};

export const getBrandName = (trip: OwnerTrip): string | null => {
  if (typeof trip.brandId === "object" && trip.brandId?.brandName) {
    return trip.brandId.brandName;
  }
  if (
    typeof trip.busId?.brandId === "object" &&
    trip.busId.brandId &&
    "brandName" in trip.busId.brandId &&
    typeof trip.busId.brandId.brandName === "string"
  ) {
    return trip.busId.brandId.brandName;
  }
  return null;
};

export function groupByBus(trips: OwnerTrip[]): Map<string, OwnerTrip[]> {
  const map = new Map<string, OwnerTrip[]>();
  for (const trip of trips) {
    const key = trip.busId?._id || trip.busId?.busNumber || "unassigned";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(trip);
  }
  return map;
}

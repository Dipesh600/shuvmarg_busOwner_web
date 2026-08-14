import { authFetch } from "@/lib/auth";
import type { OwnerTrip, TripSeatControl } from "./types";

async function payload<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Unable to manage this trip.");
  return body.data as T;
}

export async function listOwnerTrips(): Promise<OwnerTrip[]> {
  return payload<OwnerTrip[]>(await authFetch("/busowner/getMyTrips"));
}

export async function getTripSeatControl(tripId: string): Promise<TripSeatControl> {
  return payload<TripSeatControl>(await authFetch(`/busowner/seat-layout-v3/trips/${tripId}`));
}

export async function changeTripPlaceState(
  tripId: string,
  elementId: string,
  state: "OPEN" | "WITHDRAWN",
  reason?: string,
): Promise<TripSeatControl> {
  return payload<TripSeatControl>(await authFetch(
    `/busowner/seat-layout-v3/trips/${tripId}/places/${encodeURIComponent(elementId)}/state`,
    { method: "PATCH", body: JSON.stringify({ state, reason }) },
  ));
}

export async function changeTripPricing(
  tripId: string,
  defaultFare: number,
  overrides: Array<{ elementId: string; fare: number }>,
): Promise<TripSeatControl> {
  return payload<TripSeatControl>(await authFetch(`/busowner/seat-layout-v3/trips/${tripId}/pricing`, {
    method: "PATCH", body: JSON.stringify({ defaultFare, overrides }),
  }));
}

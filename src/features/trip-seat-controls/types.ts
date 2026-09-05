import type { SeatLayoutV3 } from "@/features/seat-layout-v3/types";

export interface OwnerTrip {
  _id: string;
  tripDate: string;
  departureTime: string;
  status: string;
  brandId?: string;
  tripId?: string;
  arrivalTime?: string;
  busId?: { busName?: string; busNumber?: string };
  routeId?: { routeName?: string; fromCity?: string; toCity?: string };
}

export interface TripSeatControl {
  tripId: string;
  fleetId: string;
  revisionId: string;
  layout: SeatLayoutV3;
  places: Array<{ elementId: string; state: "OPEN" | "WITHDRAWN" }>;
  pricing: {
    currency: "NPR";
    defaultFare: number | null;
    overrides: Array<{ elementId: string; fare: number }>;
  };
  controlVersion: number;
  capturedAt: string;
}

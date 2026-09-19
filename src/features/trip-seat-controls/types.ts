import type { SeatLayoutV3 } from "@/features/seat-layout-v3/types";

export interface OwnerTrip {
  ticketsSold?: number;
  totalRevenue?: number;
  occupiedPlaces?: number;
  salesBasis?: string;
  bookingCounts?: Record<string, number>;
  _id: string;
  tripDate: string;
  departureTime: string;
  status: string;
  brandId?: string | { _id?: string; brandName?: string };
  tripId?: string;
  tripFare?: number;
  arrivalTime?: string;
  busId?: {
    _id?: string;
    busName?: string;
    busNumber?: string;
    totalSeats?: number;
    brandId?: { _id?: string; brandName?: string } | string;
  };
  scheduleId?: string;
  corridorId?: string;
  routeSnapshot?: {
    corridor?: {
      corridorId?: string;
      origin?: { name?: string };
      destination?: { name?: string };
    };
    routeVersion?: {
      variantId?: string;
      name?: string;
      direction?: "FORWARD" | "RETURN";
      revisionNumber?: number;
    };
    assignment?: { scope?: string; reason?: string | null };
  } | null;
  routeId?: { routeName?: string; fromCity?: string; toCity?: string; basePrice?: number };
  directionLabel?: string;
  fromStopName?: string;
  toStopName?: string;
  driverId?: unknown;
  conductorId?: unknown;
  driverName?: string;
  conductorName?: string;
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

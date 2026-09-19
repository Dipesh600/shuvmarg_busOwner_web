import { authFetch } from "@/lib/auth";
import { ApiResponseError } from "@/lib/api-error";

export interface WorkstationFinancialPeriod {
  gross: number;
  originalTotal: number;
  discountsGiven: number;
  commission: number;
  refunds: number;
  refundCount: number;
  net: number;
  bookingCount: number;
  passengerCount: number;
}

export interface WorkstationFinancials {
  commissionRate: number;
  thisMonth: WorkstationFinancialPeriod;
  lastMonth: WorkstationFinancialPeriod;
  allTime: WorkstationFinancialPeriod;
}

export interface WorkstationTripStats {
  occupancyPct?: number;
  booked?: number;
  seatsSold?: number;
  totalBooked?: number;
  boardingConfirmed?: number;
  revenue?: number;
  cancelled?: number;
  refundsPending?: number;
}

export interface WorkstationTripFinancials {
  _id: string;
  tripId?: string;
  tripDate: string;
  departureTime?: string;
  arrivalTime?: string;
  status: string;
  shift?: string;
  variantId?: {
    code?: string;
    name?: string;
    direction?: "OUTBOUND" | "RETURN" | string;
    corridorId?: {
      originId?: { name?: string };
      destinationId?: { name?: string };
    };
  } | null;
  stats?: WorkstationTripStats;
}

export interface FleetFinancialsData {
  fleet?: {
    _id: string;
    fleetId?: string;
    busNumber: string;
    busName: string;
    commissionRate: number;
  };
  financials: WorkstationFinancials;
  recentTrips: WorkstationTripFinancials[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export async function getFleetFinancials(fleetId: string): Promise<FleetFinancialsData> {
  const res = await authFetch(`/busowner/fleets/${encodeURIComponent(fleetId)}/financials`);
  const payload = (await res.json().catch(() => null)) as ApiResponse<FleetFinancialsData> | null;
  if (!res.ok || !payload?.data) {
    throw new ApiResponseError(res, payload, "Unable to load fleet financials");
  }
  return payload.data;
}

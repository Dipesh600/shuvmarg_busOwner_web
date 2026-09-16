import { authFetch } from "@/lib/auth";
import type { OwnerTrip } from "@/features/trip-seat-controls/types";
export interface OwnerOverview {
  date: string; timezone: string; basis: string;
  summary: { departures: number; cancelledDepartures: number; ticketsSold: number; bookingSales: number; totalSeats: number; occupancyPct: number | null };
  fleetSales: Array<{ fleetId: string; ticketsSold: number; bookingSales: number; trips: number }>;
  departures: OwnerTrip[];
  recentBookings: Array<Pick<OwnerBooking, "_id" | "ticketId" | "status" | "seats" | "totalAmount" | "bookedAt">>;
  attention: Array<{ tripId: string; fleetId: string; message: string }>;
}
export interface Paging { page: number; limit: number; totalItems: number; totalPages: number }
export interface OwnerBooking {
  _id: string; ticketId: string; seats: string[]; status: string; totalAmount: number; bookedAt: string;
  bookedVia: string; boardingConfirmed: boolean;
  trip: OwnerTrip;
  passengerDetails?: Array<{ name: string; phone?: string; seatNo: string }>;
  refund?: { refundAmount: number; cancellationCharge: number; status: string } | null;
}
export interface BookingList { items: OwnerBooking[]; pagination: Paging; range: { from: string; to: string; timezone: string; basis: string } }
export interface OwnerSettlement {
  _id: string; brandId?: { _id: string; brandName: string }; status: string; createdAt: string;
  grossAmount: number; platformCommission: number; netPayableAmount: number; totalTicketsSold: number; commissionRate: number;
  paymentReference?: string; tripIds: string[];
}
export interface OwnerFinance {
  items: OwnerSettlement[]; pagination: Paging;
  totals: Array<{ status: string; count: number; grossAmount: number; platformCommission: number; netPayableAmount: number }>;
}
export function nepalToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
export async function readOwnerData<T>(path: string): Promise<T> {
  const response = await authFetch(path);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `Unable to load operator data (HTTP ${response.status}).`);
  return body.data as T;
}

export interface TripManifest {
  trip: OwnerTrip;
  items: Array<Pick<OwnerBooking, "_id" | "ticketId" | "seats" | "boardingConfirmed" | "passengerDetails">>;
  pagination: Paging;
}
export async function writeOwnerData(path: string, method: "POST" | "PATCH", data: unknown): Promise<void> {
  const response = await authFetch(path, { method, body: JSON.stringify(data) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `Unable to save (HTTP ${response.status}).`);
}

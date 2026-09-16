import type { OperatorFleetSetupStatus } from "@/features/operator-dashboard/operator-dashboard-contract";
import type { OwnerTrip } from "@/features/trip-seat-controls/types";

export interface FleetOperationalContext {
  routeText: string;
  scheduleText: string;
  driverName: string | null;
  conductorName: string | null;
  isLiveTrip: boolean;
  tripStatus: string | null;
  ticketsSoldCount: number | null;
  ticketsSoldAmount: number | null;
}

export function extractPersonName(value: unknown): string | null {
  if (!value) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    // Reject 24-character hex MongoDB ObjectIDs, 12-byte hex strings, or "ObjectId(...)" formats
    if (/^[0-9a-fA-F]{24}$/.test(trimmed) || /^[0-9a-fA-F]{12}$/.test(trimmed) || /^objectid\(/i.test(trimmed)) {
      return null;
    }
    return trimmed;
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const candidates = [
      obj.fullName,
      obj.name,
      obj.displayName,
      (obj.profile as Record<string, unknown> | undefined)?.fullName,
      (obj.profile as Record<string, unknown> | undefined)?.name,
      (obj.user as Record<string, unknown> | undefined)?.fullName,
      (obj.user as Record<string, unknown> | undefined)?.name,
      (obj.staff as Record<string, unknown> | undefined)?.fullName,
      (obj.staff as Record<string, unknown> | undefined)?.name,
      obj.label,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === "string") {
        const trimmed = candidate.trim();
        if (
          trimmed &&
          !/^[0-9a-fA-F]{24}$/.test(trimmed) &&
          !/^[0-9a-fA-F]{12}$/.test(trimmed) &&
          !/^objectid\(/i.test(trimmed)
        ) {
          return trimmed;
        }
      }
    }
  }

  return null;
}

export function formatScheduleTime(schedule?: unknown): string | null {
  if (!schedule || typeof schedule !== "object") return null;
  const s = schedule as { departureTime?: unknown; arrivalTime?: unknown; recurrence?: unknown };
  const dep = typeof s.departureTime === "string" ? s.departureTime.trim() : "";
  const arr = typeof s.arrivalTime === "string" ? s.arrivalTime.trim() : "";
  const recurrence =
    typeof s.recurrence === "string"
      ? s.recurrence === "DAILY"
        ? "Daily"
        : s.recurrence
      : "";
  if (dep && arr) return `${dep} – ${arr}${recurrence ? ` · ${recurrence}` : ""}`;
  if (dep) return `Departs ${dep}${recurrence ? ` · ${recurrence}` : ""}`;
  return null;
}

export function findActiveTripForFleet(
  trips: OwnerTrip[] | undefined | null,
  fleetId: string,
): OwnerTrip | null {
  if (!Array.isArray(trips) || !trips.length || !fleetId) return null;

  const todayIso = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const fleetTrips = trips.filter((t) => {
    if (!["in-transit", "boarding", "scheduled"].includes(t.status)) return false;
    if (!t.tripDate || !Number.isFinite(Date.parse(t.tripDate))) return false;
    if (t.status === "scheduled" && t.tripDate.slice(0, 10) < todayIso) return false;
    if (!t.busId) return false;
    const bid = typeof t.busId === "object" ? t.busId._id : String(t.busId);
    return bid === fleetId;
  });

  if (!fleetTrips.length) return null;

  // Status priority: active in-transit > boarding > scheduled
  const statusRank = (status?: string) => {
    const s = String(status || "").toLowerCase();
    if (s === "in-transit") return 1;
    if (s === "boarding") return 2;
    if (s === "scheduled") return 3;
    return 4;
  };


  const sorted = [...fleetTrips].sort((a, b) => {
    const rankA = statusRank(a.status);
    const rankB = statusRank(b.status);
    if (rankA !== rankB) return rankA - rankB;

    const dateA = a.tripDate ? new Date(a.tripDate).toISOString().slice(0, 10) : "";
    const dateB = b.tripDate ? new Date(b.tripDate).toISOString().slice(0, 10) : "";

    // Prefer trips happening today
    const aIsToday = dateA === todayIso;
    const bIsToday = dateB === todayIso;
    if (aIsToday && !bIsToday) return -1;
    if (!aIsToday && bIsToday) return 1;

    // Next nearest future trip
    return dateA.localeCompare(dateB);
  });

  return sorted[0] || null;
}

export function resolveFleetOperationalContext(
  setupStatus?: OperatorFleetSetupStatus | null,
  activeTrip?: OwnerTrip | null,
  fallbackRoute?: string | null,
  crewLookup?: Record<string, string> | null,
  _busNumber?: string | null,
  _totalSeats?: number | null,
): FleetOperationalContext {
  void _busNumber; void _totalSeats;
  // 1. Dynamic Route Resolution
  let routeText = "";
  if (activeTrip?.directionLabel?.trim()) {
    routeText = activeTrip.directionLabel.trim();
  } else if (activeTrip?.fromStopName && activeTrip?.toStopName) {
    routeText = `${activeTrip.fromStopName} → ${activeTrip.toStopName}`;
  } else if (activeTrip?.routeId?.fromCity && activeTrip?.routeId?.toCity) {
    routeText = `${activeTrip.routeId.fromCity} → ${activeTrip.routeId.toCity}`;
  } else if (activeTrip?.routeId?.routeName) {
    routeText = activeTrip.routeId.routeName;
  } else if (activeTrip?.routeSnapshot?.corridor?.origin?.name && activeTrip?.routeSnapshot?.corridor?.destination?.name) {
    routeText = `${activeTrip.routeSnapshot.corridor.origin.name} → ${activeTrip.routeSnapshot.corridor.destination.name}`;
  } else if (setupStatus?.assignedRoute?.label) {
    routeText = setupStatus.assignedRoute.label;
  } else if (setupStatus?.assignedRoute?.origin && setupStatus?.assignedRoute?.destination) {
    routeText = `${setupStatus.assignedRoute.origin} → ${setupStatus.assignedRoute.destination}`;
  } else if (fallbackRoute) {
    routeText = fallbackRoute;
  } else {
    routeText = "Route unavailable";
  }

  // 2. Schedule / Timing Resolution
  let scheduleText = "";
  const isLiveTrip = Boolean(
    activeTrip && ["in-transit", "boarding", "scheduled"].includes(String(activeTrip.status).toLowerCase()),
  );

  if (activeTrip?.departureTime) {
    const dep = activeTrip.departureTime.trim();
    const arr = activeTrip.arrivalTime?.trim() || "";
    const tripStatus = String(activeTrip.status || "").toLowerCase();

    if (tripStatus === "in-transit") {
      scheduleText = `In Transit · Departs ${dep}`;
    } else if (tripStatus === "boarding") {
      scheduleText = `Boarding now · Departs ${dep}`;
    } else {
      scheduleText = arr ? `${dep} – ${arr}` : `Departs ${dep}`;
    }
  } else if (setupStatus?.outboundScheduleData) {
    scheduleText = formatScheduleTime(setupStatus.outboundScheduleData) || "Schedule unavailable";
  } else {
    scheduleText = "Schedule unavailable";
  }

  // 3. Crew Resolution (Trip roster first, then directory lookup by ID, then master setup default)
  const rawSetup = setupStatus as Record<string, unknown> | null | undefined;
  const rawCrew = rawSetup?.crew as Record<string, unknown> | undefined;

  const rawDriverId =
    typeof activeTrip?.driverId === "string"
      ? activeTrip.driverId
      : (activeTrip?.driverId as { _id?: string; id?: string } | undefined)?._id ||
        (activeTrip?.driverId as { _id?: string; id?: string } | undefined)?.id;

  const rawConductorId =
    typeof activeTrip?.conductorId === "string"
      ? activeTrip.conductorId
      : (activeTrip?.conductorId as { _id?: string; id?: string } | undefined)?._id ||
        (activeTrip?.conductorId as { _id?: string; id?: string } | undefined)?.id;

  const driverName =
    extractPersonName(activeTrip?.driverName) ||
    extractPersonName(activeTrip?.driverId) ||
    (rawDriverId && crewLookup ? crewLookup[rawDriverId] : null) ||
    extractPersonName(setupStatus?.assignedDriver) ||
    (typeof setupStatus?.assignedDriver === "string" && crewLookup ? crewLookup[setupStatus.assignedDriver] : null) ||
    extractPersonName(rawCrew?.driver) ||
    extractPersonName((rawCrew?.driver as Record<string, unknown> | undefined)?.profile);

  const conductorName =
    extractPersonName(activeTrip?.conductorName) ||
    extractPersonName(activeTrip?.conductorId) ||
    (rawConductorId && crewLookup ? crewLookup[rawConductorId] : null) ||
    extractPersonName(setupStatus?.assignedConductor) ||
    (typeof setupStatus?.assignedConductor === "string" && crewLookup ? crewLookup[setupStatus.assignedConductor] : null) ||
    extractPersonName(rawCrew?.conductor) ||
    extractPersonName((rawCrew?.conductor as Record<string, unknown> | undefined)?.profile);

  // 4. Ticket Sales & Revenue Resolution
  const rawTrip = activeTrip as Record<string, unknown> | null | undefined;
  const rawSold = typeof rawTrip?.ticketsSold === "number" && Number.isSafeInteger(rawTrip.ticketsSold) && rawTrip.ticketsSold >= 0 ? rawTrip.ticketsSold : null;
  const rawAmount = typeof rawTrip?.totalRevenue === "number" && Number.isFinite(rawTrip.totalRevenue) && rawTrip.totalRevenue >= 0 ? rawTrip.totalRevenue : null;

  // Reporting fields are authoritative. Missing values must never become demo sales.
  const ticketsSoldCount = rawSold;
  const ticketsSoldAmount = rawAmount;

  return {
    routeText,
    scheduleText,
    driverName,
    conductorName,
    isLiveTrip,
    tripStatus: activeTrip?.status || null,
    ticketsSoldCount,
    ticketsSoldAmount,
  };
}


export function dailyFleetSales(trips: OwnerTrip[] | null, fleetId: string, serviceDate: string): { ticketsSold: number; bookingSales: number } | null {
  if (!trips) return null;
  const relevant = trips.filter(trip => {
    const busId = typeof trip.busId === "object" ? trip.busId?._id : trip.busId;
    const day = typeof trip.tripDate === "string" ? trip.tripDate.slice(0, 10) : "";
    return busId === fleetId && day === serviceDate && trip.status !== "cancelled";
  });
  if (relevant.some(trip => trip.salesBasis !== "active_bookings_for_departure"
    || !Number.isSafeInteger(trip.ticketsSold) || trip.ticketsSold! < 0
    || typeof trip.totalRevenue !== "number" || !Number.isFinite(trip.totalRevenue) || trip.totalRevenue < 0
    || !Number.isSafeInteger(Math.round(trip.totalRevenue * 100)))) return null;
  return { ticketsSold: relevant.reduce((sum, trip) => sum + trip.ticketsSold!, 0),
    bookingSales: relevant.reduce((sum, trip) => sum + Math.round(trip.totalRevenue! * 100), 0) / 100 };
}

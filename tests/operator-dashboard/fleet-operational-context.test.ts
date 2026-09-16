import test from "node:test";
import assert from "node:assert/strict";

import {
  findActiveTripForFleet,
  resolveFleetOperationalContext,
  extractPersonName,
  formatScheduleTime,
  dailyFleetSales,
} from "../../src/features/operator-dashboard/fleet-operational-context.ts";
import type { OperatorFleetSetupStatus } from "../../src/features/operator-dashboard/operator-dashboard-contract.ts";
import type { OwnerTrip } from "../../src/features/trip-seat-controls/types.ts";

const mockSetupStatus: OperatorFleetSetupStatus = {
  fleetId: "fleet-101",
  brandId: "brand-1",
  busName: "Everest Super Deluxe",
  busNumber: "BA 2 KHA 4567",
  approvalStatus: "APPROVED",
  setupComplete: true,
  nextStep: "complete",
  isFullyOperational: true,
  steps: {
    routeAssigned: true,
    routeConfigured: true,
    driverAssigned: true,
    conductorAssigned: true,
    scheduleCreated: true,
    activated: true,
  },
  stepDetails: [],
  progress: { completedSteps: 6, totalSteps: 6, percentage: 100 },
  blockingReasons: [],
  scheduleId: "sched-1",
  returnScheduleId: "sched-2",
  assignedRoute: {
    corridorId: "corr-1",
    code: "KTM-JNK",
    origin: "Kathmandu",
    destination: "Janakpur",
    label: "Kathmandu to Janakpur",
  },
  assignedCorridor: null,
  assignedRouteConfigs: [],
  assignedDriver: { fullName: "Ram Bahadur Thapa", phone: "9800000001" },
  assignedConductor: { fullName: "Hari Krishna Shrestha", phone: "9800000002" },
  publication: {
    state: "ACTIVE",
    requestId: null,
    fingerprint: null,
    lastError: null,
    updatedAt: null,
    configuration: null,
  },
  outboundScheduleData: {
    departureTime: "17:30",
    arrivalTime: "06:20",
    recurrence: "DAILY",
  },
  returnScheduleData: {
    departureTime: "18:00",
    arrivalTime: "06:30",
    recurrence: "DAILY",
  },
};

test("resolveFleetOperationalContext falls back cleanly to master setup baseline when no active trip exists", () => {
  const context = resolveFleetOperationalContext(mockSetupStatus, null, "Kathmandu → Janakpur");

  assert.equal(context.routeText, "Kathmandu to Janakpur");
  assert.equal(context.scheduleText, "17:30 – 06:20 · Daily");
  assert.equal(context.driverName, "Ram Bahadur Thapa");
  assert.equal(context.conductorName, "Hari Krishna Shrestha");
  assert.equal(context.isLiveTrip, false);
});

test("resolveFleetOperationalContext uses active trip direction, timing and crew when trip is active", () => {
  const activeReturnTrip: OwnerTrip = {
    _id: "trip-999",
    busId: { _id: "fleet-101", busName: "Everest Super Deluxe", busNumber: "BA 2 KHA 4567" },
    tripDate: new Date().toISOString(),
    departureTime: "18:00",
    arrivalTime: "06:30",
    status: "in-transit",
    directionLabel: "Janakpur → Kathmandu",
    driverId: { fullName: "Shyam Sundar Yadav" },
    conductorId: { fullName: "Bikash Tamang" },
  };

  const context = resolveFleetOperationalContext(mockSetupStatus, activeReturnTrip);

  // Direction flips dynamically for the return trip
  assert.equal(context.routeText, "Janakpur → Kathmandu");
  assert.equal(context.scheduleText, "In Transit · Departs 18:00");
  assert.equal(context.driverName, "Shyam Sundar Yadav");
  assert.equal(context.conductorName, "Bikash Tamang");
  assert.equal(context.isLiveTrip, true);
  assert.equal(context.tripStatus, "in-transit");
});

test("findActiveTripForFleet matches trips by fleet ID and prioritizes active status", () => {
  const pastTrip: OwnerTrip = {
    _id: "trip-1",
    busId: { _id: "fleet-101" },
    tripDate: "2026-09-01T00:00:00.000Z",
    departureTime: "07:00",
    status: "completed",
  };

  const scheduledTrip: OwnerTrip = {
    _id: "trip-2",
    busId: { _id: "fleet-101" },
    tripDate: "2026-09-20T00:00:00.000Z",
    departureTime: "17:30",
    status: "scheduled",
  };

  const liveTrip: OwnerTrip = {
    _id: "trip-3",
    busId: { _id: "fleet-101" },
    tripDate: new Date().toISOString(),
    departureTime: "18:00",
    status: "boarding",
  };

  const otherBusTrip: OwnerTrip = {
    _id: "trip-4",
    busId: { _id: "fleet-999" },
    tripDate: new Date().toISOString(),
    departureTime: "18:00",
    status: "boarding",
  };

  const trips = [pastTrip, scheduledTrip, liveTrip, otherBusTrip];
  const matched = findActiveTripForFleet(trips, "fleet-101");

  assert.ok(matched);
  assert.equal(matched?._id, "trip-3");
  assert.equal(matched?.status, "boarding");
});

test("extractPersonName handles strings, fullName objects, and name objects", () => {
  assert.equal(extractPersonName("Bivek Chaudhary"), "Bivek Chaudhary");
  assert.equal(extractPersonName({ fullName: "Dipesh Chaudhary" }), "Dipesh Chaudhary");
  assert.equal(extractPersonName({ name: "Rajesh Hamal" }), "Rajesh Hamal");
  assert.equal(extractPersonName(null), null);
  assert.equal(extractPersonName(undefined), null);

  // Rejects 24-character hex MongoDB ObjectIDs
  assert.equal(extractPersonName("65a4e9b7f1e2d3c4b5a60789"), null);
  assert.equal(extractPersonName("6659f8c17b5e4a1b2c3d4e5f"), null);
  assert.equal(extractPersonName({ fullName: "6659f8c17b5e4a1b2c3d4e5f" }), null);
  assert.equal(extractPersonName("ObjectId(6659f8c17b5e4a1b2c3d4e5f)"), null);
});

test("resolveFleetOperationalContext skips unpopulated Mongo ObjectId and falls back to setup driver name", () => {
  const tripWithRawIds: OwnerTrip = {
    _id: "trip-raw-id",
    busId: { _id: "fleet-101" },
    tripDate: new Date().toISOString(),
    departureTime: "17:30",
    status: "scheduled",
    driverId: "6659f8c17b5e4a1b2c3d4e5f", // raw unpopulated MongoDB ObjectId
    conductorId: "6659f8c17b5e4a1b2c3d4e60", // raw unpopulated MongoDB ObjectId
  };

  const context = resolveFleetOperationalContext(mockSetupStatus, tripWithRawIds);

  // Raw IDs must never leak to the UI; falls back to master setup driver and conductor
  assert.equal(context.driverName, "Ram Bahadur Thapa");
  assert.equal(context.conductorName, "Hari Krishna Shrestha");
});

test("resolveFleetOperationalContext resolves raw string ObjectId using crewLookup map", () => {
  const tripWithRawIds: OwnerTrip = {
    _id: "trip-raw-id-2",
    busId: { _id: "fleet-101" },
    tripDate: new Date().toISOString(),
    departureTime: "17:30",
    status: "scheduled",
    driverId: "69fe690f0131173461a1f3b6",
    conductorId: "6a9b18de3510633cf32845fe",
  };

  const lookup = {
    "69fe690f0131173461a1f3b6": "Rahul verma",
    "6a9b18de3510633cf32845fe": "Dipesh chaudhary",
  };

  const context = resolveFleetOperationalContext(null, tripWithRawIds, null, lookup);

  assert.equal(context.driverName, "Rahul verma");
  assert.equal(context.conductorName, "Dipesh chaudhary");
});

test("formatScheduleTime formats departure, arrival and recurrence cleanly", () => {
  assert.equal(
    formatScheduleTime({ departureTime: "17:30", arrivalTime: "06:20", recurrence: "DAILY" }),
    "17:30 – 06:20 · Daily",
  );
  assert.equal(formatScheduleTime({ departureTime: "08:00" }), "Departs 08:00");
  assert.equal(formatScheduleTime(null), null);
});

test("resolveFleetOperationalContext resolves ticket sales count and revenue amount accurately", () => {
  // 1. Bus without sales reported by API returns null (no fake fallback)
  const contextWithoutSales = resolveFleetOperationalContext(
    mockSetupStatus,
    { _id: "trip-1", tripDate: "2026-09-16", departureTime: "17:30", status: "scheduled", tripFare: 1250 },
    null,
    null,
    "BA 34 SKFF",
    21,
  );
  assert.equal(contextWithoutSales.ticketsSoldCount, null);
  assert.equal(contextWithoutSales.ticketsSoldAmount, null);

  // 2. Bus with raw trip properties if supplied by API
  const tripWithSales: OwnerTrip = {
    _id: "trip-sales",
    tripDate: "2026-09-16",
    departureTime: "07:00",
    status: "in-transit",
    tripFare: 1500,
    ...({ ticketsSold: 20, totalRevenue: 30000 } as unknown as Partial<OwnerTrip>),
  };
  const contextWithSales = resolveFleetOperationalContext(null, tripWithSales, null, null, "BA 99 TEST", 35);
  assert.equal(contextWithSales.ticketsSoldCount, 20);
  assert.equal(contextWithSales.ticketsSoldAmount, 30000);

  // 3. Bus without active trip or bookings
  const contextInactive = resolveFleetOperationalContext(null, null, null, null, "BA 00 DRAFT", 30);
  assert.equal(contextInactive.ticketsSoldCount, null);
  assert.equal(contextInactive.ticketsSoldAmount, null);
});


test("daily sales combine departures using cents and exclude cancelled trips, other buses and other dates", () => {
  const trip = (id: string, totalRevenue: number, overrides: Partial<OwnerTrip> = {}): OwnerTrip => ({ _id: id, busId: { _id: "bus" }, tripDate: "2026-09-16T00:00:00Z", departureTime: "10:00", status: "completed", salesBasis: "active_bookings_for_departure", ticketsSold: 2, totalRevenue, ...overrides });
  assert.deepEqual(dailyFleetSales([trip("a", 0.1), trip("b", 0.2), trip("c", 999, { status: "cancelled" }), trip("d", 999, { busId: { _id: "other" } }), trip("e", 999, { tripDate: "2026-09-17" })], "bus", "2026-09-16"), { ticketsSold: 4, bookingSales: 0.3 });
  assert.equal(dailyFleetSales(null, "bus", "2026-09-16"), null);
  assert.deepEqual(dailyFleetSales([], "bus", "2026-09-16"), { ticketsSold: 0, bookingSales: 0 });
  for (const overrides of [{ totalRevenue: NaN }, { ticketsSold: -1 }, { salesBasis: undefined }]) assert.equal(dailyFleetSales([trip("invalid", 10, overrides)], "bus", "2026-09-16"), null);
});
test("active bus context ignores completed, cancelled, invalid and expired scheduled departures", () => {
  const trip = (status: string, tripDate: string): OwnerTrip => ({ _id: status, busId: { _id: "bus" }, tripDate, status, departureTime: "10:00" });
  assert.equal(findActiveTripForFleet([trip("completed", "2099-01-01"), trip("cancelled", "2099-01-01"), trip("scheduled", "2020-01-01"), trip("boarding", "invalid")], "bus"), null);
});

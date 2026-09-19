import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { groupByBus, getDirection, getBrandName } from "../../src/app/dashboard/trips/components/fleet-trip-grouping.ts";
import type { OwnerTrip } from "../../src/features/trip-seat-controls/types.ts";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("fleet trip view contract: groupByBus aggregates trips, calculates occupancy and preserves bus association", () => {
  const trips: OwnerTrip[] = [
    {
      _id: "trip-1",
      tripDate: "2026-09-19T00:00:00.000Z",
      departureTime: "17:20",
      status: "scheduled",
      busId: { _id: "bus-1", busName: "Ganga Jamuna Bus", busNumber: "BA 3908 KA 10", totalSeats: 21 },
      ticketsSold: 1,
      totalRevenue: 1250,
      directionLabel: "Kathmandu → Malangwa",
    },
    {
      _id: "trip-2",
      tripDate: "2026-09-20T00:00:00.000Z",
      departureTime: "17:20",
      status: "scheduled",
      busId: { _id: "bus-1", busName: "Ganga Jamuna Bus", busNumber: "BA 3908 KA 10", totalSeats: 21 },
      ticketsSold: 2,
      totalRevenue: 2500,
      directionLabel: "Kathmandu → Malangwa",
    },
    {
      _id: "trip-3",
      tripDate: "2026-09-19T00:00:00.000Z",
      departureTime: "18:40",
      status: "scheduled",
      busId: { _id: "bus-2", busName: "Himalyan Travels", busNumber: "BA 34 SKFF", totalSeats: 30 },
      ticketsSold: 15,
      totalRevenue: 18000,
      directionLabel: "Malangwa → Kathmandu",
    },
  ];

  const groups = groupByBus(trips);
  assert.equal(groups.size, 2);

  const bus1Trips = groups.get("bus-1");
  assert.ok(bus1Trips);
  assert.equal(bus1Trips.length, 2);

  const totalRevenueBus1 = bus1Trips.reduce((s, t) => s + (t.totalRevenue || 0), 0);
  assert.equal(totalRevenueBus1, 3750);

  const totalSoldBus1 = bus1Trips.reduce((s, t) => s + (t.ticketsSold || 0), 0);
  const totalSeatsBus1 = bus1Trips[0].busId!.totalSeats!;
  const avgOccBus1 = Math.round((totalSoldBus1 / (totalSeatsBus1 * bus1Trips.length)) * 100);
  // (3 / (21 * 2)) * 100 = (3 / 42) * 100 = 7.14% -> 7%
  assert.equal(avgOccBus1, 7);

  // Direction & brand extraction
  assert.equal(getDirection(trips[0]), "Kathmandu → Malangwa");
});

test("fleet trip view contract: FleetTripView renders human travel cards without search bar, status dropdown, date inputs, or developer jargon", () => {
  const component = read("src/app/dashboard/trips/components/FleetTripView.tsx");
  const page = read("src/app/dashboard/trips/page.tsx");

  // Removed controls (no search bar, status dropdown, date range inputs, or retry button)
  assert.doesNotMatch(component, /Search bus, direction, city/);
  assert.doesNotMatch(component, /All Statuses/);
  assert.doesNotMatch(component, /Trip dates from/);
  assert.doesNotMatch(component, /Trip dates to/);
  assert.doesNotMatch(component, /trips across/);

  // Replaced developer jargon "Fleet Trip View" with human travel design
  assert.doesNotMatch(component, /Fleet Trip View/);
  assert.match(component, /Buses & Scheduled Trips/);
  assert.match(component, /Fleet timetable/);
  assert.match(component, /Select any vehicle to inspect upcoming departures/);

  // Individual Bus Cards & Metrics
  assert.match(component, /Trips/);
  assert.match(component, /Avg Occ/);
  assert.match(component, /Revenue/);
  assert.match(component, /Workstation/);
  assert.match(component, /\/dashboard\/fleet\//);
  assert.match(component, /View trips/);

  // Collapsible Timetable & Passenger Manifest
  assert.match(component, /Date & Departure/);
  assert.match(component, /Route/);
  assert.match(component, /Status/);
  assert.match(component, /Occupancy/);
  assert.match(component, /Manifest/);
  assert.match(component, /Details/);

  // Trip Details Modal & Actions
  assert.match(component, /Trip details/);
  assert.match(component, /Bookings & manifest/);
  assert.match(component, /Manage live service/);

  // Integration in TripsPage
  assert.match(page, /import { FleetTripView } from "\.\/components\/FleetTripView"/);
  assert.match(page, /<FleetTripView/);
  assert.match(page, /trips={list\.data \|\| \[\]}/);
  assert.match(page, /onManageLiveService={handleOpenLiveService}/);
});

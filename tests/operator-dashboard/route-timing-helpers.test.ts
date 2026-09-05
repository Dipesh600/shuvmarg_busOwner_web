import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateDeparture,
  calculateDurationMinutes,
  calculateHaltFromTimes,
  formatDuration,
  fromInputTime,
  generateSmartTimingsFromOrigin,
  getInitialActiveStopIds,
  toInputTime,
} from "../../src/features/operator-dashboard/route-timing-helpers.ts";

test("empty stop selection keeps only required route endpoints", () => {
  const stops = ["s1", "s2", "s3"].map((id) => ({
    _id: `row-${id}`,
    stopId: { _id: id },
    isActive: false,
  }));
  assert.deepEqual(getInitialActiveStopIds(stops), ["s1", "s3"]);
});
import type {
  OperatorRouteStop,
  OperatorRouteTiming,
} from "../../src/features/operator-dashboard/route-configuration-api.ts";

test("time conversion utilities correctly handle 12-hour and 24-hour formats", () => {
  assert.equal(toInputTime("06:30 AM"), "06:30");
  assert.equal(toInputTime("12:00 PM"), "12:00");
  assert.equal(toInputTime("12:15 AM"), "00:15");
  assert.equal(toInputTime("09:45 PM"), "21:45");
  assert.equal(toInputTime("invalid"), "");

  assert.equal(fromInputTime("06:30"), "06:30 AM");
  assert.equal(fromInputTime("12:00"), "12:00 PM");
  assert.equal(fromInputTime("00:15"), "12:15 AM");
  assert.equal(fromInputTime("21:45"), "09:45 PM");
  assert.equal(fromInputTime("invalid"), "");
});

test("calculateDeparture computes departure based on arrival and halt duration", () => {
  assert.equal(calculateDeparture("08:30 AM", 15), "08:45 AM");
  // Crossing hour boundary
  assert.equal(calculateDeparture("08:50 AM", 20), "09:10 AM");
  // No halt
  assert.equal(calculateDeparture("10:00 AM", 0), "10:00 AM");
  // Empty input returns empty
  assert.equal(calculateDeparture("", 10), "");
});

test("calculateHaltFromTimes calculates halt duration between arrival and departure", () => {
  assert.equal(calculateHaltFromTimes("08:30 AM", "08:45 AM"), 15);
  assert.equal(calculateHaltFromTimes("08:50 AM", "09:20 AM"), 30);
  assert.equal(calculateHaltFromTimes("10:00 AM", "10:00 AM"), 0);
});

test("calculateDurationMinutes computes total journey minutes accurately", () => {
  // 06:30 AM to 02:00 PM -> 7h 30m = 450 minutes
  const daytimeMinutes = calculateDurationMinutes("06:30 AM", "02:00 PM");
  assert.equal(daytimeMinutes, 450);

  // Overnight journey: 08:00 PM to 05:00 AM -> 9 hours = 540 minutes
  const overnightMinutes = calculateDurationMinutes("08:00 PM", "05:00 AM");
  assert.equal(overnightMinutes, 540);

  // Invalid times return null
  assert.equal(calculateDurationMinutes("", "02:00 PM"), null);
});

test("formatDuration creates clean human-readable duration strings", () => {
  assert.equal(formatDuration(450), "7h 30m");
  assert.equal(formatDuration(120), "2 hrs");
  assert.equal(formatDuration(45), "45 mins");
});

test("generateSmartTimingsFromOrigin propagates downstream timings from departure", () => {
  const mockStops: OperatorRouteStop[] = [
    {
      _id: "stop-rel-1",
      stopId: { _id: "s1", name: "Kathmandu (Gongabu)", code: "KTM" },
      isActive: true,
      durationFromOriginMins: 0,
    },
    {
      _id: "stop-rel-2",
      stopId: { _id: "s2", name: "Malekhu", code: "MLK" },
      isActive: true,
      durationFromOriginMins: 120, // 2 hours
    },
    {
      _id: "stop-rel-3",
      stopId: { _id: "s3", name: "Pokhara Tourist Bus Park", code: "PKR" },
      isActive: true,
      durationFromOriginMins: 360, // 6 hours
    },
  ];

  const currentTimings: OperatorRouteTiming[] = [
    {
      stopId: "s1",
      estimatedArrival: "",
      estimatedDeparture: "06:00 AM",
      haltDuration: 0,
      dayOffset: 0,
      stopBehavior: "BOARDING_ONLY",
    },
    {
      stopId: "s2",
      estimatedArrival: "",
      estimatedDeparture: "",
      haltDuration: 30, // 30 min meal halt
      dayOffset: 0,
      stopBehavior: "REST_STOP",
    },
    {
      stopId: "s3",
      estimatedArrival: "",
      estimatedDeparture: "",
      haltDuration: 0,
      dayOffset: 0,
      stopBehavior: "DROPPING_ONLY",
    },
  ];

  const result = generateSmartTimingsFromOrigin({
    originDeparture12h: "07:00 AM",
    stops: mockStops,
    currentTimings,
  });

  assert.equal(result.length, 3);

  // Stop 1: Origin
  assert.equal(result[0].stopId, "s1");
  assert.equal(result[0].estimatedDeparture, "07:00 AM");
  assert.equal(result[0].estimatedArrival, "");
  assert.equal(result[0].stopBehavior, "BOARDING_ONLY");

  // Stop 2: Malekhu (2 hrs after origin = 09:00 AM, halt 30 min -> departs 09:30 AM)
  assert.equal(result[1].stopId, "s2");
  assert.equal(result[1].estimatedArrival, "09:00 AM");
  assert.equal(result[1].haltDuration, 30);
  assert.equal(result[1].estimatedDeparture, "09:30 AM");
  assert.equal(result[1].stopBehavior, "REST_STOP");

  // Stop 3: Pokhara (6 hrs travel + 30 min accumulated halt = 6h 30m from 07:00 AM = 01:30 PM)
  assert.equal(result[2].stopId, "s3");
  assert.equal(result[2].estimatedArrival, "01:30 PM");
  assert.equal(result[2].estimatedDeparture, "");
  assert.equal(result[2].stopBehavior, "DROPPING_ONLY");
});

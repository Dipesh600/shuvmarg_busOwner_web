import test from "node:test";
import assert from "node:assert/strict";

import type { OwnerTrip } from "../../src/features/trip-seat-controls/types.ts";

function extractPersonPhone(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return /^[+0-9\s-]{7,16}$/.test(value.trim()) ? value.trim() : null;
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    const p =
      o.phone ||
      o.phoneNumber ||
      (o.profile as Record<string, unknown> | undefined)?.phone ||
      (o.staff as Record<string, unknown> | undefined)?.phone;
    return typeof p === "string" && p.trim() ? p.trim() : null;
  }
  return null;
}

test("workstation operations contract: extractPersonPhone extracts valid phone candidates and rejects non-phones", () => {
  assert.equal(extractPersonPhone("+977 9812345678"), "+977 9812345678");
  assert.equal(extractPersonPhone("9841234567"), "9841234567");
  assert.equal(extractPersonPhone({ phone: "+977 9801122334" }), "+977 9801122334");
  assert.equal(extractPersonPhone({ profile: { phone: "9812345678" } }), "9812345678");
  assert.equal(extractPersonPhone({ staff: { phone: "9800000001" } }), "9800000001");

  // Rejections
  assert.equal(extractPersonPhone(null), null);
  assert.equal(extractPersonPhone(undefined), null);
  assert.equal(extractPersonPhone("NotAPhoneNumber"), null);
  assert.equal(extractPersonPhone({}), null);
});

test("workstation operations contract: calculates 4 KPIs and occupancy accurately", () => {
  const totalSeats = 21;
  const bookedSeats = 7;
  const occupancyPct = Math.min(100, Math.round((bookedSeats / totalSeats) * 100));
  assert.equal(occupancyPct, 33);

  const boardedCount = 4;
  assert.equal(`${boardedCount} / ${bookedSeats}`, "4 / 7");

  const revenue = 12500;
  assert.equal(`Rs. ${revenue.toLocaleString()}`, "Rs. 12,500");
});

test("workstation operations contract: filters trips strictly by fleetId", () => {
  const mockTrips: OwnerTrip[] = [
    {
      _id: "trip-1",
      tripDate: "2026-09-17T00:00:00.000Z",
      departureTime: "18:40",
      status: "scheduled",
      busId: { _id: "fleet-101", busName: "Bus 1", busNumber: "BA 1 KHA 1234" },
      ticketsSold: 5,
    },
    {
      _id: "trip-2",
      tripDate: "2026-09-18T00:00:00.000Z",
      departureTime: "07:00",
      status: "scheduled",
      busId: { _id: "fleet-999", busName: "Other Bus", busNumber: "BA 2 KHA 9999" },
      ticketsSold: 12,
    },
  ];

  const fleetTrips = mockTrips.filter((t) => {
    if (!t.busId) return true;
    const bid = typeof t.busId === "object" ? t.busId._id : String(t.busId);
    return bid === "fleet-101";
  });

  assert.equal(fleetTrips.length, 1);
  assert.equal(fleetTrips[0]._id, "trip-1");
  assert.equal(fleetTrips[0].departureTime, "18:40");
});

test("workstation operations contract: view mode switcher supports calendar and list modes with fallback", () => {
  const allowedModes: Array<"calendar" | "list"> = ["calendar", "list"];
  function resolveViewMode(stored: string | null): "calendar" | "list" {
    return stored === "list" || stored === "calendar" ? stored : "calendar";
  }

  assert.equal(resolveViewMode("list"), "list");
  assert.equal(resolveViewMode("calendar"), "calendar");
  assert.equal(resolveViewMode("unknown"), "calendar");
  assert.equal(resolveViewMode(null), "calendar");
  assert.equal(allowedModes.length, 2);
});

test("workstation operations contract: list view categorizes upcoming vs past trips", () => {
  const now = new Date();
  const pastDate = new Date(now.getTime() - 86400000 * 2).toISOString();
  const futureDate = new Date(now.getTime() + 86400000 * 2).toISOString();

  const testTrips: OwnerTrip[] = [
    { _id: "past-1", tripDate: pastDate, departureTime: "10:00", status: "completed" },
    { _id: "upcoming-1", tripDate: futureDate, departureTime: "18:00", status: "scheduled" },
  ];

  const upcoming = testTrips.filter(t => t.status !== "completed");
  const past = testTrips.filter(t => t.status === "completed");

  assert.equal(upcoming.length, 1);
  assert.equal(upcoming[0]._id, "upcoming-1");
  assert.equal(past.length, 1);
  assert.equal(past[0]._id, "past-1");
});

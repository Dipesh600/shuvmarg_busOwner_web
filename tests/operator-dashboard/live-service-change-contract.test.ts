import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("operator uses the same scoped live-service workflow as admin", () => {
  const modal = read("src/components/operator-dashboard/LiveServiceChangeModal.tsx");
  const api = read("src/features/operator-dashboard/schedule-plan-api.ts");
  const page = read("src/app/dashboard/trips/page.tsx");

  for (const type of [
    "CHANGE_ROUTE", "CHANGE_STOPS", "CHANGE_OUTBOUND_TIMING", "CHANGE_RETURN_TIMING",
    "CHANGE_FARE", "CHANGE_AVAILABLE_SEATS", "CHANGE_DRIVER", "CHANGE_CONDUCTOR",
    "CHANGE_OPERATING_DAYS", "CHANGE_BOOKING_CUTOFF", "SUSPEND_SERVICE", "CANCEL_SERVICE",
  ]) assert.match(modal, new RegExp(type));
  assert.match(modal, /This trip only/);
  assert.match(modal, /Selected dates/);
  assert.match(modal, /All future trips from a date/);
  assert.match(modal, /Preview impact/);
  assert.match(modal, /Passengers must be notified/);
  assert.match(modal, /Passenger impact/);
  assert.match(modal, /Departure moves/);
  assert.match(modal, /Existing passengers keep the fare they paid/);
  assert.match(modal, /Refund or rebooking support is required/);
  assert.match(modal, /confirmPassengerResolution/);
  assert.match(modal, /Passenger follow-up/);
  assert.match(modal, /Recent change history/);
  assert.match(api, /operational-changes\/preview/);
  assert.match(api, /operational-changes\/apply/);
  assert.match(api, /listFleetOperationalChanges/);
  assert.match(page, /Manage live service/);
  assert.match(page, /These values are read-only here/);
});

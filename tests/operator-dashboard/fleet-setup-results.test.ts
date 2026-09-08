import test from "node:test";
import assert from "node:assert/strict";
import { collectFleetSetupResults } from "../../src/features/operator-dashboard/fleet-setup-results.ts";

test("one unavailable bus setup does not blank the dashboard", () => {
  const values = collectFleetSetupResults([
    { status: "fulfilled", value: { fleetId: "fleet-1" } },
    { status: "rejected", reason: new Error("HTTP 500") },
  ]);
  assert.deepEqual(values, [{ fleetId: "fleet-1" }]);
});

test("setup status still fails closed when authentication expires", () => {
  assert.throws(
    () => collectFleetSetupResults([
      { status: "rejected", reason: new Error("UNAUTHORIZED") },
    ]),
    /UNAUTHORIZED/,
  );
});

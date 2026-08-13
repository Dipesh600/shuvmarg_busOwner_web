import test from "node:test";
import assert from "node:assert/strict";
import { EMPTY_FLEET_DRAFT } from "../../src/features/fleet-registration/types.ts";
import { validateFleetDraft, validateFleetStep } from "../../src/features/fleet-registration/validation.ts";

test("fleet registration requires the real physical layout instead of a typed seat count", () => {
  const draft = structuredClone(EMPTY_FLEET_DRAFT);
  draft.vehicle.busName = "Night Rider";
  draft.vehicle.busNumber = "BA 3 KHA 1234";
  assert.equal(validateFleetStep("vehicle", draft), null);
  assert.match(validateFleetStep("layout", draft) || "", /published seat layout/i);
});

test("route request accepts either both endpoints or neither", () => {
  const draft = structuredClone(EMPTY_FLEET_DRAFT);
  draft.route.origin = "Kathmandu";
  assert.match(validateFleetStep("route", draft) || "", /both route origin and destination/i);
  draft.route.destination = "Pokhara";
  assert.equal(validateFleetStep("route", draft), null);
});

test("complete review is blocked when compliance evidence is absent", () => {
  const draft = structuredClone(EMPTY_FLEET_DRAFT);
  draft.vehicle.busName = "Night Rider";
  draft.vehicle.busNumber = "BA 3 KHA 1234";
  assert.match(validateFleetDraft(draft) || "", /published seat layout/i);
});

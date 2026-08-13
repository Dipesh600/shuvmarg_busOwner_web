import test from "node:test";
import assert from "node:assert/strict";
import { EMPTY_FLEET_DRAFT } from "../../src/features/fleet-registration/types.ts";

test("fleet registration draft structure keeps files separate from resumable data", () => {
  const draft = structuredClone(EMPTY_FLEET_DRAFT);
  draft.vehicle.busName = "Himalayan Express";
  draft.route.origin = "Kathmandu";
  const { files, ...resumable } = draft;
  assert.equal(resumable.vehicle.busName, "Himalayan Express");
  assert.equal(resumable.route.origin, "Kathmandu");
  assert.ok(files.photos.front === null);
  assert.equal("files" in resumable, false);
});

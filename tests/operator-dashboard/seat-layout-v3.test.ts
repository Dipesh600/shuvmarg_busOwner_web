import test from "node:test";
import assert from "node:assert/strict";
import { applyTool, passengerPlaces, updateElement } from "../../src/features/seat-layout-v3/layout.ts";
import { layoutPresets } from "../../src/features/seat-layout-v3/presets.ts";

test("double-level starter shows independent lower seats and upper berths", () => {
  const layout = layoutPresets.find((preset) => preset.id === "lower-upper")!.create();
  assert.equal(layout.sections.length, 2);
  assert.ok(layout.sections[0].elements.every((element) => element.kind === "SEAT"));
  assert.ok(layout.sections[1].elements.every((element) => element.kind === "BERTH"));
  assert.ok(layout.sections[1].elements.every((element) => element.size.height === 2));
});

test("builder operations are immutable and berths occupy two grid rows", () => {
  const original = layoutPresets[0].create();
  const next = applyTool(original, "lower", 2, 0, "BERTH");
  assert.notEqual(next, original);
  assert.equal(passengerPlaces(original).length, 32);
  const berth = passengerPlaces(next).find((element) => element.kind === "BERTH");
  assert.equal(berth?.size.height, 2);
});

test("passenger labels can change without mutating source revision", () => {
  const original = layoutPresets[1].create();
  const id = passengerPlaces(original)[0].elementId;
  const next = updateElement(original, id, { label: "VIP1" });
  assert.notEqual(passengerPlaces(original)[0].label, "VIP1");
  assert.equal(passengerPlaces(next)[0].label, "VIP1");
});

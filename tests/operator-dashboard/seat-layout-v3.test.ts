import test from "node:test";
import assert from "node:assert/strict";
import {
  applyTool,
  duplicatePassengerRow,
  hasPassengerLabel,
  insertPassengerSeatRow,
  insertPassengerSleeperRow,
  moveElement,
  passengerPlaces,
  removeElements,
  removePassengerRow,
  renumberPassengerPlaces,
  updateElement,
  updateElements,
  updatePassengerAttributes,
} from "../../src/features/seat-layout-v3/layout.ts";
import { layoutPresets } from "../../src/features/seat-layout-v3/presets.ts";
import { deduplicateLayoutFamilies } from "../../src/features/seat-layout-v3/library.ts";
import { defaultGuidedLayoutConfig, generateGuidedLayout } from "../../src/features/seat-layout-v3/generator.ts";

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

test("operator adoption replaces its platform source in the reusable library", () => {
  const platform = { id: "platform-1", sourceTemplateId: null, scope: "PLATFORM" };
  const adopted = { id: "operator-1", sourceTemplateId: "platform-1", scope: "OPERATOR" };
  const result = deduplicateLayoutFamilies([adopted, platform] as never[]);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "operator-1");
});

test("guided builder creates a familiar single-level 2 + 2 bus", () => {
  const layout = generateGuidedLayout(defaultGuidedLayoutConfig("BUS"));
  assert.equal(layout.sections.length, 1);
  assert.equal(passengerPlaces(layout).length, 32);
  assert.ok(passengerPlaces(layout).every((place) => place.kind === "SEAT"));
});

test("guided double-level bus keeps upper deck sleeper-only", () => {
  const layout = generateGuidedLayout({
    ...defaultGuidedLayoutConfig("BUS"), arrangement: "LOWER_SEATS_UPPER_SLEEPERS", upperBerthRows: 3,
  });
  assert.equal(layout.sections.length, 2);
  assert.equal(layout.sections[1].role, "UPPER_BERTH_LEVEL");
  assert.equal(layout.sections[1].elements.length, 6);
  assert.ok(layout.sections[1].elements.every((place) => place.kind === "BERTH" && place.size.height === 2));
});

test("automatic numbering uses independent lower-seat and upper-berth labels", () => {
  const layout = generateGuidedLayout({ ...defaultGuidedLayoutConfig("BUS"), arrangement: "LOWER_SEATS_UPPER_SLEEPERS" });
  const numbered = renumberPassengerPlaces(layout);
  assert.equal(numbered.sections[0].elements[0].label, "S1");
  assert.equal(numbered.sections[1].elements[0].label, "U1");
});

test("row duplication and removal preserve geometry and unique labels", () => {
  const original = generateGuidedLayout(defaultGuidedLayoutConfig("BUS"));
  const duplicated = duplicatePassengerRow(original, "lower", 0);
  assert.equal(passengerPlaces(duplicated).length, passengerPlaces(original).length + 4);
  assert.equal(duplicated.sections[0].heightUnits, original.sections[0].heightUnits + 1);
  assert.equal(new Set(passengerPlaces(duplicated).map((place) => place.label)).size, passengerPlaces(duplicated).length);
  const restored = removePassengerRow(duplicated, "lower", 1);
  assert.equal(passengerPlaces(restored).length, passengerPlaces(original).length);
});

test("passenger label conflict detection is case insensitive", () => {
  const layout = generateGuidedLayout(defaultGuidedLayoutConfig("BUS"));
  assert.equal(hasPassengerLabel(layout, " s1 "), true);
  assert.equal(hasPassengerLabel(layout, "S1", "S-1"), false);
});

test("drag movement rejects overlap and accepts a free cell", () => {
  const original = generateGuidedLayout(defaultGuidedLayoutConfig("BUS"));
  assert.equal(moveElement(original, "lower", "S-1", 1, 0), original);
  const moved = moveElement(original, "lower", "S-1", 2, 0);
  assert.notEqual(moved, original);
  assert.deepEqual(passengerPlaces(moved).find((place) => place.elementId === "S-1")?.position, { x: 2, y: 0 });
});

test("bulk updates and removal affect only selected passenger places", () => {
  const original = generateGuidedLayout(defaultGuidedLayoutConfig("BUS"));
  const updated = updateElements(original, ["S-1", "S-2"], { attributes: { comfort: "RECLINING", commercialClass: "PREMIUM", accessible: false } });
  assert.equal(passengerPlaces(updated).find((place) => place.elementId === "S-1")?.attributes?.commercialClass, "PREMIUM");
  assert.equal(passengerPlaces(updated).find((place) => place.elementId === "S-3")?.attributes?.commercialClass, "STANDARD");
  const removed = removeElements(updated, ["S-1", "S-2"]);
  assert.equal(passengerPlaces(removed).length, passengerPlaces(original).length - 2);
  const accessible = updatePassengerAttributes(original, ["S-1", "S-2"], { accessible: true });
  assert.equal(passengerPlaces(accessible).find((place) => place.elementId === "S-1")?.attributes?.commercialClass, "STANDARD");
  assert.equal(passengerPlaces(accessible).find((place) => place.elementId === "S-1")?.attributes?.accessible, true);
});

test("insertPassengerSeatRow inserts seats in front section and pushes rear sleepers back", () => {
  const base = generateGuidedLayout({
    ...defaultGuidedLayoutConfig("BUS"),
    lowerRows: 4,
  });
  const mixed = insertPassengerSleeperRow(base, "lower");
  const initialSeatCount = passengerPlaces(mixed).filter((p) => p.kind === "SEAT").length;
  const initialBerthCount = passengerPlaces(mixed).filter((p) => p.kind === "BERTH").length;
  const initialHeight = mixed.sections[0].heightUnits;

  const withAddedSeatRow = insertPassengerSeatRow(mixed, "lower");
  const newSeatCount = passengerPlaces(withAddedSeatRow).filter((p) => p.kind === "SEAT").length;
  const newBerthCount = passengerPlaces(withAddedSeatRow).filter((p) => p.kind === "BERTH").length;

  assert.equal(newSeatCount, initialSeatCount + 4);
  assert.equal(newBerthCount, initialBerthCount);
  assert.equal(withAddedSeatRow.sections[0].heightUnits, initialHeight + 1);

  // Verify that all sleeper berths remain behind the seat zone
  const maxSeatY = Math.max(...passengerPlaces(withAddedSeatRow).filter((p) => p.kind === "SEAT").map((p) => p.position.y));
  const minBerthY = Math.min(...passengerPlaces(withAddedSeatRow).filter((p) => p.kind === "BERTH").map((p) => p.position.y));
  assert.ok(minBerthY > maxSeatY, "Sleeper berths must remain behind the upright seat zone");
});

test("insertPassengerSleeperRow appends 2-unit berths in rear sleeper section", () => {
  const base = generateGuidedLayout({
    ...defaultGuidedLayoutConfig("BUS"),
    lowerRows: 4,
  });
  const initialBerthCount = passengerPlaces(base).filter((p) => p.kind === "BERTH").length;
  const initialHeight = base.sections[0].heightUnits;

  const withAddedSleeper = insertPassengerSleeperRow(base, "lower");
  const newBerthCount = passengerPlaces(withAddedSleeper).filter((p) => p.kind === "BERTH").length;

  assert.ok(newBerthCount > initialBerthCount);
  assert.equal(withAddedSleeper.sections[0].heightUnits, initialHeight + 2);
});

test("adding rows intelligently adapts and preserves active numbering scheme", () => {
  // Test Side A / Side B adaptation
  const baseLayout = generateGuidedLayout(defaultGuidedLayoutConfig("BUS"));
  const sideABLayout = renumberPassengerPlaces(baseLayout, "SIDE_AB");
  assert.ok(passengerPlaces(sideABLayout).some((p) => p.label?.startsWith("A")));
  assert.ok(passengerPlaces(sideABLayout).some((p) => p.label?.startsWith("B")));

  const withNewRowAB = insertPassengerSeatRow(sideABLayout, "lower");
  // Check that new seats continue with Side A and Side B labels rather than resetting to S1..
  const newLabelsAB = passengerPlaces(withNewRowAB).map((p) => p.label);
  assert.ok(newLabelsAB.every((label) => /^[AB]\d+$/.test(label || "")), "All labels must maintain A1.. / B1.. series");

  // Test Ka / Kha adaptation
  const kaKhaLayout = renumberPassengerPlaces(baseLayout, "SIDE_KHA");
  const withNewRowKaKha = insertPassengerSeatRow(kaKhaLayout, "lower");
  const newLabelsKaKha = passengerPlaces(withNewRowKaKha).map((p) => p.label);
  assert.ok(newLabelsKaKha.every((label) => /^(Ka|Kha)\d+$/.test(label || "")), "All labels must maintain Ka.. / Kha.. series");

  // Test Numeric Only adaptation
  const numericLayout = renumberPassengerPlaces(baseLayout, "NUMERIC_ONLY");
  const withNewRowNumeric = insertPassengerSeatRow(numericLayout, "lower");
  const newLabelsNumeric = passengerPlaces(withNewRowNumeric).map((p) => p.label);
  assert.ok(newLabelsNumeric.every((label) => /^\d+$/.test(label || "")), "All labels must maintain pure numbers 1, 2, 3..");
});


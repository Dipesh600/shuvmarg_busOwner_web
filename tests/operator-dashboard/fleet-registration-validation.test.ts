import test from "node:test";
import assert from "node:assert/strict";
import { EMPTY_FLEET_DRAFT } from "../../src/features/fleet-registration/types.ts";
import { validateFleetCorrectionDraft, validateFleetDraft, validateFleetStep } from "../../src/features/fleet-registration/validation.ts";

function createValidDraft() {
  const draft = structuredClone(EMPTY_FLEET_DRAFT);
  draft.vehicle.brandId = "brand-123";
  draft.vehicle.busName = "Night Rider";
  draft.vehicle.busNumber = "BA 3 KHA 1234";
  draft.vehicle.registrationYear = "2024";
  return draft;
}

test("fleet registration requires the real physical layout instead of a typed seat count", () => {
  const draft = createValidDraft();
  assert.equal(validateFleetStep("vehicle", draft), null);
  assert.match(validateFleetStep("layout", draft) || "", /published seat layout/i);
});

test("vehicle validation accepts a numeric registration year returned by the backend", () => {
  const draft = createValidDraft();
  (draft.vehicle as { registrationYear: string | number }).registrationYear = 2024;
  assert.equal(validateFleetStep("vehicle", draft), null);
});

test("route step requires both origin and destination endpoints", () => {
  const draft = createValidDraft();
  draft.route.originStop = {
    id: "stop-1",
    name: "Kathmandu",
    code: "KTM",
    parentStop: null,
    district: "Kathmandu",
    municipality: "KMC",
    province: "Bagmati",
    isRouteStop: true,
    coordinates: { lat: 27.7, lng: 85.3 },
  };
  assert.match(validateFleetStep("route", draft) || "", /where this bus starts and ends/i);

  draft.route.destinationStop = {
    id: "stop-2",
    name: "Pokhara",
    code: "PKR",
    parentStop: null,
    district: "Kaski",
    municipality: "PMC",
    province: "Gandaki",
    isRouteStop: true,
    coordinates: { lat: 28.2, lng: 83.9 },
  };
  draft.route.resolutionStatus = "NEEDS_PLATFORM_REVIEW";
  assert.equal(validateFleetStep("route", draft), null);
});

test("route step accepts custom unlisted endpoints", () => {
  const draft = createValidDraft();
  draft.route.originStop = {
    id: "custom-1",
    name: "Bhaise Bazar",
    code: null,
    parentStop: null,
    district: null,
    municipality: null,
    province: null,
    isRouteStop: true,
    coordinates: null,
    isCustom: true,
  };
  draft.route.destinationStop = {
    id: "custom-2",
    name: "Tamghas",
    code: null,
    parentStop: null,
    district: null,
    municipality: null,
    province: null,
    isRouteStop: true,
    coordinates: null,
    isCustom: true,
  };
  draft.route.resolutionStatus = "NEEDS_PLATFORM_REVIEW";
  assert.equal(validateFleetStep("route", draft), null);
});

test("complete review is blocked when compliance evidence or layout is absent", () => {
  const draft = createValidDraft();
  assert.match(validateFleetDraft(draft) || "", /published seat layout/i);
});

test("correction validation does not demand approved photos or unrelated documents", () => {
  const draft = createValidDraft();
  draft.files.insurance = new Blob(["corrected"], { type: "image/png" }) as File;
  draft.documents.insurancePolicyNumber = "POL-1002";
  draft.documents.insuranceValidTill = "2099-12-31";
  assert.equal(validateFleetCorrectionDraft(draft, ["insurance"]), null);
});

test("a rejected photo set requires four actual replacements", () => {
  const draft = createValidDraft();
  assert.match(validateFleetCorrectionDraft(draft, ["fleetImages"]) || "", /replace all four/i);
});

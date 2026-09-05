import test from "node:test";
import assert from "node:assert/strict";

import {
  buildFleetLifecycleStory,
  getFleetRouteText,
} from "../../src/features/operator-dashboard/fleet-lifecycle-story.ts";
import type {
  AssignedRouteSummary,
  OperatorFleetSetupStatus,
} from "../../src/features/operator-dashboard/operator-dashboard-contract.ts";

const assignedRoute: AssignedRouteSummary = {
  corridorId: "corridor-1",
  code: "KTM-MLN",
  origin: "Kathmandu",
  destination: "Malangawa",
  label: "Kathmandu to Malangawa",
};

const setup: OperatorFleetSetupStatus = {
  fleetId: "fleet-1",
  brandId: "brand-1",
  busName: "Night Express",
  busNumber: "BA 1 KHA 1000",
  approvalStatus: "APPROVED",
  setupComplete: false,
  nextStep: "routeConfigured",
  isFullyOperational: false,
  steps: {
    routeAssigned: true,
    routeConfigured: false,
    driverAssigned: false,
    scheduleCreated: false,
    activated: false,
  },
  stepDetails: [
    { key: "routeAssigned", label: "Route approved", complete: true },
    { key: "routeConfigured", label: "Stops & timings", complete: false },
    { key: "driverAssigned", label: "Driver", complete: false },
    { key: "scheduleCreated", label: "Trip schedule", complete: false },
    { key: "activated", label: "Start selling tickets", complete: false },
  ],
  progress: { completedSteps: 1, totalSteps: 5, percentage: 20 },
  blockingReasons: ["Stops & timings incomplete"],
  assignedRoute,
};

test("fleet lifecycle story keeps approved fleet route and operations state connected", () => {
  const story = buildFleetLifecycleStory({
    fleetId: "fleet-1",
    busName: "Night Express",
    busNumber: "BA 1 KHA 1000",
    approvalStatus: "APPROVED",
    rejectionReason: null,
    setupComplete: false,
  }, setup);

  assert.equal(story.label, "Approved");
  assert.equal(story.needsOperationsSetup, true);
  assert.equal(story.routeText, "Kathmandu → Malangawa");
  assert.equal(story.routeCode, "KTM-MLN");
  assert.equal(story.nextStepLabel, "Choose stops & timings");
  assert.equal(story.progressText, "1 of 5 setup steps done");
  assert.equal(story.primaryActionLabel, "Get bus ready");
});

test("fleet lifecycle story never invents route names", () => {
  assert.equal(getFleetRouteText(null), null);
  assert.equal(getFleetRouteText({ ...assignedRoute, origin: null }), "Kathmandu to Malangawa");
  assert.equal(getFleetRouteText({ ...assignedRoute, origin: null, destination: null, label: null }), "KTM-MLN");
});

test("fleet lifecycle story keeps review and correction copy distinct", () => {
  const pending = buildFleetLifecycleStory({
    fleetId: "fleet-2",
    busName: "Pending Bus",
    busNumber: "BA 1 KHA 1001",
    approvalStatus: "PENDING",
    rejectionReason: null,
  });
  assert.equal(pending.label, "In review");
  assert.equal(pending.previewLocked, true);
  assert.equal(pending.primaryActionLabel, "Preview submission");

  const rejected = buildFleetLifecycleStory({
    fleetId: "fleet-3",
    busName: "Rejected Bus",
    busNumber: "BA 1 KHA 1002",
    approvalStatus: "REJECTED",
    rejectionReason: "Insurance is expired.",
  });
  assert.equal(rejected.label, "Needs changes");
  assert.equal(rejected.previewLocked, false);
  assert.equal(rejected.primaryActionLabel, "Correct");
  assert.equal(rejected.description, "Insurance is expired.");
});

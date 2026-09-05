import test from "node:test";
import assert from "node:assert/strict";
import { getFleetSetupProgress } from "../../src/features/fleet-registration/fleet-setup-progress.ts";

test("draft fleet progress remains available before business approval", () => {
  const progress = getFleetSetupProgress({
    approvalStatus: "DRAFT",
    documentSummary: { totalSlots: 4, present: 4, missing: 0 },
  }, false);
  assert.equal(progress.percentage, 80);
  assert.match(progress.label, /waiting for business approval/i);
  assert.equal(progress.isDraft, true);
});

test("prepared drafts become submittable after business approval", () => {
  const progress = getFleetSetupProgress({
    approvalStatus: "DRAFT",
    documentSummary: { totalSlots: 4, present: 4, missing: 0 },
  }, true);
  assert.equal(progress.actionLabel, "Submit for review");
});

test("each fleet lifecycle status has an independent progress state", () => {
  assert.equal(getFleetSetupProgress({ approvalStatus: "PENDING" }, true).label, "Submitted for review");
  assert.equal(getFleetSetupProgress({ approvalStatus: "REJECTED" }, true).label, "Changes requested");
  const approved = getFleetSetupProgress({ approvalStatus: "APPROVED", setupComplete: false }, true);
  assert.equal(approved.percentage, 90);
  assert.equal(approved.label, "Approved — finish setup");

  const live = getFleetSetupProgress({ approvalStatus: "APPROVED", setupComplete: true }, true);
  assert.equal(live.percentage, 100);
  assert.equal(live.label, "Ready for passengers");
});

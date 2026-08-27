import test from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_ASSIGNMENT_DRAFT,
  assignmentDraftsForBrands,
  assignmentPayload,
  validateAssignmentDraft,
} from "../../src/features/agent-assignment/agent-assignment-contract.ts";

const valid = () => ({
  ...structuredClone(EMPTY_ASSIGNMENT_DRAFT),
  agentCode: "SM-AG-ABCDE12",
  brandId: "507f1f77bcf86cd799439011",
});

test("unused narrowing lists are stripped instead of accidentally widening access", () => {
  const draft = valid();
  draft.allowedRouteIds = ["hostile-route"];
  draft.allowedScheduleIds = ["hostile-schedule"];
  const payload = assignmentPayload(draft);
  assert.deepEqual(payload.allowedRouteIds, []);
  assert.deepEqual(payload.allowedScheduleIds, []);
});

test("route and schedule scopes fail closed without an explicit selection", () => {
  const route = valid();
  route.accessScope = "ROUTES";
  assert.match(validateAssignmentDraft(route) || "", /at least one route/i);
  route.allowedRouteIds = ["variant-id"];
  assert.equal(validateAssignmentDraft(route), null);

  const schedule = valid();
  schedule.accessScope = "SCHEDULES";
  assert.match(validateAssignmentDraft(schedule) || "", /at least one schedule/i);
});

test("cash terms preserve null as uncapped and validate numeric bounds", () => {
  const draft = valid();
  assert.equal(assignmentPayload(draft).permissions.maxSeatsPerBooking, null);
  draft.maxSeatsPerBooking = "0";
  assert.match(validateAssignmentDraft(draft) || "", /greater than zero/i);
  draft.maxSeatsPerBooking = "2";
  draft.maxDiscountPct = "101";
  assert.match(validateAssignmentDraft(draft) || "", /100%/i);
});

test("cancellation window is zeroed when cancellation permission is off", () => {
  const draft = valid();
  draft.canCancel = false;
  draft.cancelWindowMins = "120";
  assert.equal(assignmentPayload(draft).permissions.cancelWindowMins, 0);
});

test("multiple brands create one fail-closed all-bus invitation per unique brand", () => {
  const draft = valid();
  draft.accessScope = "ROUTES";
  draft.allowedRouteIds = ["variant-from-one-brand"];
  const invitations = assignmentDraftsForBrands(draft, ["brand-a", "brand-b", "brand-a"]);
  assert.deepEqual(invitations.map((item) => item.brandId), ["brand-a", "brand-b"]);
  for (const invitation of invitations) {
    assert.equal(invitation.accessScope, "ALL_BUSES");
    assert.deepEqual(invitation.allowedRouteIds, []);
    assert.deepEqual(invitation.allowedScheduleIds, []);
  }
});

test("no selected brand creates no assignment invitation", () => {
  assert.deepEqual(assignmentDraftsForBrands(valid(), []), []);
});

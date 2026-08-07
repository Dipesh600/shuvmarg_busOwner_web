import test from "node:test";
import assert from "node:assert/strict";

import {
  determineNextAction,
  COMPATIBILITY_ONBOARDING_ROUTE,
} from "../../src/features/operator-dashboard/next-action.ts";

test("next-action mapping rules (Operator Dashboard)", async (t) => {
  await t.test(
    "missing KYC returns 'Complete business verification' action enabled",
    () => {
      const action = determineNextAction({ verificationStatus: "not_submitted" });
      assert.equal(action.label, "Complete business verification");
      assert.equal(action.disabled, false);
      assert.equal(action.href, COMPATIBILITY_ONBOARDING_ROUTE);
      assert.equal(action.badge, "Action required");
    }
  );

  await t.test(
    "pending KYC returns 'Business verification is under review' disabled action",
    () => {
      const action = determineNextAction({ verificationStatus: "pending" });
      assert.equal(action.label, "Business verification is under review");
      assert.equal(action.disabled, true);
      assert.equal(action.href, null);
      assert.equal(action.badge, "Under review");
    }
  );

  await t.test(
    "rejected KYC returns 'Review and resubmit business verification' enabled action",
    () => {
      const action = determineNextAction({ verificationStatus: "rejected" });
      assert.equal(action.label, "Review and resubmit business verification");
      assert.equal(action.disabled, false);
      assert.equal(action.href, COMPATIBILITY_ONBOARDING_ROUTE);
      assert.equal(action.badge, "Changes required");
    }
  );

  await t.test(
    "approved KYC returns 'Prepare your first vehicle' disabled upcoming step",
    () => {
      const action = determineNextAction({ verificationStatus: "approved" });
      assert.equal(action.label, "Prepare your first vehicle");
      assert.equal(action.disabled, true);
      assert.equal(action.href, null);
      assert.equal(action.badge, "Upcoming step");
      assert.match(action.description, /next setup step/i);
    }
  );
});

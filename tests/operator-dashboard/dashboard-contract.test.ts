import test from "node:test";
import assert from "node:assert/strict";

import type { BusOwnerProfile } from "../../src/features/operator-dashboard/operator-dashboard-contract.ts";
import {
  hasUsableValue,
  normalizeVerificationStatus,
  deriveCapabilities,
  deriveSetupEvidence,
} from "../../src/features/operator-dashboard/operator-dashboard-contract.ts";

test("dashboard-contract normalization & evidence rules (Operator Dashboard)", async (t) => {
  await t.test("hasUsableValue excludes blank strings and 'N/A'", () => {
    assert.equal(hasUsableValue(""), false);
    assert.equal(hasUsableValue("   "), false);
    assert.equal(hasUsableValue("N/A"), false);
    assert.equal(hasUsableValue(" n/a "), false);
    assert.equal(hasUsableValue(null), false);
    assert.equal(hasUsableValue(undefined), false);

    assert.equal(hasUsableValue("Shuvmarg Travels"), true);
    assert.equal(hasUsableValue("Ram Owner"), true);
  });

  await t.test(
    "normalizeVerificationStatus correctly maps HTTP 404 to 'not_submitted'",
    () => {
      assert.equal(normalizeVerificationStatus(404, null), "not_submitted");
      assert.equal(normalizeVerificationStatus(404, "pending"), "not_submitted");
    }
  );

  await t.test(
    "normalizeVerificationStatus normalizes backend status values correctly",
    () => {
      assert.equal(normalizeVerificationStatus(200, "pending"), "pending");
      assert.equal(normalizeVerificationStatus(200, "UNDER_REVIEW"), "pending");
      assert.equal(normalizeVerificationStatus(200, "rejected"), "rejected");
      assert.equal(normalizeVerificationStatus(200, "CHANGES_REQUIRED"), "rejected");
      assert.equal(normalizeVerificationStatus(200, "approved"), "approved");
      assert.equal(normalizeVerificationStatus(200, "VERIFIED"), "approved");
      assert.equal(normalizeVerificationStatus(200, "unknown_status"), "not_submitted");
    }
  );

  await t.test(
    "deriveCapabilities locks routes, trips, bookings, finance appropriately",
    () => {
      const unapprovedCaps = deriveCapabilities("not_submitted");
      assert.equal(unapprovedCaps.canManageBusiness, true);
      assert.equal(unapprovedCaps.canPrepareFleet, true);
      assert.equal(unapprovedCaps.canManageRoutes, false);
      assert.equal(unapprovedCaps.canManageTrips, false);
      assert.equal(unapprovedCaps.canViewBookings, false);

      const approvedCaps = deriveCapabilities("approved");
      assert.equal(approvedCaps.canManageRoutes, true);
      assert.equal(approvedCaps.canManageTrips, false);
      assert.equal(approvedCaps.canViewBookings, false);
    }
  );

  await t.test(
    "deriveSetupEvidence conservatively checks business profile completeness without address assumption",
    () => {
      const profile: BusOwnerProfile = {
        ownerId: "owner_123",
        ownerCode: "BO-001",
        userId: "user_123",
        profile: {
          name: "Ram Owner",
          email: "ram@example.com",
          phone: "9811112222",
          profilePicture: null,
          status: "active",
        },
        business: {
          companyName: "Shuvmarg Travels",
        },
        bank: {
          present: false,
          bankName: null,
          accountNumber: null,
          accountHolderName: null,
          branchName: null,
          swiftCode: null,
        },
        verificationStatus: "pending",
        rejectionReason: null,
        createdAt: "2026-08-01T00:00:00Z",
        updatedAt: "2026-08-01T00:00:00Z",
      };

      const evidence = deriveSetupEvidence(profile, null, "pending");
      assert.equal(evidence.businessProfileComplete, true);
      assert.equal(evidence.settlementAccountPresent, false);
      assert.equal(evidence.businessVerificationStatus, "pending");
    }
  );
});

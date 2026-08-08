import test from "node:test";
import assert from "node:assert/strict";

import type { BusOwnerProfile } from "../../src/features/operator-dashboard/operator-dashboard-contract.ts";
import {
  hasUsableValue,
  normalizeVerificationStatus,
  deriveCapabilities,
  deriveSetupEvidence,
  isFirstLoginOverview,
  hasKycSubmissionEvidence,
  shouldFetchProtectedFleet,
} from "../../src/features/operator-dashboard/operator-dashboard-contract.ts";
import { normalizeKycStatusPayload } from "../../src/features/operator-dashboard/operator-dashboard-kyc-normalizer.ts";

test("dashboard-contract normalization & evidence rules (Operator Dashboard)", async (t) => {
  await t.test("protected fleet data is requested only after KYC approval", () => {
    assert.equal(shouldFetchProtectedFleet("not_submitted"), false);
    assert.equal(shouldFetchProtectedFleet("pending"), false);
    assert.equal(shouldFetchProtectedFleet("rejected"), false);
    assert.equal(shouldFetchProtectedFleet("approved"), true);
  });

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
          registeredAddress: null,
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

  await t.test(
    "setup overview remains until the first vehicle is approved",
    () => {
      assert.equal(
        isFirstLoginOverview({
          fleet: { items: [], totalItems: 0 },
        }),
        true
      );

      assert.equal(
        isFirstLoginOverview({
          fleet: { items: [], totalItems: 0 },
        }),
        true
      );

      assert.equal(
        isFirstLoginOverview({
          fleet: {
            totalItems: 1,
            items: [{
              fleetId: "fleet-1",
              fleetCode: "BUS-1",
              busName: "Mountain Express",
              busNumber: "BA 1 KHA 1000",
              approvalStatus: "APPROVED",
              rejectionReason: null,
              setupComplete: true,
              createdAt: null,
              updatedAt: null,
            }],
          },
        }),
        false
      );
    }
  );

  await t.test("KYC needs uploaded document evidence before pending is trusted", () => {
    assert.equal(
      hasKycSubmissionEvidence({
        ownerId: "owner_123",
        ownerCode: "BO-001",
        verificationStatus: "pending",
        rejectionReason: null,
        documents: [{ documentType: "companyRegistration", uploaded: false }],
        documentSummary: { totalRequired: 3, totalUploaded: 0, isComplete: false },
        createdAt: null,
        updatedAt: null,
      }),
      false
    );

    assert.equal(
      hasKycSubmissionEvidence({
        ownerId: "owner_123",
        ownerCode: "BO-001",
        verificationStatus: "pending",
        rejectionReason: null,
        documents: [{ documentType: "companyRegistration", uploaded: true }],
        documentSummary: { totalRequired: 3, totalUploaded: 1, isComplete: false },
        createdAt: null,
        updatedAt: null,
      }),
      true
    );
  });

  await t.test("flat submitted KYC response remains pending after dashboard normalization", () => {
    const status = normalizeKycStatusPayload({
      verificationStatus: "pending",
      companyRegistration: { fileCount: 1, available: true },
      taxRegistration: { fileCount: 1, available: true, panNumber: "123456789", registrationNumber: "REG-10" },
      transportLicense: { fileCount: 1, available: true },
      insuranceCertificates: [],
      updatedAt: "2026-08-08T00:00:00.000Z",
    });

    assert.ok(status);
    assert.equal(status.verificationStatus, "pending");
    assert.equal(status.documentSummary?.totalUploaded, 3);
    assert.equal(status.submittedDetails?.panNumber, "123456789");
    assert.equal(status.submittedDetails?.registrationNumber, "REG-10");
    assert.equal(hasKycSubmissionEvidence(status), true);
    assert.equal(status.documents?.find((document) =>
      document.documentType === "companyRegistration"
    )?.uploaded, true);
  });
});

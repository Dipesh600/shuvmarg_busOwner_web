import test from "node:test";
import assert from "node:assert/strict";

import type { SetupEvidence } from "../../src/features/operator-dashboard/operator-dashboard-contract.ts";
import { calculateSetupProgress } from "../../src/features/operator-dashboard/setup-progress.ts";

test("setup-progress calculation rules (Operator Dashboard)", async (t) => {
  await t.test(
    "calculates 25% for brand new account with incomplete profile, missing KYC, and no bank",
    () => {
      const evidence: SetupEvidence = {
        accountCreated: true,
        businessProfileComplete: false,
        businessVerificationStatus: "not_submitted",
        settlementAccountPresent: false,
        firstVehicleStatus: "unknown",
        fleetVerificationStatus: "unknown",
        operationalActivationStatus: "unknown",
      };

      const result = calculateSetupProgress(evidence);
      assert.equal(result.percentage, 25);
      assert.equal(result.completedItemsCount, 1);
      assert.equal(result.totalEvidenceItemsCount, 4);
    }
  );

  await t.test(
    "calculates 50% when business profile is complete but KYC is pending and no bank",
    () => {
      const evidence: SetupEvidence = {
        accountCreated: true,
        businessProfileComplete: true,
        businessVerificationStatus: "pending",
        settlementAccountPresent: false,
        firstVehicleStatus: "unknown",
        fleetVerificationStatus: "unknown",
        operationalActivationStatus: "unknown",
      };

      const result = calculateSetupProgress(evidence);
      assert.equal(result.percentage, 50);
      assert.equal(result.completedItemsCount, 2);
    }
  );

  await t.test(
    "calculates 75% when business verification is approved but settlement account is missing",
    () => {
      const evidence: SetupEvidence = {
        accountCreated: true,
        businessProfileComplete: true,
        businessVerificationStatus: "approved",
        settlementAccountPresent: false,
        firstVehicleStatus: "unknown",
        fleetVerificationStatus: "unknown",
        operationalActivationStatus: "unknown",
      };

      const result = calculateSetupProgress(evidence);
      assert.equal(result.percentage, 75);
      assert.equal(result.completedItemsCount, 3);
    }
  );

  await t.test(
    "calculates 100% for full business setup with approved KYC and settlement account",
    () => {
      const evidence: SetupEvidence = {
        accountCreated: true,
        businessProfileComplete: true,
        businessVerificationStatus: "approved",
        settlementAccountPresent: true,
        firstVehicleStatus: "unknown",
        fleetVerificationStatus: "unknown",
        operationalActivationStatus: "unknown",
      };

      const result = calculateSetupProgress(evidence);
      assert.equal(result.percentage, 100);
      assert.equal(result.completedItemsCount, 4);
    }
  );

  await t.test(
    "unverified future operational items are marked locked or not started and excluded from percentage",
    () => {
      const evidence: SetupEvidence = {
        accountCreated: true,
        businessProfileComplete: true,
        businessVerificationStatus: "approved",
        settlementAccountPresent: true,
        firstVehicleStatus: "unknown",
        fleetVerificationStatus: "unknown",
        operationalActivationStatus: "unknown",
      };

      const result = calculateSetupProgress(evidence);
      const vehicleItem = result.items.find((i) => i.id === "first_vehicle");
      const fleetItem = result.items.find((i) => i.id === "fleet_verification");
      const goLiveItem = result.items.find((i) => i.id === "operational_activation");

      assert.equal(vehicleItem?.status, "not_started");
      assert.equal(fleetItem?.status, "locked");
      assert.equal(goLiveItem?.status, "locked");
      assert.equal(vehicleItem?.isEvidenceBacked, false);
    }
  );
});

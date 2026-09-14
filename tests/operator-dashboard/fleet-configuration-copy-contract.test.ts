import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("fleet configuration copy appears only in stops and timings and previews allowed fields", () => {
  const routeModal = read("src/components/operator-dashboard/RouteServiceSetupModal.tsx");
  const scheduleModal = read("src/components/operator-dashboard/TripScheduleModal.tsx");
  const sellingModal = read("src/components/operator-dashboard/StartSellingTicketsModal.tsx");
  const copyModal = read("src/components/operator-dashboard/CopyFleetConfigurationModal.tsx");
  const api = read("src/features/operator-dashboard/fleet-copy-api.ts");

  // RouteServiceSetupModal: copy stops & timings banner at top
  assert.match(routeModal, /Copy Configuration Banner at Top/);
  assert.match(routeModal, /Copy stops & timings from/);
  assert.match(routeModal, /CopyFleetConfigurationModal/);

  // TripScheduleModal: trip schedule can NEVER be copied (strictly vehicle-specific)
  assert.doesNotMatch(scheduleModal, /CopyFleetConfigurationModal/);
  assert.doesNotMatch(scheduleModal, /Copy schedule from/i);

  // StartSellingTicketsModal: sales configuration can never be copied
  assert.doesNotMatch(sellingModal, /Copy Configuration Banner at Top/);
  assert.doesNotMatch(sellingModal, /CopyFleetConfigurationModal/);
  assert.doesNotMatch(sellingModal, /fleet-copy-api/);

  // Modal checks: preview before apply, peer selection when > 1 peers
  assert.match(copyModal, /Copy Stops & Timings/i);
  assert.match(copyModal, /Choose Source Vehicle to Copy From/i);
  assert.match(copyModal, /Journey Stops & Timings/i);
  assert.match(copyModal, /Outbound \(/i);
  assert.match(copyModal, /Return \(/i);
  assert.match(copyModal, /Apply stops & timings to/i);
  assert.match(copyModal, /Only route, stops and timings will be copied/i);
  assert.match(copyModal, /fare, available seats and booking state/i);
  assert.doesNotMatch(api, /fareOverride|recurrence|daysOfWeek|shift/);

  // API endpoints contract
  assert.match(api, /\/copyable-peers/);
  assert.match(api, /\/configuration-preview/);
  assert.match(api, /\/copy-configuration/);
  assert.match(api, /previewFingerprint/);
  assert.match(api, /sourceConfigurationId/);
});

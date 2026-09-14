import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("approved vehicle setup exposes rotatable driver and conductor assignments", () => {
  const setup = read("src/components/operator-dashboard/FirstFleetOperationsSetup.tsx");
  const modal = read("src/components/operator-dashboard/VehicleCrewAssignmentModal.tsx");
  const api = read("src/features/crew-management/api.ts");

  assert.match(setup, /driverAssigned/);
  assert.match(setup, /conductorAssigned/);
  assert.match(setup, /VehicleCrewAssignmentModal/);
  assert.match(setup, /CrewAssignmentDialog/);
  assert.match(setup, /initialMode="new"/);
  assert.match(modal, /Crew stays reusable across vehicles/);
  assert.match(modal, /onAddCrew/);
  assert.match(modal, /setActiveRole\("conductor"\)/);
  assert.match(modal, /Now choose the conductor/);
  assert.match(modal, /Next: Assign Conductor/);
  assert.match(modal, /Next: Trip Schedule/);
  assert.match(modal, /Already assigned to/);
  assert.match(modal, /Assigned to other bus/);
  assert.match(setup, /onAdvanceToNext/);
  assert.match(setup, /shuvmarg:operations-next/);
  assert.match(setup, /advanceToConductor/);
  assert.doesNotMatch(modal, /licenseNumber|licenseExpiry|licenseDoc|assignCrew/);
  assert.match(api, /\/fleets\/\$\{encodeURIComponent\(fleetId\)\}\/crew-options/);
  assert.match(api, /\/current-crew\/\$\{role\}/);
});

test("vehicle overview mirrors every setup update from the readiness checklist", () => {
  const setup = read("src/components/operator-dashboard/FirstFleetOperationsSetup.tsx");

  assert.match(setup, /Setup progress/);
  assert.match(setup, /setupSummary\.map/);
  assert.match(setup, /assignedName\(setup\.assignedDriver\)/);
  assert.match(setup, /assignedName\(setup\.assignedConductor\)/);
  assert.match(setup, /scheduleSummary\(setup\.outboundScheduleData\)/);
  assert.match(setup, /setup\.steps\.activated/);
  assert.match(setup, /Next action/);
  assert.doesNotMatch(setup, />\s*Not taking bookings yet\s*</);
});

test("trip schedule uses a guided flow and publishes only after a final review", () => {
  const setup = read("src/components/operator-dashboard/FirstFleetOperationsSetup.tsx");
  const schedule = read("src/components/operator-dashboard/TripScheduleModal.tsx");
  const publish = read("src/components/operator-dashboard/StartSellingTicketsModal.tsx");
  const api = read("src/features/operator-dashboard/schedule-plan-api.ts");

  assert.match(setup, /setScheduleOpen\(true\)/);
  assert.match(setup, /setPublishOpen\(true\)/);
  assert.match(setup, /window\.location\.reload\(\)/);
  assert.match(schedule, /type Step = "journey" \| "days" \| "return" \| "rules" \| "review"/);
  assert.match(schedule, /Choose the first journey/);
  assert.match(schedule, /Choose the running days/);
  assert.match(schedule, /Set the return journey/);
  assert.match(schedule, /Every bus schedule includes its paired return journey/);
  assert.doesNotMatch(schedule, /first journey only/i);
  assert.doesNotMatch(schedule, /No return journey|one way/i);
  assert.match(schedule, /returnMode: effectiveReturnMode/);
  assert.match(schedule, /returnTrip: \{/);
  assert.match(publish, /return missing/);
  assert.match(schedule, /Set booking rules/);
  assert.match(schedule, /Check the schedule/);
  assert.match(schedule, /Saving creates the schedule only/);
  assert.match(schedule, /scheduleErrorMessage/);
  assert.doesNotMatch(schedule, /type="time"/);
  assert.match(publish, /Open ticket sales/);
  assert.match(publish, /Start selling tickets/);
  assert.match(api, /schedule-plan\/publish/);
});

test("stops and timings capture independent outbound and return journeys", () => {
  const modal = read("src/components/operator-dashboard/RouteServiceSetupModal.tsx");
  const api = read("src/features/operator-dashboard/route-configuration-api.ts");

  assert.match(modal, /getReturnVariantStops/);
  assert.match(modal, /returnTimingConfig/);
  assert.match(modal, /setDirection\("outbound"\)/);
  assert.match(modal, /setDirection\("return"\)/);
  assert.match(modal, /Complete Two-way Timings/);
  assert.match(api, /return-stops/);
});

test("schedule recovery survives reopening and exposes explicit safe actions", () => {
  const setup = read("src/components/operator-dashboard/FirstFleetOperationsSetup.tsx");
  const modal = read("src/components/operator-dashboard/TripScheduleModal.tsx");
  const api = read("src/features/operator-dashboard/schedule-plan-api.ts");

  assert.match(api, /localStorage\.getItem/);
  assert.match(api, /schedule-plan\/recovery/);
  assert.match(modal, /Continue with saved/);
  assert.match(modal, /Review saved schedule/);
  assert.match(modal, /Create replacement/);
  assert.match(modal, /replaceServicePlanId/);
  assert.match(setup, /!setup\.steps\.activated/);
});

test("ticket publication is durable, retryable, and driven by backend state", () => {
  const setup = read("src/components/operator-dashboard/FirstFleetOperationsSetup.tsx");
  const modal = read("src/components/operator-dashboard/StartSellingTicketsModal.tsx");
  const api = read("src/features/operator-dashboard/schedule-plan-api.ts");

  assert.match(api, /persistentPublicationRequestId/);
  assert.match(api, /requestId: options\?\.requestId/);
  assert.match(modal, /setupPublication\.configuration/);
  assert.match(modal, /Use saved seats and fares/);
  assert.match(modal, /Retry saved publication/);
  assert.match(modal, /publication\.state === "PREPARING"/);
  assert.match(setup, /Attempt failed — safe to retry/);
  assert.match(setup, /Preparing — not live yet/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { EMPTY_FLEET_DRAFT } from "../../src/features/fleet-registration/types.ts";
import {
  generateDraftId,
  listFleetDrafts,
  saveFleetRegistrationDraft,
  deleteFleetRegistrationDraft,
  loadFleetRegistrationDraft,
  cleanupLockedServerFleetDrafts,
} from "../../src/features/fleet-registration/fleet-registration-draft-storage.ts";

test("fleet registration draft structure keeps files separate from resumable data", () => {
  const draft = structuredClone(EMPTY_FLEET_DRAFT);
  draft.vehicle.busName = "Himalayan Express";
  draft.route.origin = "Kathmandu";
  const { files, ...resumable } = draft;
  assert.equal(resumable.vehicle.busName, "Himalayan Express");
  assert.equal(resumable.route.origin, "Kathmandu");
  assert.ok(files.photos.front === null);
  assert.equal("files" in resumable, false);
});

test("multi-draft registry supports saving, listing, and switching multiple bus drafts", async () => {
  const id1 = generateDraftId();
  const id2 = generateDraftId();
  assert.notEqual(id1, id2);

  const draft1 = structuredClone(EMPTY_FLEET_DRAFT);
  draft1.vehicle.busName = "Kathmandu Deluxe";
  draft1.vehicle.busNumber = "Ba 2 Kha 4521";

  const draft2 = structuredClone(EMPTY_FLEET_DRAFT);
  draft2.vehicle.busName = "Pokhara Super";
  draft2.vehicle.busNumber = "Ga 1 Kha 8820";

  await saveFleetRegistrationDraft(id1, draft1, "vehicle", [], "fleet-server-123");
  await saveFleetRegistrationDraft(id2, draft2, "photos", ["vehicle", "layout"], "fleet-server-456");

  const list = listFleetDrafts();
  assert.ok(list.some((d) => d.id === id1 && d.name.includes("Kathmandu Deluxe") && d.serverFleetId === "fleet-server-123"));
  assert.ok(list.some((d) => d.id === id2 && d.name.includes("Pokhara Super") && d.serverFleetId === "fleet-server-456"));

  // Verify loading specific draft restores step and serverFleetId
  const loaded2 = await loadFleetRegistrationDraft(id2);
  assert.ok(loaded2);
  assert.equal(loaded2?.draft.vehicle.busName, "Pokhara Super");
  assert.equal(loaded2?.step, "photos");
  assert.equal(loaded2?.serverFleetId, "fleet-server-456");

  // Verify deleting draft 1 does not affect draft 2
  await deleteFleetRegistrationDraft(id1);
  const afterDeleteList = listFleetDrafts();
  assert.equal(afterDeleteList.some((d) => d.id === id1), false);
  assert.equal(afterDeleteList.some((d) => d.id === id2), true);

  // Cleanup
  await deleteFleetRegistrationDraft(id2);
});

test("submitted fleet cleanup removes only the locked editable copy", async () => {
  const submittedId = generateDraftId();
  const unfinishedId = generateDraftId();
  const submitted = structuredClone(EMPTY_FLEET_DRAFT);
  submitted.vehicle.busName = "Submitted bus";
  submitted.vehicle.busNumber = "BA 1 KHA 1000";
  const unfinished = structuredClone(EMPTY_FLEET_DRAFT);
  unfinished.vehicle.busName = "Unfinished bus";
  unfinished.vehicle.busNumber = "BA 1 KHA 2000";

  await saveFleetRegistrationDraft(submittedId, submitted, "review", [], "fleet-pending");
  await saveFleetRegistrationDraft(unfinishedId, unfinished, "vehicle", [], "fleet-draft");
  await cleanupLockedServerFleetDrafts([
    { fleetId: "fleet-pending", busNumber: "BA 1 KHA 1000", approvalStatus: "PENDING" },
    { fleetId: "fleet-draft", busNumber: "BA 1 KHA 2000", approvalStatus: "DRAFT" },
  ]);

  const remaining = listFleetDrafts();
  assert.equal(remaining.some((draft) => draft.id === submittedId), false);
  assert.equal(remaining.some((draft) => draft.id === unfinishedId), true);
  await deleteFleetRegistrationDraft(unfinishedId);
});

test("correction drafts preserve secure server file references when reopened", async () => {
  const id = generateDraftId();
  const draft = structuredClone(EMPTY_FLEET_DRAFT);
  draft.vehicle.busName = "Correction bus";
  draft.files.photos.front = "https://secure.example/front" as unknown as File;
  draft.files.insurance = "https://secure.example/insurance" as unknown as File;

  await saveFleetRegistrationDraft(id, draft, "review", ["vehicle"], "fleet-correction");
  const restored = await loadFleetRegistrationDraft(id);

  assert.equal(restored?.draft.files.photos.front as unknown as string, "https://secure.example/front");
  assert.equal(restored?.draft.files.insurance as unknown as string, "https://secure.example/insurance");
  await deleteFleetRegistrationDraft(id);
});

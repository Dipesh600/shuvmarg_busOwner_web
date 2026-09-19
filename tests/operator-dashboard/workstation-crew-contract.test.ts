import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("workstation crew contract: crew tab renders live driver & conductor assignments and rotation actions", () => {
  const tab = read("src/components/dashboard/fleet/workstation/BusWorkstationCrewTab.tsx");
  const canvas = read("src/components/dashboard/fleet/workstation/BusWorkstationCanvas.tsx");

  // Tab Header & Eyebrow
  assert.match(tab, /Vehicle crew/);
  assert.match(tab, /Who is operating this bus now/);
  assert.match(tab, /These are live vehicle assignments from the server\. Driver and conductor can be rotated later\./);
  assert.match(tab, /Brand and eligibility checked/);

  // Current Crew Details
  assert.match(tab, /Current assignment/);
  assert.match(tab, /Rotatable/);
  assert.match(tab, /Attention required/);
  assert.match(tab, /Duty state/);
  assert.match(tab, /App access/);
  assert.match(tab, /Approval/);
  assert.match(tab, /License number/);
  assert.match(tab, /License type/);
  assert.match(tab, /License valid until/);

  // Rotation CTAs
  assert.match(tab, /Rotate \{label\}/);
  assert.match(tab, /Select \{label\}/);

  // Ledger Reassurance Notice
  assert.match(tab, /Changing the current crew updates this vehicle only\. It does not permanently bind a driver or conductor to the bus\./);

  // Canvas Integration
  assert.match(canvas, /<BusWorkstationCrewTab/);
  assert.match(canvas, /activeTab === "crew"/);
});

test("workstation crew contract: rotation modal provides candidate search, eligibility checks, and ledger confirmation", () => {
  const modal = read("src/components/dashboard/fleet/workstation/BusWorkstationCrewRotationModal.tsx");

  // Modal Header & Description
  assert.match(modal, /Replace current/);
  assert.match(modal, /Select current/);
  assert.match(modal, /The assignment is rotatable, not permanent\./);

  // Available Crew Search & Add Actions
  assert.match(modal, /Available/);
  assert.match(modal, /Add/);
  assert.match(modal, /Search by name, phone or staff code/);
  assert.match(modal, /Only eligible crew from this operator brand can be selected\./);

  // Confirmation Flow
  assert.match(modal, /Confirm.*rotation/);
  assert.match(modal, /Rotating Off/);
  assert.match(modal, /Becoming Active/);
  assert.match(modal, /records the change in the assignment ledger/);
  assert.match(modal, /setVehicleCurrentCrew/);
});

test("workstation crew contract: crew-management API supports canonical current crew and lifecycle endpoints", () => {
  const api = read("src/features/crew-management/api.ts");

  // Types & Contracts
  assert.match(api, /export type CrewAssignmentStatus/);
  assert.match(api, /export interface CanonicalCurrentCrew/);
  assert.match(api, /currentAssignment\?: CanonicalCurrentCrew \| null/);
  assert.match(api, /export interface VehicleCrewOptions/);

  // API Methods
  assert.match(api, /listVehicleCrewOptions/);
  assert.match(api, /setVehicleCurrentCrew/);
  assert.match(api, /removeVehicleCurrentCrew/);
  assert.match(api, /\/busowner\/fleets\/\$\{encodeURIComponent\(fleetId\)\}\/crew-options/);
  assert.match(api, /\/busowner\/fleets\/\$\{encodeURIComponent\(fleetId\)\}\/current-crew\/\$\{role\}/);
});

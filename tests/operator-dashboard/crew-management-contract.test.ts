import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test("crew API uses owner-scoped lifecycle endpoints", () => {
  const api = read("src/features/crew-management/api.ts");
  for (const route of ["/busowner/crew?", "/busowner/assignDriver", "/busowner/assignConductor",
    "/busowner/removeDriver", "/busowner/removeConductor", "/busowner/conductors/"]) {
    assert.match(api, new RegExp(route.replace(/[/?]/g, "\\$&")));
  }
  assert.doesNotMatch(api, /localStorage|NEXT_PUBLIC_API_URL/);
  assert.match(api, /authFetch/);
});
test("crew workspace replaces the placeholder with core management flows", () => {
  const list = read("src/components/dashboard/staff/CrewMembersList.tsx");
  assert.doesNotMatch(list, /coming next/i);
  for (const copy of ["Add {role}", "Retry setup SMS", "Rehire crew member", "Manage trips",
    "Mark available", "Mark off duty", "Security update required", "Complete security check"]) assert.match(list, new RegExp(copy));
  assert.doesNotMatch(list, /Admin review pending|admin review is approved/i);
  assert.match(list, /StaffCardActionsMenu/);
  assert.match(list, /ConductorTripsDialog/);
});
test("operational and account states are displayed separately", () => {
  const badge = read("src/components/dashboard/staff/StaffStatusBadge.tsx");
  const list = read("src/components/dashboard/staff/CrewMembersList.tsx");
  assert.match(list, /Account setup pending/);
  assert.match(list, /Account active/);
  for (const state of ["NOT_LINKED", "INVITED", "ACTIVE", "SUSPENDED", "REMOVED"]) {
    assert.match(list, new RegExp(`accessStatus === "${state}"`));
  }
  for (const delivery of ["PENDING", "QUEUED", "FAILED"]) {
    assert.match(list, new RegExp(`invitationDeliveryStatus === "${delivery}"`));
  }
  assert.match(list, /staff\.accessStatus === "ACTIVE" && activeStatus\(staff\.status\)/);
  assert.doesNotMatch(list, /Send login SMS/);
  assert.doesNotMatch(badge, /accountStatus|Activation pending|SMS Sent/);
});
test("driver form is role-specific and requires the shared secure compliance data", () => {
  const form = read("src/components/dashboard/staff/CrewAssignmentDialog.tsx");
  for (const field of ["gender", "experienceYears", "licenseNumber", "licenseType", "licenseExpiry", "licenseDoc"]) {
    assert.match(form, new RegExp(field));
  }
  assert.doesNotMatch(form, /setRole|Previous Employer/);
  const api = read("src/features/crew-management/api.ts");
  assert.match(api, /new FormData/);
  const trips = read("src/components/dashboard/staff/ConductorTripsDialog.tsx");
  assert.match(trips, /conductor\.brandId/);
  assert.match(trips, /terminal/);
  assert.match(trips, /setConductorTrip/);
});

test("security completion uses the returned approval state instead of an already-assigned notice", () => {
  const api = read("src/features/crew-management/api.ts");
  const dialog = read("src/components/dashboard/staff/CrewAssignmentDialog.tsx");
  const list = read("src/components/dashboard/staff/CrewMembersList.tsx");
  for (const field of ["securityUpdated", "profileStatus", "approvalStatus", "accessStatus", "invitationDeliveryStatus"]) assert.match(api, new RegExp(field));
  assert.match(dialog, /result\.data\.notificationStatus/);
  assert.match(dialog, /result\.data\)/);
  assert.match(list, /approvalStatus: result\.approvalStatus/);
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test("crew API uses owner-scoped lifecycle endpoints", () => {
  const api = read("src/features/crew-management/api.ts");
  for (const route of ["/busowner/crew?", "/busowner/assignDriver", "/busowner/assignConductor",
    "/busowner/removeDriver", "/busowner/removeConductor", "/invitation/resend", "/busowner/conductors/"]) {
    assert.match(api, new RegExp(route.replace(/[/?]/g, "\\$&")));
  }
  assert.doesNotMatch(api, /NEXT_PUBLIC_API_URL/);
  assert.match(api, /authFetch/);
});
test("driver and conductor identity lookup stays read-only while connection is explicit", () => {
  const api = read("src/features/crew-management/api.ts");
  const lookup = read("src/components/dashboard/staff/CrewIdentityLookup.tsx");
  const dialog = read("src/components/dashboard/staff/CrewAssignmentDialog.tsx");
  const list = read("src/components/dashboard/staff/CrewMembersList.tsx");
  assert.match(api, /\/busowner\/crew\/lookup/);
  assert.match(api, /new URLSearchParams\(\{ role, identifier:/);
  assert.match(api, /\/busowner\/crew\/connections/);
  assert.match(api, /connectCrewIdentity/);
  for (const copy of ["exact Shuvmarg ID or registered mobile", "SM-DR-…", "SM-CD-…"]) {
    assert.match(lookup, new RegExp(copy));
  }
  assert.doesNotMatch(lookup, /matching identity will appear|Lookup only|No invitation is sent/i);
  assert.doesNotMatch(lookup, /assignCrew|canInvite|canBeAssigned/);
  for (const copy of ["Connect to operator brand", "Access only:", "does not assign this person to a bus or trip", "Connect to brand"]) {
    assert.match(lookup, new RegExp(copy));
  }
  assert.match(lookup, /connectionEligibility\.canConnect/);
  assert.match(lookup, /connectCrewIdentity\(\{ role, staffCode: preview\.staffCode, brandId \}\)/);
  assert.match(dialog, /<CrewIdentityLookup role=\{role\} brands=\{brands\}/);
  assert.match(dialog, /addMode === "lookup"/);
  assert.doesNotMatch(list, /CrewIdentityLookup/);
});
test("crew workspace replaces the placeholder with core management flows", () => {
  const list = read("src/components/dashboard/staff/CrewMembersList.tsx");
  assert.doesNotMatch(list, /coming next/i);
  for (const copy of ["Add {role}", "Resend invitation SMS", "Rehire crew member", "Manage trips",
    "Mark available", "Mark off duty", "Security update required", "Complete security check"]) assert.match(list, new RegExp(copy));
  assert.doesNotMatch(list, /Admin review pending|admin review is approved/i);
  assert.match(list, /StaffCardActionsMenu/);
  assert.match(list, /ConductorTripsDialog/);
});
test("operational and account states are displayed separately", () => {
  const badge = read("src/components/dashboard/staff/StaffStatusBadge.tsx");
  const list = read("src/components/dashboard/staff/CrewMembersList.tsx");
  assert.match(list, /Account setup pending/);
  assert.match(list, /Crew access active/);
  for (const state of ["NOT_LINKED", "INVITED", "ACTIVE", "SUSPENDED", "REMOVED"]) {
    assert.match(list, new RegExp(`accessStatus === "${state}"`));
  }
  for (const delivery of ["PENDING", "FAILED"]) {
    assert.match(list, new RegExp(`invitationDeliveryStatus === "${delivery}"`));
  }
  assert.doesNotMatch(list, /SMS queued for delivery/);
  assert.match(list, /staff\.accessStatus === "ACTIVE" && activeStatus\(staff\.status\)/);
  assert.match(list, /accessActive && \(staff\.status === "AVAILABLE" \|\| staff\.status === "OFF_DUTY"\)/);
  assert.match(list, /accessActive && <StaffStatusBadge status=\{staff\.status\}/);
  assert.match(list, /canChangeStatus=\{accessActive/);
  assert.doesNotMatch(list, /Send login SMS/);
  assert.doesNotMatch(badge, /accountStatus|Activation pending|SMS Sent/);
});
test("pending crew have an immutable SMS resend action and no duty controls", () => {
  const api = read("src/features/crew-management/api.ts");
  const dialog = read("src/components/dashboard/staff/CrewAssignmentDialog.tsx");
  const list = read("src/components/dashboard/staff/CrewMembersList.tsx");
  assert.match(list, /accountStatus === "active" \? "Acceptance pending" : "Account setup pending"/);
  assert.match(list, /\["PENDING", "FAILED"\]\.includes\(staff\.invitationDeliveryStatus\)/);
  assert.match(list, /resendCrewInvitation\(staff\)/);
  assert.match(api, /method: "POST"/);
  assert.match(api, /invitation\/resend/);
  assert.doesNotMatch(dialog, /resendInvite|Retry setup SMS|Retry invitation SMS/);
  assert.doesNotMatch(list, /setDialog\(\{ existing: staff, resend:/);
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

test("operator can edit crew vehicle access without changing the invitation", () => {
  const api = read("src/features/crew-management/api.ts");
  const list = read("src/components/dashboard/staff/CrewMembersList.tsx");
  const dialog = read("src/components/dashboard/staff/CrewVehicleAccessDialog.tsx");
  assert.match(api, /\/busowner\/crew\/\$\{staff\.role\}/);
  assert.match(api, /encodeURIComponent\(staff\.id\).*vehicle-scope/);
  assert.match(api, /method: "PATCH"/);
  assert.match(list, /Vehicle access/);
  assert.match(list, /CrewVehicleAccessDialog/);
  for (const scope of ["ANY_VEHICLE", "ONE_VEHICLE", "SELECTED_VEHICLES"]) {
    assert.match(dialog, new RegExp(scope));
  }
  assert.match(dialog, /fleet\.brandId === staff\.brandId/);
});

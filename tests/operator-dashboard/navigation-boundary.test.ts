import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const projectRoot = process.cwd();

test("operator navigation exposes Staff & Agents and retires the standalone Route page", () => {
  const sidebar = readFileSync(
    join(projectRoot, "src/components/operator-dashboard/OperatorSidebar.tsx"),
    "utf8"
  );

  assert.match(sidebar, /Staff & Agents/);
  assert.match(sidebar, /\/dashboard\/staff/);
  assert.doesNotMatch(sidebar, /\/dashboard\/routes/);
  assert.equal(existsSync(join(projectRoot, "src/app/dashboard/routes/page.tsx")), false);
});

test("business profile actions do not link to retired route or schedule pages", () => {
  const operatorCard = readFileSync(
    join(projectRoot, "src/app/dashboard/business-profile/components/OperatorCard.tsx"),
    "utf8"
  );

  assert.doesNotMatch(operatorCard, /href="\/dashboard\/routes"/);
  assert.doesNotMatch(operatorCard, /href="\/dashboard\/schedules"/);
  assert.match(operatorCard, /href="\/dashboard\/fleet"/);
  assert.match(operatorCard, /href="\/dashboard\/trips"/);
});

test("staff workspace uses the real agent-assignment API and no fabricated counters", () => {
  const staffRoot = join(projectRoot, "src/components/dashboard/staff");
  const agents = readFileSync(join(staffRoot, "AgentCountersList.tsx"), "utf8");
  const dialog = readFileSync(join(staffRoot, "AgentAssignmentDialog.tsx"), "utf8");
  const workspace = readFileSync(join(staffRoot, "StaffManagementLayout.tsx"), "utf8");
  const api = readFileSync(
    join(projectRoot, "src/features/agent-assignment/api.ts"),
    "utf8"
  );

  assert.equal(existsSync(join(staffRoot, "staff-api.ts")), false);
  assert.doesNotMatch(agents, /DEFAULT_PARTNER_COUNTERS/);
  assert.match(agents, /listAgentAssignments/);
  assert.match(agents, /transitionAssignment/);
  assert.match(agents, /salesCount/);
  assert.match(agents, /status === "ACTIVE"/);
  assert.match(agents, /"INVITATIONS"/);
  assert.match(agents, /"STOPPED"/);
  assert.match(agents, /Active agents/);
  assert.match(agents, /Invitations/);
  assert.match(agents, /Paused & removed/);
  assert.match(agents, /Add or connect agent/);
  assert.match(agents, /Connect existing agent/);
  assert.match(agents, /role="tablist"/);
  assert.match(agents, /AgentSearchableSelect/);
  assert.doesNotMatch(agents, /<select/);
  assert.match(workspace, /Ticket agents/);
  assert.match(workspace, /Crew/);
  assert.equal(existsSync(join(staffRoot, "StaffSummaryKpis.tsx")), false);
  assert.equal(existsSync(join(staffRoot, "AgentSummaryKpis.tsx")), false);
  assert.match(api, /\/busowner\/agents\/assignments/);
  assert.match(api, /query\.set\("view"/);
  assert.match(dialog, /Create agent & send/);
  assert.match(dialog, /Promise\.allSettled\(drafts\.map\(inviteAgent\)\)/);
  assert.doesNotMatch(agents, /sample|fabricated|preview only/i);
});

test("business verification submits exactly the three backend-supported documents", () => {
  const config = readFileSync(
    join(projectRoot, "src/components/operator-dashboard/business-setup-modal/BusinessSetupModalConfig.ts"),
    "utf8"
  );

  assert.match(config, /companyRegistration/);
  assert.match(config, /taxRegistration/);
  assert.match(config, /ownerIdentity/);
  assert.doesNotMatch(config, /transportLicense/);
  assert.doesNotMatch(config, /insuranceCertificates/);
});

test("settings document preview renders PDFs separately from images", () => {
  const viewer = readFileSync(
    join(projectRoot, "src/components/dashboard/settings/profile/SecureDocViewerModal.tsx"),
    "utf8"
  );

  assert.match(viewer, /mediaType === "application\/pdf"/);
  assert.match(viewer, /<iframe/);
  assert.match(viewer, /<img/);
  assert.match(viewer, /ALLOWED_PREVIEW_TYPES/);
});

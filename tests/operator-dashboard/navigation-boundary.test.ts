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

test("frontend-only staff workspace contains no staff API or fabricated counters", () => {
  const staffRoot = join(projectRoot, "src/components/dashboard/staff");
  const agents = readFileSync(join(staffRoot, "AgentCountersList.tsx"), "utf8");

  assert.equal(existsSync(join(staffRoot, "staff-api.ts")), false);
  assert.doesNotMatch(agents, /DEFAULT_PARTNER_COUNTERS/);
  assert.match(agents, /No sample or fabricated counters are shown/);
});

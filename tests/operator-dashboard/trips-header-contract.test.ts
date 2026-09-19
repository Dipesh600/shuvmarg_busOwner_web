import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("trips header contract: TripsPageHeader renders signature panoramic top card and integrates into TripsPage", () => {
  const header = read("src/app/dashboard/trips/components/TripsPageHeader.tsx");
  const page = read("src/app/dashboard/trips/page.tsx");

  // Visual Assets & Geometry
  assert.match(header, /\/images\/my_buses\.webp/);
  assert.match(header, /bg-gradient-to-r from-\[#FAF8F5\]/);
  assert.match(header, /rounded-2xl sm:rounded-3xl border border-\[#EDE7E0\] bg-\[#FAF8F5\]/);

  // Brand Hierarchy & Copy
  assert.match(header, /text-\[#7A1D1B\]/);
  assert.match(header, /Trips & schedules/);
  assert.match(header, /Your trips/);
  assert.match(header, /Manage active departures, inspect capacity, and preview scoped service changes/);

  // Verified removal of departure count badge and refresh button as requested
  assert.doesNotMatch(header, /Refresh schedule/);
  assert.doesNotMatch(header, /totalTrips === 1/);

  // Integration in TripsPage
  assert.match(page, /import { TripsPageHeader } from "\.\/components\/TripsPageHeader"/);
  assert.match(page, /<TripsPageHeader \/>/);
  assert.doesNotMatch(page, /<WorkspaceHeader/);
});

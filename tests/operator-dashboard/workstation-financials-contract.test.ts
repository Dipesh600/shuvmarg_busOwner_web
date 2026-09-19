import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("workstation financials contract: financial tab renders 3 periods, deductions, net revenue, and trip table", () => {
  const tab = read("src/components/dashboard/fleet/workstation/BusWorkstationFinancialTab.tsx");
  const canvas = read("src/components/dashboard/fleet/workstation/BusWorkstationCanvas.tsx");
  const api = read("src/features/fleet-financials/api.ts");

  // API Client & Types
  assert.match(api, /export interface WorkstationFinancialPeriod/);
  assert.match(api, /export interface WorkstationFinancials/);
  assert.match(api, /export interface WorkstationTripFinancials/);
  assert.match(api, /export async function getFleetFinancials/);
  assert.match(api, /\/busowner\/fleets\/.*\/financials/);

  // Commission & Trend Badges
  assert.match(tab, /Platform Commission:/);
  assert.match(tab, /vs last month/);
  assert.match(tab, /Settlement cycle:/);

  // 3-Period Summary Windows
  assert.match(tab, /This Month/);
  assert.match(tab, /Last Month/);
  assert.match(tab, /All Time/);

  // Financial Metrics & Deductions
  assert.match(tab, /Gross Revenue/);
  assert.match(tab, /Commission \(\{financials\.commissionRate\}%\)/);
  assert.match(tab, /Refunds/);
  assert.match(tab, /Net Revenue/);
  assert.match(tab, /bookings/);
  assert.match(tab, /passengers/);

  // Per-Trip Revenue Table
  assert.match(tab, /Per-Trip Revenue & Occupancy/);
  assert.match(tab, /Date/);
  assert.match(tab, /Direction/);
  assert.match(tab, /Passengers/);
  assert.match(tab, /Gross/);
  assert.match(tab, /Occ %/);
  assert.match(tab, /Status/);

  // Canvas Integration
  assert.match(canvas, /<BusWorkstationFinancialTab/);
  assert.match(canvas, /activeTab === "financial"/);
});

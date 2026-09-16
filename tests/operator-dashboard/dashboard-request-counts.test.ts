import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// Exercise the actual API and auth modules with a deterministic clock and HTTP fixture.
function harness() {
  const sourceRoot = fileURLToPath(new URL("../../src/", import.meta.url));
  const modules = new Map<string, { exports: Record<string, unknown> }>();
  function load(filename: string): Record<string, unknown> {
    if (!path.extname(filename)) filename += ".ts";
    const existing = modules.get(filename);
    if (existing) return existing.exports;
    const compiledModule = { exports: {} as Record<string, unknown> };
    modules.set(filename, compiledModule);
    const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const require = (specifier: string) => load(specifier.startsWith("@/")
      ? path.join(sourceRoot, specifier.slice(2)) : path.resolve(path.dirname(filename), specifier));
    new Function("require", "module", "exports", compiled)(require, compiledModule, compiledModule.exports);
    return compiledModule.exports;
  }
  const api = load(path.join(sourceRoot, "features/operator-dashboard/operator-dashboard-api.ts")) as unknown as {
    fetchOperatorDashboardState: (options?: { force?: boolean }) => Promise<{ verificationStatus: string; fleetSetupStatusesByFleetId: Record<string, unknown> }>;
  };
  const auth = load(path.join(sourceRoot, "lib/auth.ts")) as unknown as {
    saveTokens: (token: string) => void;
    invalidateReadCache: () => void;
    authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  };
  const trips = load(path.join(sourceRoot, "features/trip-seat-controls/api.ts")) as unknown as { listOwnerTrips: () => Promise<unknown> };
  const workspace = load(path.join(sourceRoot, "features/operator-dashboard/fleet-workspace-api.ts")) as unknown as { readFleetWorkspace: (force?: boolean) => Promise<{ ownerTrips: unknown }> };
  return { api, auth, trips, workspace };
}

test("50 tab visits with 10 buses use four cold reads, zero setup calls, and bounded refreshes", async () => {
  const originalFetch = globalThis.fetch;
  const originalNow = Date.now;
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const storage = new Map<string, string>();
  let now = 1_000_000;
  Date.now = () => now;
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => storage.get(key) || null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  } });
  Object.defineProperty(globalThis, "window", { configurable: true, value: { dispatchEvent: () => true } });
  const calls: string[] = [];
  let verificationStatus = "pending";
  globalThis.fetch = async (input) => {
    const url = String(input);
    calls.push(url);
    if (url.endsWith("/busowner/profile")) return Response.json({ data: { profile: { name: "Owner", phone: "9800000001" }, business: { companyName: "Example" } } });
    if (url.endsWith("/busowner/kyc-status")) return Response.json({ data: { verificationStatus } });
    if (url.includes("/busowner/fleets?")) return Response.json({ data: {
      items: Array.from({ length: 10 }, (_, i) => ({ fleetId: `fleet-${i}`, approvalStatus: "APPROVED", frontImage: null,
        setupStatus: { fleetId: `fleet-${i}`, steps: {}, nextStep: "routeAssigned" } })),
      pagination: { totalItems: 10 },
    } });
    if (url.includes("/busowner/getMyTrips")) return Response.json({ data: [] });
    throw new Error(`Unexpected HTTP call: ${url}`);
  };
  try {
    const { api, auth, trips } = harness();
    auth.saveTokens("operator");
    const visit = () => Promise.all([api.fetchOperatorDashboardState(), trips.listOwnerTrips()]);
    await Promise.all(Array.from({ length: 50 }, visit));
    assert.equal(calls.length, 4);
    for (let minute = 1; minute < 15; minute++) {
      now += 60_001;
      await Promise.all(Array.from({ length: 50 }, visit));
    }
    assert.equal(calls.length, 36);
    assert.equal(calls.filter(url => url.endsWith("/busowner/profile")).length, 3);
    assert.equal(calls.filter(url => url.includes("setup-status")).length, 0);
    verificationStatus = "approved";
    const state = await api.fetchOperatorDashboardState({ force: true });
    assert.equal(state.verificationStatus, "approved");
    assert.equal(Object.keys(state.fleetSetupStatusesByFleetId).length, 10);

    // A manual refresh must supersede an older ordinary refresh without
    // allowing its late response to overwrite the latest KYC state.
    const fixtureFetch = globalThis.fetch;
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    let firstProfile = true;
    globalThis.fetch = async (input, options) => {
      const response = await fixtureFetch(input, options);
      if (String(input).endsWith("/busowner/profile") && firstProfile) {
        firstProfile = false;
        await gate;
      }
      return response;
    };
    verificationStatus = "pending";
    auth.invalidateReadCache();
    const older = api.fetchOperatorDashboardState();
    await new Promise(resolve => setImmediate(resolve));
    verificationStatus = "approved";
    const beforeForce = calls.length;
    const refreshed = await Promise.all(Array.from({ length: 10 }, () => api.fetchOperatorDashboardState({ force: true })));
    assert.equal(calls.length - beforeForce, 3);
    release();
    assert.strictEqual(await older, refreshed[0]);
    assert.equal(refreshed[0].verificationStatus, "approved");
  } finally {
    globalThis.fetch = originalFetch;
    Date.now = originalNow;
    if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
    else Reflect.deleteProperty(globalThis, "localStorage");
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});

test("actual Fleet reads skip protected trips before approval and never load crew directories", async () => {
  const originalFetch = globalThis.fetch;
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const storage = new Map<string, string>(), calls: string[] = [];
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (key: string) => storage.get(key) || null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) } });
  Object.defineProperty(globalThis, "window", { configurable: true, value: { dispatchEvent: () => true } });
  let status = "pending";
  globalThis.fetch = async input => {
    const url = String(input); calls.push(url);
    if (url.endsWith("/busowner/profile")) return Response.json({ data: { profile: { name: "Owner", phone: "9800000001" }, business: { companyName: "Example" } } });
    if (url.endsWith("/busowner/kyc-status")) return Response.json({ data: { verificationStatus: status } });
    if (url.includes("/busowner/fleets?")) return Response.json({ data: { items: [], pagination: { totalItems: 0 } } });
    if (url.includes("/busowner/getMyTrips?")) return Response.json({ data: [] });
    throw new Error(`Unexpected Fleet request: ${url}`);
  };
  try {
    const { auth, workspace } = harness(); auth.saveTokens("fleet-test-token");
    assert.equal((await workspace.readFleetWorkspace()).ownerTrips, null);
    await workspace.readFleetWorkspace(); assert.equal(calls.length, 3);
    status = "approved";
    const result = await workspace.readFleetWorkspace(true);
    assert.deepEqual(result.ownerTrips, []); assert.equal(calls.length, 7);
    await workspace.readFleetWorkspace(); assert.equal(calls.length, 7);
    assert.equal(calls.filter(url => url.includes("/crew") || url.includes("setup-status")).length, 0);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage); else Reflect.deleteProperty(globalThis, "localStorage");
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow); else Reflect.deleteProperty(globalThis, "window");
  }
});

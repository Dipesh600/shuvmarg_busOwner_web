import test from "node:test";
import assert from "node:assert/strict";

const store = new Map<string, string>();
const events: string[] = [];
Object.defineProperty(globalThis, "localStorage", { value: {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, value),
  removeItem: (key: string) => store.delete(key),
}, configurable: true });
Object.defineProperty(globalThis, "window", { value: {
  dispatchEvent: (event: Event) => { events.push(event.type); return true; },
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
}, configurable: true });

const auth = await import("../../src/lib/auth.ts");
const originalFetch = globalThis.fetch;

test.beforeEach(() => { store.clear(); events.length = 0; });
test.after(() => { globalThis.fetch = originalFetch; });

test("concurrent 401 responses share one refresh and retry once", async () => {
  auth.saveTokens("expired");
  let refreshes = 0;
  let protectedCalls = 0;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("/auth/busowner/refresh")) {
      refreshes += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      return Response.json({ accessToken: "fresh" });
    }
    protectedCalls += 1;
    return protectedCalls <= 2
      ? Response.json({}, { status: 401 })
      : Response.json({ ok: true });
  };

  const responses = await Promise.all([auth.authFetch("/one"), auth.authFetch("/two")]);
  assert.equal(refreshes, 1);
  assert.equal(protectedCalls, 4);
  assert.deepEqual(responses.map((response) => response.status), [200, 200]);
  assert.equal(auth.getAccessToken(), "fresh");
});

test("failed refresh clears the session", async () => {
  auth.saveTokens("expired");
  globalThis.fetch = async (input) => String(input).includes("/auth/busowner/refresh")
    ? Response.json({ errorCode: "SESSION_ROLE_MISMATCH" }, { status: 401 })
    : Response.json({}, { status: 401 });

  const response = await auth.authFetch("/profile");
  assert.equal(response.status, 401);
  assert.equal(auth.getAccessToken(), null);
  assert.ok(events.includes("auth-change"));
});

test("terminal role 403 logs out, business 403 does not", async () => {
  auth.saveTokens("valid");
  globalThis.fetch = async () => Response.json(
    { errorCode: "INSUFFICIENT_ROLE" },
    { status: 403 },
  );
  await auth.authFetch("/profile");
  assert.equal(auth.getAccessToken(), null);

  auth.saveTokens("valid-again");
  globalThis.fetch = async () => Response.json(
    { errorCode: "KYC_APPROVAL_REQUIRED" },
    { status: 403 },
  );
  await auth.authFetch("/brands");
  assert.equal(auth.getAccessToken(), "valid-again");
});


test("shared operator reads survive navigation and invalidate after writes and logout", async () => {
  auth.saveTokens("owner-one");
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ calls }); };
  await Promise.all(Array.from({ length: 10 }, () => auth.authFetch("/busowner/profile")));
  await auth.authFetch("/busowner/profile");
  assert.equal(calls, 1);
  await auth.authFetch("/busowner/fleets?limit=50");
  await auth.authFetch("/busowner/fleets?limit=50");
  assert.equal(calls, 2);
  await auth.authFetch("/busowner/fleets/bus", { method: "PATCH", body: "{}" });
  await auth.authFetch("/busowner/profile");
  await auth.authFetch("/busowner/fleets?limit=50");
  assert.equal(calls, 5);
  auth.clearTokens();
  auth.saveTokens("owner-two");
  await auth.authFetch("/busowner/profile");
  assert.equal(calls, 6);
});


test("throttled token refresh preserves login and further requests honor the cooldown", async () => {
  auth.saveTokens("expired-but-valid-session");
  let calls = 0;
  globalThis.fetch = async input => {
    calls++;
    return String(input).includes("/auth/busowner/refresh")
      ? Response.json({ message: "Wait" }, { status: 429, headers: { "Retry-After": "900" } })
      : Response.json({}, { status: 401 });
  };
  assert.equal((await auth.authFetch("/busowner/profile")).status, 429);
  assert.equal(auth.getAccessToken(), "expired-but-valid-session");
  await Promise.all(Array.from({ length: 20 }, () => auth.authFetch("/busowner/fleets?limit=50")));
  assert.equal(calls, 2);
  assert.equal(auth.isApiRateLimited(), true);
});

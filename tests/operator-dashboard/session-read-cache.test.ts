import test from "node:test";
import assert from "node:assert/strict";
import { SessionReadCache } from "../../src/lib/session-read-cache.ts";

test("navigation and concurrent consumers share one read with independent bodies", async () => {
  const cache = new SessionReadCache();
  let calls = 0;
  const load = async () => { calls++; return Response.json({ company: "Example" }); };
  const responses = await Promise.all(Array.from({ length: 14 }, () => cache.get("owner:profile", Infinity, load)));
  for (const response of responses) assert.deepEqual(await response.json(), { company: "Example" });
  await cache.get("owner:profile", Infinity, load);
  assert.equal(calls, 1);
});

test("expiry and invalidation fetch fresh data; errors never stick", async () => {
  const cache = new SessionReadCache();
  let calls = 0;
  const load = async () => { calls++; return Response.json({ calls }); };
  await cache.get("fleet", 0, load);
  await cache.get("fleet", 0, load);
  cache.clear();
  await cache.get("fleet", Infinity, load);
  assert.equal(calls, 3);
  const failure = async () => { calls++; return new Response("limited", { status: 429 }); };
  await cache.get("error", Infinity, failure);
  await cache.get("error", Infinity, failure);
  assert.equal(calls, 5);
});

test("logout prevents late responses from repopulating the cache", async () => {
  const cache = new SessionReadCache();
  let resolve!: (response: Response) => void;
  const pending = cache.get("owner", Infinity, () => new Promise<Response>(done => { resolve = done; }));
  cache.clear();
  resolve(Response.json({ owner: "old" }));
  await pending;
  const response = await cache.get("owner", Infinity, async () => Response.json({ owner: "new" }));
  assert.deepEqual(await response.json(), { owner: "new" });
});

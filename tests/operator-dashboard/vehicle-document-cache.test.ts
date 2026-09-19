import test from "node:test";
import assert from "node:assert/strict";
import { DocumentBlobCache, FILE_TTL, accountScope, type CachedFile } from "../../src/features/vehicle-documents/blob-cache.ts";

class Store {
  records = new Map<string, CachedFile>();
  async get(key: string) { return this.records.get(key); }
  async put(file: CachedFile) { this.records.set(file.key, file); }
  async clear() { this.records.clear(); }
}
const pdf = () => new Blob(["%PDF-1.7 file"], { type: "application/pdf" });
const token = (payload: object) => `header.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.signature`;

test("document files survive remounts and fresh cache instances without HTTP", async () => {
  const store = new Store(); let calls = 0;
  const load = async () => { calls++; return pdf(); };
  const cache = new DocumentBlobCache(store);
  await Promise.all([cache.get("owner:a", "/insurance", "v1", load), cache.get("owner:a", "/insurance", "v1", load)]);
  await cache.get("owner:a", "/insurance", "v1", load);
  await new DocumentBlobCache(store).get("owner:a", "/insurance", "v1", load);
  assert.equal(calls, 1);
});

test("changed upload, account, API origin, or expired cache requires a fresh download", async () => {
  const store = new Store(); let now = 1000, calls = 0;
  const cache = new DocumentBlobCache(store, () => now);
  const load = async () => { calls++; return pdf(); };
  await cache.get("owner:api1:a", "/insurance", "v1", load);
  await cache.get("owner:api1:a", "/insurance", "v2", load);
  await cache.get("owner:api1:b", "/insurance", "v2", load);
  await cache.get("owner:api2:b", "/insurance", "v2", load);
  now += FILE_TTL + 1;
  await cache.get("owner:api1:a", "/insurance", "v1", load);
  assert.equal(calls, 5);
});

test("legacy files without versions are not persisted or reused after remount", async () => {
  const store = new Store(); const cache = new DocumentBlobCache(store); let calls = 0;
  const load = async () => { calls++; return pdf(); };
  await cache.get("owner:a", "/bluebook", null, load);
  await cache.get("owner:a", "/bluebook", null, load);
  assert.equal(calls, 2); assert.equal(store.records.size, 0);
});

test("failures and active-content files are never cached; retry can succeed", async () => {
  const store = new Store(); const cache = new DocumentBlobCache(store);
  await assert.rejects(cache.get("a", "/file", "v1", async () => { throw new Error("HTTP 429"); }), /429/);
  await assert.rejects(cache.get("a", "/file", "v1", async () => new Blob(["<svg/>"], { type: "image/svg+xml" })), /safely/);
  await assert.rejects(cache.get("a", "/file", "v1", async () => new Blob([], { type: "application/pdf" })), /safely/);
  assert.equal(store.records.size, 0);
  await cache.get("a", "/file", "v1", async () => pdf());
  assert.equal(store.records.size, 1);
});

test("storage failures still allow previews using bounded memory cache", async () => {
  const unavailable = { get: async () => { throw Error("private mode"); }, put: async () => { throw Error("quota"); }, clear: async () => {} };
  const cache = new DocumentBlobCache(unavailable); let calls = 0;
  const load = async () => { calls++; return pdf(); };
  await cache.get("a", "/file", "v1", load); await cache.get("a", "/file", "v1", load);
  assert.equal(calls, 1);
});

test("logout rejects an in-flight download and cannot repopulate persistent cache", async () => {
  const store = new Store(); const cache = new DocumentBlobCache(store);
  const started = Promise.withResolvers<void>(), downloaded = Promise.withResolvers<Blob>();
  const pending = cache.get("a", "/file", "v1", () => { started.resolve(); return downloaded.promise; });
  const rejected = assert.rejects(pending, /Session changed/);
  await started.promise; cache.clear(); downloaded.resolve(pdf()); await rejected;
  await cache.get("b", "/file", "v1", async () => pdf());
  assert.equal(store.records.size, 1);
  assert.ok([...store.records.keys()].every(key => key.includes('"b"')));
});

test("logout waits for a pending disk write and clears it before the next session reads", async () => {
  const store = new Store(), started = Promise.withResolvers<void>(), finish = Promise.withResolvers<void>();
  const put = store.put.bind(store);
  store.put = async file => { started.resolve(); await finish.promise; await put(file); };
  const cache = new DocumentBlobCache(store);
  const pending = cache.get("a", "/file", "v1", async () => pdf());
  const rejected = assert.rejects(pending, /Session changed/);
  await started.promise; cache.clear(); finish.resolve(); await rejected;
  await cache.get("b", "/new-file", null, async () => pdf());
  assert.equal(store.records.size, 0);
});

test("cache principal is stable across token renewal but excludes expired or missing sessions", () => {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  assert.equal(accountScope(token({ id: "a", role: "user", activeRole: "busOwner", exp, iat: 1 })), "a:busOwner");
  assert.equal(accountScope(token({ id: "a", role: "user", activeRole: "busOwner", exp, iat: 2 })), "a:busOwner");
  for (const value of [null, "malformed", token({ id: "a", role: "busOwner", exp: 1 }), token({ id: "a", exp })]) assert.equal(accountScope(value), null);
});

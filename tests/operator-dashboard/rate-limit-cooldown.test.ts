import test from "node:test";
import assert from "node:assert/strict";
import { RateLimitCooldown } from "../../src/lib/rate-limit-cooldown.ts";

test("Retry-After seconds prevents requests until the window expires", async () => {
  let now = 1_000;
  const cooldown = new RateLimitCooldown(() => now);
  cooldown.record(Response.json({ message: "Wait" }, { status: 429, headers: { "Retry-After": "900" } }));
  assert.equal(cooldown.active, true);
  assert.deepEqual(await cooldown.response()!.json(), { message: "Wait" });
  now += 899_999;
  assert.equal(cooldown.active, true);
  now++;
  assert.equal(cooldown.response(), null);
});

test("HTTP dates, absent headers and successful responses are handled", () => {
  let now = Date.parse("2026-09-16T12:00:00Z");
  const cooldown = new RateLimitCooldown(() => now);
  cooldown.record(new Response(null, { status: 429, headers: { "Retry-After": "Wed, 16 Sep 2026 12:01:00 GMT" } }));
  cooldown.record(new Response(null, { status: 200 }));
  assert.equal(cooldown.active, true);
  now += 60_000;
  assert.equal(cooldown.active, false);
  cooldown.record(new Response(null, { status: 429 }));
  now += 60_000;
  assert.equal(cooldown.active, false);
});

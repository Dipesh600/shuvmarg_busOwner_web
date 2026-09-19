import assert from "node:assert/strict";
import test from "node:test";
import nextConfig from "../../next.config.ts";

test("the applied owner security policy permits local video previews and cached playback", async () => {
  const rules = await nextConfig.headers!();
  const headers = rules.find(rule => rule.source === "/:path*")?.headers;
  const policy = headers?.find(header => header.key === "Content-Security-Policy")?.value;
  assert.ok(policy);
  const directives = policy.split(";").map(value => value.trim());
  assert.equal(directives.find(value => value.startsWith("media-src ")), "media-src 'self' blob:");
  assert.ok(directives.includes("default-src 'self'"));
  assert.ok(directives.includes("object-src 'none'"));
});

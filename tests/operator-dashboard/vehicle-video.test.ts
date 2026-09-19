import assert from "node:assert/strict";
import test from "node:test";
import { validateVideoFile, MAX_VIDEO_BYTES } from "../../src/features/vehicle-documents/video-policy.ts";
import { DocumentBlobCache, type CachedFile } from "../../src/features/vehicle-documents/blob-cache.ts";
test("optional vehicle video accepts exactly 20 MB and rejects oversized or incompatible selections", () => {
  assert.equal(MAX_VIDEO_BYTES, 20_000_000);
  assert.equal(validateVideoFile({ size: MAX_VIDEO_BYTES, name: "bus.mp4", type: "video/mp4" }), null);
  assert.equal(validateVideoFile({ size: 1, name: "bus.MOV", type: "video/quicktime" }), null);
  for (const size of [0, MAX_VIDEO_BYTES + 1]) assert.match(validateVideoFile({ size, name: "bus.mp4", type: "video/mp4" })!, /20 MB/);
  assert.match(validateVideoFile({ size: 1, name: "bus.exe", type: "video/mp4" })!, /MP4/);
});
test("video playback caches files above the old 20 MiB limit across fresh instances", async () => {
  const records = new Map<string, CachedFile>();
  const store = { get: async (key: string) => records.get(key), put: async (file: CachedFile) => { records.set(file.key, file); }, clear: async () => { records.clear(); } };
  const blob = new Blob([new Uint8Array(21 * 1024 * 1024)], { type: "video/mp4" }); let loads = 0;
  const load = async () => { loads++; return blob; };
  await new DocumentBlobCache(store).get("owner:a", "/video", "v1", load);
  await new DocumentBlobCache(store).get("owner:a", "/video", "v1", load);
  assert.equal(loads, 1); assert.equal(records.size, 1);
});

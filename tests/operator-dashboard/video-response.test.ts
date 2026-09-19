import assert from "node:assert/strict";
import test from "node:test";
import { readVideoResponse, videoResponseData } from "../../src/features/vehicle-documents/video-response.ts";
test("video responses handle HTML proxy errors without exposing JSON parsing failures", async () => {
  for (const status of [413, 429, 502, 503, 504]) {
    await assert.rejects(readVideoResponse(new Response("<html>proxy error</html>", { status })), error => {
      assert.ok(error instanceof Error);
      assert.doesNotMatch(error.message, /JSON|Unexpected token|<html>/);
      return true;
    });
  }
});
test("video responses preserve actionable backend errors", async () => {
  await assert.rejects(readVideoResponse(new Response(JSON.stringify({ success: false, message: "Vehicle video uploads are temporarily unavailable." }), { status: 503 })), /temporarily unavailable/);
});
test("video responses reject empty, malformed and invalid success responses", async () => {
  for (const body of ["", "<html>not the API</html>", "null", JSON.stringify({ data: null }), JSON.stringify({ data: { present: false } })]) {
    await assert.rejects(readVideoResponse(new Response(body, { status: 200 })), /unexpected video response/);
  }
});
test("accepted uploads and valid processing status return their descriptor", async () => {
  const descriptor = { present: false, processingStatus: "QUEUED", fileVersion: null };
  assert.deepEqual(await readVideoResponse(new Response(JSON.stringify({ success: true, data: descriptor }), { status: 202 })), descriptor);
  assert.deepEqual(videoResponseData(200, { data: { ...descriptor, processingStatus: "NONE" } }), { ...descriptor, processingStatus: "NONE" });
  assert.throws(() => videoResponseData(200, { success: false, message: "Upload failed." }), /Upload failed/);
});

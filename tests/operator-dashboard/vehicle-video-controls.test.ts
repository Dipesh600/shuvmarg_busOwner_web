import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const require = createRequire(import.meta.url);
function compiled(path: string): string {
  const source = fs.readFileSync(new URL(path, import.meta.url), "utf8");
  let js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  for (const name of ["react", "react/jsx-runtime"]) js = js.replaceAll(`from "${name}"`, `from "${pathToFileURL(require.resolve(name)).href}"`);
  if (path.endsWith("VehicleVideo.tsx")) js = js.replaceAll('from "./blob-cache"', `from "${compiled('../../src/features/vehicle-documents/blob-cache.ts')}"`).replaceAll('from "./SelectedVideoPreview"', `from "${compiled('../../src/features/vehicle-documents/SelectedVideoPreview.tsx')}"`).replaceAll('from "./video-policy"', `from "${compiled('../../src/features/vehicle-documents/video-policy.ts')}"`);
  return "data:text/javascript;base64," + Buffer.from(js).toString("base64");
}
const { default: VehicleVideo } = await import(compiled('../../src/features/vehicle-documents/VehicleVideo.tsx'));
const props = { scope: "operator:test", path: "/fleet/1/video", loadFile: async () => new Blob(), loadStatus: async () => ({}), uploadVideo: async () => ({}), onRefresh() {} };
test("Upload and Replace video remain actionable before a file has been chosen", () => {
  for (const [descriptor, label] of [[{}, "Upload video"], [{ present: true, fileVersion: "v1", processingStatus: "READY" }, "Replace video"]]) {
    const html = renderToStaticMarkup(React.createElement(VehicleVideo, { ...props, descriptor }));
    const button = html.match(new RegExp(`<button[^>]*>${label}</button>`))?.[0];
    assert.ok(button); assert.ok(!button.includes("disabled" + "="));
    assert.match(html, /aria-label="Choose vehicle video"/);
  }
});
test("in-flight processing prevents competing upload/replacement", () => {
  const html = renderToStaticMarkup(React.createElement(VehicleVideo, { ...props, descriptor: { processingStatus: "QUEUED" } }));
  assert.match(html, /<button[^>]*disabled=""[^>]*>Upload video<\/button>/);
});

const { validatePhotoFile } = await import(compiled('../../src/features/vehicle-documents/photo-policy.ts'));
test("photo replacement enforces the server size, MIME and extension limits", () => {
  assert.equal(validatePhotoFile({ size: 5 * 1024 * 1024, type: "image/jpeg", name: "front.JPG" }), null);
  for (const size of [0, 5 * 1024 * 1024 + 1]) assert.match(validatePhotoFile({ size, type: "image/jpeg", name: "front.jpg" }), /5 MB/);
  assert.match(validatePhotoFile({ size: 1, type: "image/png", name: "front.jpg" }), /JPG/);
  assert.match(validatePhotoFile({ size: 1, type: "image/svg+xml", name: "front.svg" }), /JPG/);
});

const { notificationDestination } = await import(compiled('../../src/components/operator-dashboard/notification-destination.ts'));
test("video reminders navigate only to a valid local fleet Documents page", () => {
  assert.equal(notificationDestination("FLEET_VIDEO_REMINDER", { fleetId: "64f000000000000000000001" }), "/dashboard/fleet/64f000000000000000000001?tab=documents");
  assert.equal(notificationDestination("FLEET_VIDEO_REMINDER", { fleetId: "https://attacker.example" }), undefined);
  assert.equal(notificationDestination("GENERAL", { fleetId: "64f000000000000000000001" }), undefined);
});

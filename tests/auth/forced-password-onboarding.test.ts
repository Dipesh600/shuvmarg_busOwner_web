import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const login = fs.readFileSync(path.join(root, "src/app/login/page.tsx"), "utf8");
const change = fs.readFileSync(path.join(root, "src/app/change-password/page.tsx"), "utf8");

test("temporary-password login cannot retain a normal operator session", () => {
  assert.match(login, /if \(data\.forcePasswordChange\)[\s\S]*clearTokens\(\)/);
  assert.match(login, /sessionStorage\.setItem\("busowner_temp_token"/);
  assert.match(login, /router\.push\("\/change-password"\)/);
});

test("first-login password page consumes the temporary token and enters dashboard", () => {
  assert.match(change, /changeForcePassword/);
  assert.match(change, /credentials: "include"/);
  assert.match(change, /saveTokens\(payload\.accessToken\)/);
  assert.match(change, /sessionStorage\.removeItem\(TEMP_TOKEN_KEY\)/);
  assert.match(change, /router\.replace\("\/dashboard"\)/);
});

test("first-login password page refuses direct entry without a temporary token", () => {
  assert.match(change, /if \(!sessionStorage\.getItem\(TEMP_TOKEN_KEY\)\)/);
  assert.match(change, /router\.replace\("\/login"\)/);
});

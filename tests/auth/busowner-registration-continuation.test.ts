import test from "node:test";
import assert from "node:assert/strict";

import {
  extractVerificationToken,
  buildBusOwnerRegistrationPayload,
  isRegistrationVerificationError,
  getRegistrationRecoveryState,
  POST_REGISTRATION_ROUTE,
  type VerifyOtpResponse,
} from "../../src/features/auth/registration/registration-continuation.ts";

test("registration-continuation utilities (Bus-Owner Web)", async (t) => {
  await t.test("successful registration continues to the operator dashboard", () => {
    assert.equal(POST_REGISTRATION_ROUTE, "/dashboard");
  });

  await t.test("extractVerificationToken extracts valid string token from response root", () => {
    assert.equal(
      extractVerificationToken({ verificationToken: "busowner-signed-jwt-token" }),
      "busowner-signed-jwt-token"
    );
    assert.equal(extractVerificationToken({ verificationToken: "" }), null);
    assert.equal(extractVerificationToken({ verificationToken: 12345 }), null);
    assert.equal(extractVerificationToken({}), null);
    assert.equal(extractVerificationToken(null as unknown as VerifyOtpResponse), null);
  });

  await t.test("buildBusOwnerRegistrationPayload preserves all required bus-owner fields and normalizes phone", () => {
    const payload = buildBusOwnerRegistrationPayload(
      "+977-9811112222",
      "  Ram Owner  ",
      "  Shuvmarg Travels  ",
      "myOwnerPass123",
      "busowner-jwt-token"
    );
    assert.deepEqual(payload, {
      phone: "9811112222",
      name: "Ram Owner",
      companyName: "Shuvmarg Travels",
      password: "myOwnerPass123",
      verificationToken: "busowner-jwt-token",
    });
  });

  await t.test("isRegistrationVerificationError matches exact backend verification errors", () => {
    // True cases: exact backend error messages from utils/verificationToken.js
    assert.equal(
      isRegistrationVerificationError(401, "Verification token is required. Please complete OTP verification first."),
      true
    );
    assert.equal(
      isRegistrationVerificationError(400, "Verification session expired. Please verify your phone number again."),
      true
    );
    assert.equal(
      isRegistrationVerificationError(422, "Invalid verification token. Please complete OTP verification first."),
      true
    );
    assert.equal(
      isRegistrationVerificationError(400, "Verification token does not match the submitted phone number."),
      true
    );
    assert.equal(
      isRegistrationVerificationError(400, "Invalid verification token for this registration type."),
      true
    );

    // False cases: unrelated business or validation errors
    assert.equal(isRegistrationVerificationError(400, "Company name must be at least 3 characters."), false);
    assert.equal(isRegistrationVerificationError(400, "Bus owner account already exists."), false);
    assert.equal(isRegistrationVerificationError(500, "Internal server error"), false);
  });

  await t.test("getRegistrationRecoveryState returns step reset to otp with clear message", () => {
    const state = getRegistrationRecoveryState();
    assert.equal(state.step, "otp");
    assert.equal(state.verificationToken, "");
    assert.match(state.otpError, /no longer valid/i);
  });
});

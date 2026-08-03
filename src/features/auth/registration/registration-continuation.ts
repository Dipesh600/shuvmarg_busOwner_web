/**
 * src/features/auth/registration/registration-continuation.ts
 *
 * Pure continuation & error-classification logic for Bus-Owner Web registration.
 */

export type VerifyOtpResponse = {
  success?: boolean;
  verificationToken?: unknown;
  message?: string;
  exists?: boolean;
  userName?: string | null;
  existingRoles?: string[];
};

/**
 * Exact verification token error messages returned by backend (utils/verificationToken.js).
 * Lowercased and trimmed for exact matching.
 */
const EXACT_VERIFICATION_ERRORS = new Set([
  "verification token is required. please complete otp verification first.",
  "verification session expired. please verify your phone number again.",
  "invalid verification token. please complete otp verification first.",
  "verification token does not match the submitted phone number.",
  "invalid verification token for this registration type.",
]);

/**
 * Extracts signed verification token from verifyOTP response if valid string.
 */
export function extractVerificationToken(response: VerifyOtpResponse): string | null {
  if (
    response &&
    typeof response.verificationToken === "string" &&
    response.verificationToken.trim().length > 0
  ) {
    return response.verificationToken.trim();
  }
  return null;
}

/**
 * Constructs bus-owner registration payload preserving all required fields,
 * including optional email and address if provided.
 */
export function buildBusOwnerRegistrationPayload(
  phone: string,
  name: string,
  companyName: string,
  password: string,
  verificationToken: string,
  email?: string,
  address?: string
) {
  const digits = phone.replace(/\D/g, "");
  const cleanPhone = (digits.length === 13 && digits.startsWith("977")) ? digits.slice(3) : digits.slice(-10);
  const payload: Record<string, string> = {
    phone: cleanPhone,
    name: name.trim(),
    companyName: companyName.trim(),
    password,
    verificationToken,
  };
  if (email !== undefined) {
    payload.email = email.trim();
  }
  if (address !== undefined) {
    payload.address = address.trim();
  }
  return payload;
}

/**
 * Checks if a response error is specifically a verification-token session error.
 * Does NOT classify weak password, missing fields, or duplicate user errors as token errors.
 */
export function isRegistrationVerificationError(
  status: number,
  message?: string
): boolean {
  if (![400, 401, 422].includes(status) || !message) {
    return false;
  }

  const normalized = message.trim().toLowerCase();
  return EXACT_VERIFICATION_ERRORS.has(normalized);
}

/**
 * Returns recovery state object for registration when verification token has expired or is invalid.
 */
export function getRegistrationRecoveryState() {
  return {
    step: "otp" as const,
    verificationToken: "",
    otpError: "Your verification session is no longer valid. Please verify your phone number again.",
  };
}

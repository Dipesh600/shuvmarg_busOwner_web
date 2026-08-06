/**
 * src/features/operator-dashboard/operator-dashboard-api.ts
 *
 * API integration for the Operator Dashboard foundation.
 * Uses authFetch() to fetch profile and KYC status in parallel with explicit 404 handling.
 */

import { authFetch } from "@/lib/auth";
import {
  BusOwnerProfile,
  BusOwnerKycStatus,
  OperatorDashboardState,
  normalizeVerificationStatus,
  deriveCapabilities,
  deriveSetupEvidence,
} from "./operator-dashboard-contract";

/**
 * Fetches profile and KYC status to construct the unified OperatorDashboardState.
 * Explicitly treats /busowner/kyc-status 404 as "not_submitted".
 */
export async function fetchOperatorDashboardState(): Promise<OperatorDashboardState> {
  const [profileRes, kycRes] = await Promise.all([
    authFetch("/busowner/profile"),
    authFetch("/busowner/kyc-status"),
  ]);

  if (!profileRes.ok) {
    if (profileRes.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    throw new Error(
      `Failed to load operator profile (HTTP ${profileRes.status})`
    );
  }

  const profileJson = await profileRes.json();
  const profile: BusOwnerProfile | null = profileJson.data || profileJson;

  let kycStatus: BusOwnerKycStatus | null = null;
  let rawKycStatus: string | null = null;

  if (kycRes.ok) {
    const kycJson = await kycRes.json();
    kycStatus = kycJson.data || kycJson;
    rawKycStatus = kycStatus?.verificationStatus || null;
  } else if (kycRes.status === 404) {
    // 404 is the expected response when no KYC submission exists yet
    kycStatus = null;
    rawKycStatus = null;
  } else if (kycRes.status === 401) {
    throw new Error("UNAUTHORIZED");
  } else {
    throw new Error(`Failed to load KYC status (HTTP ${kycRes.status})`);
  }

  const verificationStatus = normalizeVerificationStatus(
    kycRes.status,
    rawKycStatus
  );

  const evidence = deriveSetupEvidence(profile, kycStatus, verificationStatus);
  const capabilities = deriveCapabilities(verificationStatus);

  return {
    isLoading: false,
    error: null,
    profile,
    kycStatus,
    verificationStatus,
    evidence,
    capabilities,
  };
}

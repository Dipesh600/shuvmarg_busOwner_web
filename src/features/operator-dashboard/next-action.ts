/**
 * src/features/operator-dashboard/next-action.ts
 *
 * Pure status-to-next-action mapper for the Shuvmarg Operator Dashboard.
 * Maps account verification status to the dominant single next action.
 */

import type { OperatorDashboardState } from "./operator-dashboard-contract.ts";

/**
 * Isolated compatibility route constant.
 * Routes to /onboarding until the standalone /dashboard/business/verification route is ready.
 */
export const COMPATIBILITY_ONBOARDING_ROUTE = "/onboarding";

export interface NextActionConfig {
  label: string;
  description: string;
  badge: string;
  href: string | null;
  disabled: boolean;
}

/**
 * Determines the single primary next action for the operator.
 */
export function determineNextAction(
  state: Pick<OperatorDashboardState, "verificationStatus">
): NextActionConfig {
  switch (state.verificationStatus) {
    case "not_submitted":
      return {
        label: "Complete business verification",
        description:
          "Submit your company registration and owner identification documents to begin account verification.",
        badge: "Action required",
        href: COMPATIBILITY_ONBOARDING_ROUTE,
        disabled: false,
      };

    case "pending":
      return {
        label: "Business verification is under review",
        description:
          "Our compliance team is currently reviewing your submitted business documents. No further action is required right now.",
        badge: "Under review",
        href: null,
        disabled: true,
      };

    case "rejected":
      return {
        label: "Review and resubmit business verification",
        description:
          "Your submission requires updates. Please review the feedback and update your documents.",
        badge: "Changes required",
        href: COMPATIBILITY_ONBOARDING_ROUTE,
        disabled: false,
      };

    case "approved":
      return {
        label: "Prepare your first vehicle",
        description:
          "Fleet registration will be available in the next setup step.",
        badge: "Upcoming step",
        href: null,
        disabled: true,
      };

    default:
      return {
        label: "Complete business verification",
        description:
          "Submit your company registration and owner identification documents to unlock live operations.",
        badge: "Action required",
        href: COMPATIBILITY_ONBOARDING_ROUTE,
        disabled: false,
      };
  }
}

/**
 * src/lib/config.ts
 *
 * Central configuration module for the Bus Owner (Operator) Web application.
 * Validates runtime environment variables and throws explicit configuration errors
 * if required variables are missing or blank.
 */

function getRequiredApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url || url.trim() === "") {
    throw new Error(
      "[Configuration Error] NEXT_PUBLIC_API_URL environment variable is missing. " +
        "Please specify NEXT_PUBLIC_API_URL in your environment or .env.local file (e.g. https://api-staging.shuvmarg.com/api)."
    );
  }
  return url.trim();
}

/**
 * Validated backend API URL.
 * Retains the required /api base-path contract.
 * Throws a clear configuration error if NEXT_PUBLIC_API_URL is missing or blank.
 */
export const API_URL: string = getRequiredApiUrl();

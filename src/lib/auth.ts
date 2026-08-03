/**
 * lib/auth.ts
 *
 * Single source of truth for auth token management.
 * No component or page should ever read/write tokens directly from localStorage.
 * All auth state goes through these functions.
 */

const ACCESS_TOKEN_KEY = "busowner_access_token";

import { API_URL as API } from "./config";

// ── Token storage ────────────────────────────────────────────────────────────

export function saveTokens(accessToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-change"));
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-change"));
  }
}

// ── Session helpers ──────────────────────────────────────────────────────────

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}

/**
 * Returns Authorization header for authenticated API calls.
 * Usage: fetch(url, { headers: getAuthHeaders() })
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

// ── Token refresh ────────────────────────────────────────────────────────────

let _refreshPromise: Promise<boolean> | null = null;

/**
 * Silently exchange the stored refresh token for a new access + refresh token pair.
 * Returns true if successful, false if the session is fully expired (user must re-login).
 *
 * Multiple concurrent callers share the same in-flight request (de-duplication).
 */
export async function refreshAccessToken(): Promise<boolean> {
  // De-duplicate concurrent refresh attempts
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${API}/auth/busowner/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Send HttpOnly cookie
      });

      if (!res.ok) {
        // Refresh token expired or revoked — clear everything
        clearTokens();
        return false;
      }

      const data = await res.json();
      saveTokens(data.accessToken);
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    _refreshPromise = null;
  });

  return _refreshPromise;
}

// ── Authenticated fetch (with auto-refresh on 401) ───────────────────────────

/**
 * Drop-in replacement for fetch() for authenticated API calls.
 * Automatically retries once with a fresh access token if the server returns 401.
 * If the refresh also fails, clears tokens and returns the original 401 response.
 *
 * Usage: const res = await authFetch("/api/busowner/myFleets")
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const makeRequest = () =>
    fetch(url.startsWith("http") ? url : `${API}${url}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...(options.headers as Record<string, string>),
      },
    });

  const res = await makeRequest();

  // If access token expired, try to refresh once
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return makeRequest(); // Retry with the new access token
    }
    // Refresh failed — session truly expired, caller handles redirect
  }

  return res;
}

// ── Logout ───────────────────────────────────────────────────────────────────

/**
 * Logs the user out:
 * 1. Tells the backend to revoke the refresh token (fire-and-forget, best effort)
 * 2. Clears local tokens immediately
 */
export async function logout(): Promise<void> {
  // Fire and forget — don't wait for the server, clear local state immediately
  fetch(`${API}/auth/busowner/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Send HttpOnly cookie
  }).catch(() => {
    // Intentionally silent — logout should never block the UI
  });

  clearTokens();
}

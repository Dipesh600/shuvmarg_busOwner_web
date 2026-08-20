function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function prettifyKey(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
}

function describeList(label: string, value: unknown): string | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  return `${label}: ${value.map((item) => prettifyKey(String(item))).join(", ")}`;
}

function describeDetails(details: unknown): string | null {
  if (!isRecord(details)) return null;

  const parts = [
    describeList("Missing details", details.missingFields),
    describeList("Missing documents", details.missingDocuments),
    describeList("Missing assets", details.missingAssets),
  ].filter(Boolean);

  if (parts.length > 0) return parts.join(". ");

  const field = typeof details.field === "string" ? prettifyKey(details.field) : null;
  if (field) return `Check ${field}.`;

  return null;
}

export function getApiErrorMessage(payload: unknown, status: number, fallback = "Request failed"): string {
  const fallbackMessage = `${fallback} (${status})`;
  if (!isRecord(payload)) return fallbackMessage;

  const candidates: unknown[] = [payload.message];
  if (isRecord(payload.error)) {
    candidates.push(payload.error.message, payload.error.details);
  } else {
    candidates.push(payload.error);
  }
  candidates.push(payload.details);

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate;
    if (isRecord(candidate)) {
      const nested = getApiErrorMessage(candidate, status, fallback);
      if (nested !== fallbackMessage) return nested;
      const detailText = describeDetails(candidate);
      if (detailText) return detailText;
    }
  }

  return fallbackMessage;
}

export class ApiResponseError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly details: unknown;
  readonly payload: unknown;

  constructor(response: Response, payload: unknown, fallback?: string) {
    super(getApiErrorMessage(payload, response.status, fallback));
    this.name = "ApiResponseError";
    this.status = response.status;
    this.payload = payload;

    const error = isRecord(payload) && isRecord(payload.error) ? payload.error : null;
    this.code = typeof error?.code === "string" ? error.code : null;
    this.details = error?.details ?? (isRecord(payload) ? payload.details : null);
  }
}

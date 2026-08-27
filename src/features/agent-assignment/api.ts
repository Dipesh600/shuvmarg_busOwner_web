import { ApiResponseError } from "@/lib/api-error";
import { authFetch } from "@/lib/auth";
import type { AgentAssignment, AgentPreview, AssignmentDraft, AssignmentOptions, AssignmentStatus } from "./agent-assignment-contract";
import { assignmentPayload } from "./agent-assignment-contract";

interface Envelope<T> { success: boolean; data: T; message?: string; }
interface Page<T> extends Envelope<T[]> { pagination: { page: number; limit: number; total: number; totalPages: number }; }

export type SmsStatus = "QUEUED" | "FAILED" | "NOT_REQUIRED";
export interface CreatedAgent {
  agentCode: string;
  name: string;
  smsSent: boolean;
  smsStatus?: SmsStatus;
  requiresAgentActivation: boolean;
}

async function read<T>(response: Response, fallback: string): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new ApiResponseError(response, payload, fallback);
  return payload as T;
}

export async function listAgentAssignments(filters: { brandId?: string; status?: AssignmentStatus; page?: number } = {}) {
  const query = new URLSearchParams({ limit: "50", page: String(filters.page || 1) });
  if (filters.brandId) query.set("brandId", filters.brandId);
  if (filters.status) query.set("status", filters.status);
  return read<Page<AgentAssignment>>(
    await authFetch(`/busowner/agents/assignments?${query.toString()}`),
    "Failed to load agents",
  );
}

export async function lookupAgent(code: string): Promise<AgentPreview> {
  const payload = await read<Envelope<AgentPreview>>(
    await authFetch(`/busowner/agents/lookup/${encodeURIComponent(code.trim())}`),
    "Agent not found",
  );
  return payload.data;
}

export async function listAssignmentOptions(brandId: string): Promise<AssignmentOptions> {
  const payload = await read<Envelope<AssignmentOptions>>(
    await authFetch(`/busowner/agents/assignment-options?brandId=${encodeURIComponent(brandId)}`),
    "Failed to load assignment choices",
  );
  return payload.data;
}

export async function inviteAgent(draft: AssignmentDraft): Promise<AgentAssignment> {
  const payload = await read<Envelope<AgentAssignment>>(
    await authFetch("/busowner/agents/assignments", {
      method: "POST", body: JSON.stringify(assignmentPayload(draft)),
    }),
    "Failed to invite agent",
  );
  return payload.data;
}

export async function createAgent(input: {
  name: string; phone: string; outletType: string; district: string; municipality: string; placeName: string; brandId?: string;
}) {
  const payload = await read<Envelope<CreatedAgent>>(
    await authFetch("/busowner/agents", { method: "POST", body: JSON.stringify(input) }),
    "Failed to create agent",
  );
  return payload.data;
}

export async function transitionAssignment(id: string, action: "suspend" | "reinstate" | "revoke", note?: string) {
  const payload = await read<Envelope<AgentAssignment>>(
    await authFetch(`/busowner/agents/assignments/${id}/${action}`, {
      method: "PATCH", body: JSON.stringify(note ? { note } : {}),
    }),
    `Failed to ${action} assignment`,
  );
  return payload.data;
}

import { authFetch } from "@/lib/auth";
import type { SeatLayoutRevision, SeatLayoutTemplate, SeatLayoutV3, TemplateDetail } from "./types";
async function request<T>(path: string, options?: RequestInit): Promise<T> { const response = await authFetch(`/busowner${path}`, options); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.message || `Request failed (${response.status})`); return payload.data as T; }
const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });
export const listCatalog = () => request<SeatLayoutTemplate[]>("/seat-layout-v3/catalog");
export const listMyLayouts = () => request<SeatLayoutTemplate[]>("/seat-layout-v3/templates");
export const getLayoutTemplate = (id: string) => request<TemplateDetail>(`/seat-layout-v3/templates/${id}`);
export const adoptTemplate = (id: string, name: string, templateCode: string) => request<{ template: SeatLayoutTemplate; revision: SeatLayoutRevision }>(`/seat-layout-v3/catalog/${id}/adopt`, json("POST", { name, templateCode }));
export const createRevision = (id: string, layout: SeatLayoutV3, changeSummary: string) => request<SeatLayoutRevision>(`/seat-layout-v3/templates/${id}/revisions`, json("POST", { layout, changeSummary }));
export const submitRevision = (templateId: string, revisionId: string) => request<SeatLayoutRevision>(`/seat-layout-v3/templates/${templateId}/revisions/${revisionId}/submit`, json("POST"));
export async function listFleets() { const response = await authFetch("/busowner/fleets?limit=100"); const payload = await response.json(); if (!response.ok) throw new Error(payload.message || "Unable to load fleets."); return (payload.data?.items || []) as Array<{ fleetId: string; busName: string; busNumber: string; approvalStatus: string }>; }
export const getFleetAssignment = (fleetId: string) => request<{ fleet: { id: string; name: string; number: string }; assignment: { activeRevision: { id: string } } | null }>(`/seat-layout-v3/fleets/${fleetId}/assignment`);
export const assignFleetLayout = (fleetId: string, revisionId: string) => request<unknown>(`/seat-layout-v3/fleets/${fleetId}/assignment`, json("POST", { revisionId }));
export const requestFleetLayoutChange = (fleetId: string, proposedRevisionId: string) => request<unknown>(`/seat-layout-v3/fleets/${fleetId}/change-requests`, json("POST", { proposedRevisionId }));

import { authFetch } from "@/lib/auth";
import { ApiResponseError } from "@/lib/api-error";
import type { SeatLayoutRevision, SeatLayoutTemplate, SeatLayoutV3, TemplateDetail } from "./types";
import { deduplicateLayoutFamilies } from "./library";
export { deduplicateLayoutFamilies } from "./library";
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await authFetch(`/busowner${path}`, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const fallback = response.status === 404
      ? "Seat layouts are not available on the connected server."
      : "Unable to load seat layouts.";
    throw new ApiResponseError(response, payload, fallback);
  }
  return payload.data as T;
}
const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });
export const listCatalog = () => request<SeatLayoutTemplate[]>("/seat-layout-v3/catalog");
export const listMyLayouts = () => request<SeatLayoutTemplate[]>("/seat-layout-v3/templates");
export async function loadSeatLayoutLibrary(): Promise<SeatLayoutTemplate[]> {
  const [mine, catalog] = await Promise.allSettled([listMyLayouts(), listCatalog()]);
  const layouts = [
    ...(mine.status === "fulfilled" ? mine.value : []),
    ...(catalog.status === "fulfilled" ? catalog.value : []),
  ];
  if (mine.status === "rejected" && catalog.status === "rejected") {
    throw mine.reason instanceof Error ? mine.reason : catalog.reason;
  }
  return deduplicateLayoutFamilies(layouts);
}

export const getLayoutTemplate = (id: string) => request<TemplateDetail>(`/seat-layout-v3/templates/${id}`);
export const adoptTemplate = (id: string, name: string, templateCode: string) => request<{ template: SeatLayoutTemplate; revision: SeatLayoutRevision }>(`/seat-layout-v3/catalog/${id}/adopt`, json("POST", { name, templateCode }));
export const createRevision = (id: string, layout: SeatLayoutV3, changeSummary: string) => request<SeatLayoutRevision>(`/seat-layout-v3/templates/${id}/revisions`, json("POST", { layout, changeSummary }));
export const submitRevision = (templateId: string, revisionId: string) => request<SeatLayoutRevision>(`/seat-layout-v3/templates/${templateId}/revisions/${revisionId}/submit`, json("POST"));
export async function listFleets() { const response = await authFetch("/busowner/fleets?limit=100"); const payload = await response.json(); if (!response.ok) throw new ApiResponseError(response, payload, "Unable to load fleets"); return (payload.data?.items || []) as Array<{ fleetId: string; busName: string; busNumber: string; approvalStatus: string }>; }
export const getFleetAssignment = (fleetId: string) => request<{ fleet: { id: string; name: string; number: string }; assignment: { activeRevision: { id: string } } | null }>(`/seat-layout-v3/fleets/${fleetId}/assignment`);
export const assignFleetLayout = (fleetId: string, revisionId: string) => request<unknown>(`/seat-layout-v3/fleets/${fleetId}/assignment`, json("POST", { revisionId }));
export const requestFleetLayoutChange = (fleetId: string, proposedRevisionId: string) => request<unknown>(`/seat-layout-v3/fleets/${fleetId}/change-requests`, json("POST", { proposedRevisionId }));
export const correctRejectedFleetLayout = (fleetId: string, proposedRevisionId: string) => request<unknown>(`/seat-layout-v3/fleets/${fleetId}/correction`, json("PATCH", { proposedRevisionId }));
export const createInitialCustomFleetLayout = (fleetId: string, input: { name: string; layout: SeatLayoutV3; sourceTemplateId?: string | null }) => request<{ assignment: unknown; template: SeatLayoutTemplate; revision: SeatLayoutRevision }>(`/seat-layout-v3/fleets/${fleetId}/initial-custom-layout`, json("POST", input));

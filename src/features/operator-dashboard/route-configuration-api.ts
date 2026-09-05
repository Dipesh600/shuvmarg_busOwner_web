import { authFetch } from "@/lib/auth";
import { ApiResponseError } from "@/lib/api-error";

export type OperatorStopBehavior =
  | "BOARDING_ONLY"
  | "DROPPING_ONLY"
  | "BOTH"
  | "REST_STOP";

export type OperatorBoardingPoint =
  | string
  | {
    _id?: string;
    id?: string;
    name?: string;
    landmark?: string;
  };

export interface OperatorRouteTiming {
  stopId: string;
  estimatedArrival: string;
  estimatedDeparture?: string;
  haltDuration?: number;
  dayOffset: number;
  stopBehavior: OperatorStopBehavior;
}

export interface OperatorBoardingConfig {
  stopId: string;
  boardingPointIds: string[];
}

export interface OperatorRouteStop {
  _id: string;
  sequence?: number;
  distanceFromOriginKm?: number | null;
  durationFromOriginMins?: number | null;
  estimatedMinutesFromOrigin?: number | null;
  stopId: {
    _id: string;
    name?: string;
    code?: string;
    type?: string;
  };
  isActive: boolean;
  boardingPoints?: OperatorBoardingPoint[];
  timing?: OperatorRouteTiming | null;
}

export interface AvailableOperatorVariant {
  _id: string;
  code?: string;
  name?: string;
  direction?: string;
  stopCount?: number;
  patternCount?: number;
  configuredPatterns?: Array<{ id?: string; _id?: string; name?: string; isDefault?: boolean }>;
  corridorId?: {
    _id?: string;
    id?: string;
    code?: string;
    originId?: { name?: string; code?: string };
    destinationId?: { name?: string; code?: string };
  };
}

export interface OperatorRouteConfig {
  _id: string;
  patternName?: string;
  isDefault?: boolean;
  status?: string;
  fleetId?: string | { _id?: string; id?: string } | null;
  returnOverridden?: boolean;
  variantId?: {
    _id?: string;
    id?: string;
    name?: string;
    code?: string;
    direction?: string;
    corridorId?: AvailableOperatorVariant["corridorId"];
  } | string;
}

export interface OperatorRouteConfigPayload {
  activeStops: string[];
  boardingConfig: OperatorBoardingConfig[];
  timingConfig: OperatorRouteTiming[];
  returnActiveStops?: string[];
  returnBoardingConfig?: OperatorBoardingConfig[];
  returnTimingConfig?: OperatorRouteTiming[];
  returnOverridden?: boolean;
}

export interface CreateOperatorRouteConfigPayload extends OperatorRouteConfigPayload {
  brandId: string;
  variantId: string;
  fleetId: string;
  patternName: string;
  status?: "ACTIVE" | "DRAFT";
}

export type UpdateOperatorRouteConfigPayload = Partial<OperatorRouteConfigPayload> & {
  notes?: string;
  patternName?: string;
  fleetId?: string;
  status?: "ACTIVE" | "DRAFT";
};

export interface ReturnVariantStopsResult {
  hasReturnVariant: boolean;
  stops: OperatorRouteStop[];
  returnOverridden: boolean;
  returnVariantId?: string;
  configId?: string | null;
}

type ApiListResponse<T> = { success: boolean; results?: number; data?: T[] };
type ApiItemResponse<T> = { success: boolean; data?: T };

async function read<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new ApiResponseError(response, payload);
  return payload as T;
}

export async function getAvailableOperatorVariants(
  brandId: string,
  fleetId?: string | null,
): Promise<AvailableOperatorVariant[]> {
  const params = new URLSearchParams({ brandId });
  if (fleetId) params.set("fleetId", fleetId);
  const payload = await read<ApiListResponse<AvailableOperatorVariant>>(
    await authFetch(`/busowner/operator-config/variants?${params.toString()}`),
  );
  return payload.data || [];
}

export async function getOperatorRouteConfigs(
  brandId: string,
  fleetId?: string | null,
): Promise<OperatorRouteConfig[]> {
  const params = fleetId ? `?${new URLSearchParams({ fleetId }).toString()}` : "";
  const payload = await read<ApiListResponse<OperatorRouteConfig>>(
    await authFetch(`/busowner/operator-config/${encodeURIComponent(brandId)}${params}`),
  );
  return payload.data || [];
}

export async function getVariantStopsWithConfig(
  brandId: string,
  variantId: string,
  configId?: string | null,
  fleetId?: string | null,
): Promise<OperatorRouteStop[]> {
  const search = new URLSearchParams();
  if (configId) search.set("configId", configId);
  if (fleetId) search.set("fleetId", fleetId);
  const params = search.size ? `?${search.toString()}` : "";
  const payload = await read<ApiListResponse<OperatorRouteStop>>(
    await authFetch(`/busowner/operator-config/${encodeURIComponent(brandId)}/variant/${encodeURIComponent(variantId)}/stops${params}`),
  );
  return payload.data || [];
}

export async function getReturnVariantStops(
  brandId: string,
  variantId: string,
  configId?: string | null,
  fleetId?: string | null,
): Promise<ReturnVariantStopsResult> {
  const search = new URLSearchParams();
  if (configId) search.set("configId", configId);
  if (fleetId) search.set("fleetId", fleetId);
  const params = search.size ? `?${search.toString()}` : "";
  const payload = await read<ApiItemResponse<ReturnVariantStopsResult>>(
    await authFetch(`/busowner/operator-config/${encodeURIComponent(brandId)}/variant/${encodeURIComponent(variantId)}/return-stops${params}`),
  );
  return payload.data || { hasReturnVariant: false, stops: [], returnOverridden: false };
}

export async function saveOperatorRouteConfig(
  payload: CreateOperatorRouteConfigPayload,
): Promise<OperatorRouteConfig | null> {
  const response = await read<ApiItemResponse<OperatorRouteConfig>>(
    await authFetch("/busowner/operator-config", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
  return response.data || null;
}

export async function updateOperatorRouteConfig(
  configId: string,
  payload: UpdateOperatorRouteConfigPayload,
): Promise<OperatorRouteConfig | null> {
  const response = await read<ApiItemResponse<OperatorRouteConfig>>(
    await authFetch(`/busowner/operator-config/${encodeURIComponent(configId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  );
  return response.data || null;
}

export function getRouteVariantId(config: OperatorRouteConfig): string | null {
  if (!config.variantId) return null;
  if (typeof config.variantId === "string") return config.variantId;
  return config.variantId._id || config.variantId.id || null;
}

export function getVariantCorridorId(variant?: AvailableOperatorVariant | null): string | null {
  return variant?.corridorId?._id || variant?.corridorId?.id || null;
}

export function getBoardingPointId(point: OperatorBoardingPoint): string | null {
  if (typeof point === "string") return point;
  return point._id || point.id || null;
}

import { authFetch } from "@/lib/auth";
import { ApiResponseError } from "@/lib/api-error";
import type {
  CanonicalBoardingLocation, FleetRouteEndpoint, FleetRouteVariantOption, FleetServedStop,
} from "./route-types";
import type { FleetRegistrationDraft } from "./types";

async function read<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new ApiResponseError(response, payload);
  return payload;
}

export async function searchRouteEndpoints(
  query: string,
  purpose: "ENDPOINT" | "ROUTE_STOP" = "ENDPOINT"
): Promise<FleetRouteEndpoint[]> {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  params.set("purpose", purpose);
  const payload = await read<{ data?: FleetRouteEndpoint[] }>(
    await authFetch(`/busowner/fleet-route-setup/stops?${params.toString()}`)
  );
  return payload.data || [];
}

export interface FleetRouteOptionsResponse {
  status: "AVAILABLE" | "NEEDS_PLATFORM_REVIEW";
  direction?: "FORWARD" | "RETURN";
  corridor: { id: string; code: string } | null;
  variants: FleetRouteVariantOption[];
}

export async function getFleetRouteOptions(
  originStopId: string,
  destinationStopId: string
): Promise<FleetRouteOptionsResponse> {
  const params = new URLSearchParams({ originStopId, destinationStopId });
  const payload = await read<{ data: FleetRouteOptionsResponse }>(
    await authFetch(`/busowner/fleet-route-setup/options?${params.toString()}`)
  );
  return payload.data;
}

export async function listStopBoardingLocations(stopId: string): Promise<{
  locations: CanonicalBoardingLocation[];
}> {
  const params = new URLSearchParams({ stopId });
  const payload = await read<{ data: { locations?: CanonicalBoardingLocation[] } }>(
    await authFetch(`/busowner/fleet-route-setup/boarding-locations?${params.toString()}`)
  );
  return { locations: payload.data.locations || [] };
}

export async function saveFleetRouteSetup(
  fleetId: string,
  draft: FleetRegistrationDraft
): Promise<void> {
  const route = draft.route;
  const isCustomOrigin = Boolean(route.originStop?.isCustom);
  const isCustomDestination = Boolean(route.destinationStop?.isCustom);

  await read(await authFetch(`/busowner/fleets/${fleetId}/route-setup`, {
    method: "PUT",
    body: JSON.stringify({
      brandId: draft.vehicle.brandId,
      originStopId: isCustomOrigin ? null : route.originStop?.id,
      destinationStopId: isCustomDestination ? null : route.destinationStop?.id,
      customOrigin: isCustomOrigin ? {
        name: route.originStop?.name || "",
        coordinates: route.originStop?.coordinates || null,
        address: [route.originStop?.municipality, route.originStop?.district, route.originStop?.province].filter(Boolean).join(", "),
      } : null,
      customDestination: isCustomDestination ? {
        name: route.destinationStop?.name || "",
        coordinates: route.destinationStop?.coordinates || null,
        address: [route.destinationStop?.municipality, route.destinationStop?.district, route.destinationStop?.province].filter(Boolean).join(", "),
      } : null,
      corridorId: route.corridorId,
      variantId: route.selectedVariant?.id || null,
      direction: route.direction,
      servedStops: route.servedStops,
      unresolvedPlaces: route.addedPlaces,
      returnEnabled: route.returnEnabled,
      resolutionStatus: (isCustomOrigin || isCustomDestination || route.resolutionStatus !== "AVAILABLE")
        ? "NEEDS_PLATFORM_REVIEW"
        : "AVAILABLE",
    }),
  }));
}

export async function getReusableRouteSetup(brandId: string, variantId: string): Promise<{
  source: "FLEET_SETUP" | "OPERATOR_SERVICE";
  servedStops: FleetServedStop[];
  returnEnabled: boolean;
} | null> {
  const params = new URLSearchParams({ brandId, variantId });
  const payload = await read<{ data: {
    source: "FLEET_SETUP" | "OPERATOR_SERVICE";
    servedStops: FleetServedStop[];
    returnEnabled: boolean;
  } | null }>(await authFetch(`/busowner/fleet-route-setup/reusable?${params.toString()}`));
  return payload.data;
}

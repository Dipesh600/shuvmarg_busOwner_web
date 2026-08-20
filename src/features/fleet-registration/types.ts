import type { SeatLayoutV3 } from "@/features/seat-layout-v3/types";
import type {
  FleetRouteEndpoint, FleetRouteVariantOption, FleetServedStop,
  FleetRouteAddedPlace,
} from "./route-types";

export type FleetStep = "vehicle" | "layout" | "photos" | "documents" | "route" | "review";
export interface FleetVehicleDraft { brandId: string; busName: string; busNumber: string; busType: string; vehicleType: string; registrationYear: string; amenityIds: string[]; }
export interface FleetRouteDraft {
  origin: string;
  destination: string;
  viaStops: string;
  originStop: FleetRouteEndpoint | null;
  destinationStop: FleetRouteEndpoint | null;
  corridorId: string | null;
  corridorCode: string | null;
  direction: "FORWARD" | "RETURN" | null;
  selectedVariant: FleetRouteVariantOption | null;
  servedStops: FleetServedStop[];
  addedPlaces: FleetRouteAddedPlace[];
  returnEnabled: boolean;
  resolutionStatus: "UNRESOLVED" | "AVAILABLE" | "NEEDS_PLATFORM_REVIEW";
}
export interface FleetLayoutChoice { templateId: string | null; templateName: string; revisionId: string | null; totalPlaces: number; layout: SeatLayoutV3; customized?: boolean; sourceTemplateId?: string | null; templateScope?: "PLATFORM" | "OPERATOR"; }
export interface FleetFiles { photos: { front: File | null; rear: File | null; side: File | null; cabin: File | null }; fitnessCert: File | null; insurance: File | null; bluebook: File | null; routePermit: File | null; }
export interface FleetDocumentMetadata { fitnessValidTill: string; insurancePolicyNumber: string; insuranceValidTill: string; routePermitValidTill: string; }
export interface FleetRegistrationDraft { vehicle: FleetVehicleDraft; route: FleetRouteDraft; layout: FleetLayoutChoice | null; files: FleetFiles; documents: FleetDocumentMetadata; }
export const EMPTY_FLEET_DRAFT: FleetRegistrationDraft = { vehicle: { brandId: "", busName: "", busNumber: "", busType: "DELUXE", vehicleType: "BUS", registrationYear: "", amenityIds: [] }, route: { origin: "", destination: "", viaStops: "", originStop: null, destinationStop: null, corridorId: null, corridorCode: null, direction: null, selectedVariant: null, servedStops: [], addedPlaces: [], returnEnabled: true, resolutionStatus: "UNRESOLVED" }, layout: null, files: { photos: { front: null, rear: null, side: null, cabin: null }, fitnessCert: null, insurance: null, bluebook: null, routePermit: null }, documents: { fitnessValidTill: "", insurancePolicyNumber: "", insuranceValidTill: "", routePermitValidTill: "" } };

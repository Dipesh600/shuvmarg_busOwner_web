import type { SeatLayoutV3 } from "@/features/seat-layout-v3/types";

export type FleetStep = "vehicle" | "layout" | "photos" | "documents" | "route" | "review";
export interface FleetVehicleDraft { busName: string; busNumber: string; busType: string; vehicleType: string; registrationYear: string; amenityIds: string[]; }
export interface FleetRouteDraft { origin: string; destination: string; viaStops: string; }
export interface FleetLayoutChoice { templateId: string | null; templateName: string; revisionId: string | null; totalPlaces: number; layout: SeatLayoutV3; customized?: boolean; sourceTemplateId?: string | null; templateScope?: "PLATFORM" | "OPERATOR"; }
export interface FleetFiles { photos: { front: File | null; rear: File | null; side: File | null; cabin: File | null }; fitnessCert: File | null; insurance: File | null; bluebook: File | null; routePermit: File | null; }
export interface FleetDocumentMetadata { fitnessValidTill: string; insurancePolicyNumber: string; insuranceValidTill: string; routePermitValidTill: string; }
export interface FleetRegistrationDraft { vehicle: FleetVehicleDraft; route: FleetRouteDraft; layout: FleetLayoutChoice | null; files: FleetFiles; documents: FleetDocumentMetadata; }
export const EMPTY_FLEET_DRAFT: FleetRegistrationDraft = { vehicle: { busName: "", busNumber: "", busType: "DELUXE", vehicleType: "BUS", registrationYear: "", amenityIds: [] }, route: { origin: "", destination: "", viaStops: "" }, layout: null, files: { photos: { front: null, rear: null, side: null, cabin: null }, fitnessCert: null, insurance: null, bluebook: null, routePermit: null }, documents: { fitnessValidTill: "", insurancePolicyNumber: "", insuranceValidTill: "", routePermitValidTill: "" } };

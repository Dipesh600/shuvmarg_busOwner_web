export interface FleetRouteEndpoint {
  id: string;
  code: string | null;
  name: string;
  parentStop: { id: string; name: string } | null;
  district: string | null;
  municipality: string | null;
  province: string | null;
  isRouteStop: boolean;
  coordinates: { lat: number; lng: number } | null;
  isCustom?: boolean;
}

export interface FleetRouteStop extends FleetRouteEndpoint {
  sequence: number;
  distanceFromOriginKm: number | null;
  durationFromOriginMins: number;
  isMajor: boolean;
}

export interface FleetRouteVariantOption {
  id: string;
  code: string;
  name: string;
  direction: "FORWARD" | "RETURN";
  type: string;
  distanceKm: number | null;
  durationMinutes: number | null;
  returnVariantId: string | null;
  stops: FleetRouteStop[];
}

export type StopUsage = "PICKUP" | "DROP" | "BOTH";

export interface CustomBoardingPoint {
  clientKey: string;
  name: string;
  counterNumber?: string;
  contactName?: string;
  contactPhone?: string;
  reportingInstructions?: string;
  landmark?: string;
  coordinates?: { lat: number; lng: number } | null;
}

export interface FleetServedStop {
  stopId: string;
  name: string;
  sequence: number;
  usage: StopUsage;
  boardingMode: "STOP_FALLBACK" | "BOARDING_LOCATIONS";
  boardingLocationIds: string[];
  customBoardingPoints?: CustomBoardingPoint[];
  meetingDetails: {
    displayName: string;
    counterNumber: string;
    contactName: string;
    contactPhone: string;
    reportingInstructions: string;
  };
}

export interface FleetRouteAddedPlace {
  clientKey: string;
  name: string;
  existingStopId: string | null;
  insertAfterStopId: string;
  coordinates: { lat: number; lng: number } | null;
  address: string;
  usage: StopUsage;
  customBoardingPoints?: CustomBoardingPoint[];
  meetingDetails: FleetServedStop["meetingDetails"];
}

export interface CanonicalBoardingLocation {
  id: string;
  name: string;
  landmark: string | null;
  address: string | null;
  coordinates: { lat: number; lng: number } | null;
}

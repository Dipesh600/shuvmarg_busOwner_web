import type { FleetRegistrationDraft, FleetStep } from "./types";

export function validateFleetStep(step: FleetStep, draft: FleetRegistrationDraft): string | null {
  if (step === "vehicle") {
    if (!draft.vehicle.brandId || !draft.vehicle.brandId.trim()) return "Select an active operator brand.";
    if (!draft.vehicle.busName.trim() || !draft.vehicle.busNumber.trim() || !draft.vehicle.registrationYear.trim()) return "Add the vehicle name, plate number and registration year.";
    const year = Number(draft.vehicle.registrationYear);
    if (!Number.isInteger(year) || year < 1980 || year > new Date().getFullYear() + 1) return "Enter a valid registration year.";
  }
  if (step === "layout" && !draft.layout) return "Choose a published seat layout before continuing.";
  if (step === "photos" && Object.values(draft.files.photos).some((file) => !file)) return "Add front, rear, side and interior photos.";
  if (step === "documents" && (!draft.files.fitnessCert || !draft.files.insurance || !draft.files.bluebook || !draft.files.routePermit)) return "Upload all four required compliance documents.";
  if (step === "route") {
    if (!draft.route.originStop?.name?.trim() || !draft.route.destinationStop?.name?.trim()) {
      return "Choose where this bus starts and ends.";
    }
    if (
      (draft.route.originStop.id && draft.route.originStop.id === draft.route.destinationStop.id) ||
      (draft.route.originStop.name.trim().toLowerCase() === draft.route.destinationStop.name.trim().toLowerCase())
    ) {
      return "Choose two different route endpoints.";
    }
    if (draft.route.resolutionStatus === "AVAILABLE" && !draft.route.selectedVariant) {
      return "Choose the road path this bus uses.";
    }
    if (draft.route.resolutionStatus === "AVAILABLE" && draft.route.servedStops.length < 2) {
      return "Keep at least the starting and ending stops in this service.";
    }
  }
  return null;
}

export function validateFleetDraft(draft: FleetRegistrationDraft): string | null {
  for (const step of ["vehicle", "layout", "photos", "documents", "route"] as FleetStep[]) { const issue = validateFleetStep(step, draft); if (issue) return issue; }
  return null;
}

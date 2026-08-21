import type { FleetRegistrationDraft, FleetStep } from "./types";
import type { FleetReviewRequirementKey } from "./api";

const clean = (value: unknown) => String(value ?? "").trim();

export function validateFleetStep(step: FleetStep, draft: FleetRegistrationDraft): string | null {
  if (step === "vehicle") {
    if (!clean(draft.vehicle.brandId)) return "Select an active operator brand.";
    if (!clean(draft.vehicle.busName) || !clean(draft.vehicle.busNumber) || !clean(draft.vehicle.registrationYear)) return "Add the vehicle name, plate number and registration year.";
    const year = Number(draft.vehicle.registrationYear);
    if (!Number.isInteger(year) || year < 1980 || year > new Date().getFullYear() + 1) return "Enter a valid registration year.";
  }
  if (step === "layout" && !draft.layout) return "Choose a published seat layout before continuing.";
  if (step === "photos" && Object.values(draft.files.photos).some((file) => !file)) return "Add front, rear, side and interior photos.";
  if (step === "documents") {
    if (!draft.files.fitnessCert || !draft.files.insurance || !draft.files.bluebook || !draft.files.routePermit) return "Upload all four required compliance documents.";
    if (!clean(draft.documents.insurancePolicyNumber)) return "Add the insurance policy number.";
    if (!clean(draft.documents.fitnessValidTill) || !clean(draft.documents.insuranceValidTill) || !clean(draft.documents.routePermitValidTill)) return "Choose the expiry date for the fitness certificate, insurance and route permit.";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (const value of [draft.documents.fitnessValidTill, draft.documents.insuranceValidTill, draft.documents.routePermitValidTill]) {
      const dateOnly = String(value).match(/^\d{4}-\d{2}-\d{2}/)?.[0];
      const date = new Date(dateOnly ? `${dateOnly}T00:00:00` : value);
      if (Number.isNaN(date.getTime()) || date < today) return "Document expiry dates must be today or later.";
    }
  }
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

export function validateFleetCorrectionStep(step: FleetStep, draft: FleetRegistrationDraft, rejected: FleetReviewRequirementKey[]): string | null {
  if (step === "vehicle" && rejected.includes("vehicleDetails")) return validateFleetStep("vehicle", draft);
  if (step === "layout" && rejected.includes("seatLayout")) return validateFleetStep("layout", draft);
  if (step === "photos" && rejected.includes("fleetImages")) {
    const replacements = Object.values(draft.files.photos);
    if (replacements.some((file) => !(file instanceof Blob))) return "Replace all four requested vehicle photos before continuing.";
  }
  if (step === "documents") {
    const localFile = (key: "fitnessCert" | "insurance" | "bluebook" | "routePermit") => draft.files[key] instanceof Blob;
    if (rejected.includes("fitnessCert") && (!localFile("fitnessCert") || !clean(draft.documents.fitnessValidTill))) return "Upload the corrected fitness certificate and choose its expiry date.";
    if (rejected.includes("insurance") && (!localFile("insurance") || !clean(draft.documents.insurancePolicyNumber) || !clean(draft.documents.insuranceValidTill))) return "Upload the corrected insurance document, policy number and expiry date.";
    if (rejected.includes("bluebook") && !localFile("bluebook")) return "Upload the corrected vehicle bluebook.";
    if (rejected.includes("routePermit") && (!localFile("routePermit") || !clean(draft.documents.routePermitValidTill))) return "Upload the corrected route permit and choose its expiry date.";
    const correctedDates = [
      rejected.includes("fitnessCert") ? draft.documents.fitnessValidTill : null,
      rejected.includes("insurance") ? draft.documents.insuranceValidTill : null,
      rejected.includes("routePermit") ? draft.documents.routePermitValidTill : null,
    ].filter(Boolean) as string[];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (correctedDates.some((value) => {
      const dateOnly = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
      const date = new Date(dateOnly ? `${dateOnly}T00:00:00` : value);
      return Number.isNaN(date.getTime()) || date < today;
    })) return "Corrected document expiry dates must be today or later.";
  }
  if (step === "route" && rejected.includes("routeSetup")) return validateFleetStep("route", draft);
  return null;
}

export function validateFleetCorrectionDraft(draft: FleetRegistrationDraft, rejected: FleetReviewRequirementKey[]): string | null {
  for (const step of ["vehicle", "layout", "photos", "documents", "route"] as FleetStep[]) {
    const issue = validateFleetCorrectionStep(step, draft, rejected);
    if (issue) return issue;
  }
  return null;
}

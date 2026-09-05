"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Clock3, X, Loader2, XCircle } from "lucide-react";
import { getFleetDetail, getFleetSubmissionFileUrls } from "@/features/fleet-registration/api";
import ReviewStep from "@/features/fleet-registration/steps/ReviewStep";
import type { FleetAmenitySelection, FleetRegistrationDraft } from "@/features/fleet-registration/types";
import type { FleetRouteAddedPlace, FleetServedStop } from "@/features/fleet-registration/route-types";
import type { SeatLayoutV3 } from "@/features/seat-layout-v3/types";
import type { FleetReviewRequirement, FleetReviewRequirementKey } from "@/features/fleet-registration/api";

interface SubmittedFleetPreviewModalProps {
  fleetId: string;
  ownerId: string;
  onClose: () => void;
}

const REVIEW_LABELS: Record<FleetReviewRequirementKey, string> = {
  vehicleDetails: "Bus details",
  fleetImages: "Bus photos",
  fitnessCert: "Fitness certificate",
  insurance: "Passenger insurance",
  bluebook: "Bus bluebook",
  routePermit: "Route permit",
  seatLayout: "Seat layout",
  routeSetup: "Journey and stops",
};

// Sentinel object used to indicate "file exists on server but no local Blob"
// ReviewStep checks `Boolean(file)` for hasFile and `file instanceof Blob` for objectURL
const SERVER_FILE_SENTINEL = { __serverFile: true } as unknown as File;

interface SubmittedDocumentDescriptor {
  present?: boolean;
  validTill?: string;
  policyNumber?: string;
}

interface SubmittedFleetRecord {
  approvalStatus?: string;
  submittedAt?: string | null;
  reviewRequirements?: Partial<Record<FleetReviewRequirementKey, FleetReviewRequirement>>;
  brandId?: string;
  busName?: string;
  busNumber?: string;
  busType?: string;
  vehicleType?: string;
  registrationYear?: string;
  totalSeats?: number;
  features?: Array<string | FleetAmenitySelection>;
  vehicle?: {
    busName?: string;
    busNumber?: string;
    busType?: string;
    vehicleType?: string;
    registrationYear?: string;
    totalSeats?: number;
    features?: Array<string | FleetAmenitySelection>;
  };
  documents?: Record<string, SubmittedDocumentDescriptor> & {
    fleetImages?: SubmittedDocumentDescriptor & {
      count?: number;
      images?: Array<{ view?: string | null }>;
    };
  };
  route?: {
    origin?: string;
    destination?: string;
    originStop?: FleetRegistrationDraft["route"]["originStop"];
    destinationStop?: FleetRegistrationDraft["route"]["destinationStop"];
    corridorId?: string | null;
    corridorCode?: string | null;
    direction?: FleetRegistrationDraft["route"]["direction"];
    selectedVariant?: FleetRegistrationDraft["route"]["selectedVariant"];
    servedStops?: Array<Partial<FleetServedStop> & { stopId?: string; name?: string }>;
    addedPlaces?: Array<Partial<FleetRouteAddedPlace> & { name?: string }>;
    returnEnabled?: boolean;
  };
  seatLayout?: {
    templateId?: string | null;
    revisionId?: string | null;
    totalPlaces?: number;
    layout?: SeatLayoutV3;
  };
}

export default function SubmittedFleetPreviewModal({ fleetId, ownerId, onClose }: SubmittedFleetPreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<FleetRegistrationDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState("PENDING");
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [reviewRequirements, setReviewRequirements] = useState<SubmittedFleetRecord["reviewRequirements"]>({});
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    getFleetDetail(fleetId)
      .then(async (res) => {
        // Backend returns { fleet: {...} } or the object directly
        const data = res as SubmittedFleetRecord;
        setReviewStatus(String(data.approvalStatus || "PENDING").toUpperCase());
        setSubmittedAt(data.submittedAt || null);
        setReviewRequirements(data.reviewRequirements || {});

        // ── Documents ────────────────────────────────────────────────
        const docs = data.documents || {};
        const fileUrls = await getFleetSubmissionFileUrls(fleetId, docs);

        const imageViews = new Set(
          (docs.fleetImages?.images || []).map((image: { view?: string | null }) =>
            String(image.view || "").toLowerCase(),
          ),
        );
        const legacyImagesPresent = imageViews.size === 0 && (docs.fleetImages?.count ?? 0) > 0;
        const photosPresent = {
          front: (fileUrls.photos.front || (legacyImagesPresent || imageViews.has("front") ? SERVER_FILE_SENTINEL : null)) as File | null,
          rear:  (fileUrls.photos.rear || (legacyImagesPresent || imageViews.has("rear") || imageViews.has("back") ? SERVER_FILE_SENTINEL : null)) as File | null,
          side:  (fileUrls.photos.side || (legacyImagesPresent || imageViews.has("side") ? SERVER_FILE_SENTINEL : null)) as File | null,
          cabin: (fileUrls.photos.cabin || (legacyImagesPresent || imageViews.has("cabin") || imageViews.has("inside") ? SERVER_FILE_SENTINEL : null)) as File | null,
        };

        // ── Route setup ──────────────────────────────────────────────
        const routeSetup = data.route; // populated by the backend now

        const servedStops: FleetServedStop[] = (routeSetup?.servedStops || []).map((s, index) => ({
          stopId: String(s.stopId || ""),
          name: s.name || "Stop",
          sequence: s.sequence ?? index + 1,
          usage: s.usage || "BOTH",
          meetingDetails: {
            displayName: s.meetingDetails?.displayName || "",
            counterNumber: s.meetingDetails?.counterNumber || "",
            contactName: s.meetingDetails?.contactName || "",
            contactPhone: s.meetingDetails?.contactPhone || "",
            reportingInstructions: s.meetingDetails?.reportingInstructions || "",
          },
          boardingMode: s.boardingMode || "STOP_FALLBACK",
          boardingLocationIds: s.boardingLocationIds || [],
          customBoardingPoints: s.customBoardingPoints || [],
        }));

        const addedPlaces: FleetRouteAddedPlace[] = (routeSetup?.addedPlaces || []).map((p, index) => ({
          clientKey: p.clientKey || `submitted-place-${index}`,
          name: p.name || "Place",
          existingStopId: p.existingStopId || null,
          insertAfterStopId: p.insertAfterStopId || "",
          address: p.address || "",
          usage: p.usage || "BOTH",
          coordinates: p.coordinates || null,
          customBoardingPoints: p.customBoardingPoints || [],
          meetingDetails: {
            displayName: p.meetingDetails?.displayName || "",
            counterNumber: p.meetingDetails?.counterNumber || "",
            contactName: p.meetingDetails?.contactName || "",
            contactPhone: p.meetingDetails?.contactPhone || "",
            reportingInstructions: p.meetingDetails?.reportingInstructions || "",
          },
        }));

        // ── Map to FleetRegistrationDraft ────────────────────────────
        const features = data.features || data.vehicle?.features || [];
        const mappedDraft: FleetRegistrationDraft = {
          vehicle: {
            brandId: data.brandId || "",
            busName: data.busName || data.vehicle?.busName || "",
            busNumber: data.busNumber || data.vehicle?.busNumber || "",
            busType: data.busType || data.vehicle?.busType || "DELUXE",
            vehicleType: data.vehicleType || data.vehicle?.vehicleType || "BUS",
            registrationYear: String(data.registrationYear || data.vehicle?.registrationYear || ""),
            amenityIds: features.map((item) => typeof item === "string" ? item : item.id).filter((id): id is string => Boolean(id)),
            amenityDetails: features.flatMap((item) => typeof item !== "string" && item.id && item.name ? [{ ...item, type: item.type || "GLOBAL" }] : []),
          },
          route: {
            origin: routeSetup?.origin || "",
            destination: routeSetup?.destination || "",
            viaStops: "",
            originStop: (routeSetup?.originStop || null) as FleetRegistrationDraft["route"]["originStop"],
            destinationStop: (routeSetup?.destinationStop || null) as FleetRegistrationDraft["route"]["destinationStop"],
            corridorId: routeSetup?.corridorId || null,
            corridorCode: routeSetup?.corridorCode || null,
            direction: routeSetup?.direction || null,
            selectedVariant: routeSetup?.selectedVariant || null,
            servedStops,
            addedPlaces,
            returnEnabled: routeSetup?.returnEnabled ?? true,
            resolutionStatus: "AVAILABLE",
          },
          layout: {
            templateId: data.seatLayout?.templateId || null,
            templateName: "Submitted Layout",
            revisionId: data.seatLayout?.revisionId || null,
            totalPlaces: data.seatLayout?.totalPlaces || data.totalSeats || data.vehicle?.totalSeats || 0,
            layout: data.seatLayout?.layout || { schemaVersion: 3, vehicleCategory: "BUS", sections: [] },
          },
          files: {
            photos: photosPresent,
            fitnessCert: (fileUrls.documents.fitnessCert || (docs.fitnessCert?.present ? SERVER_FILE_SENTINEL : null)) as File | null,
            insurance:   (fileUrls.documents.insurance || (docs.insurance?.present ? SERVER_FILE_SENTINEL : null)) as File | null,
            bluebook:    (fileUrls.documents.bluebook || (docs.bluebook?.present ? SERVER_FILE_SENTINEL : null)) as File | null,
            routePermit: (fileUrls.documents.routePermit || (docs.routePermit?.present ? SERVER_FILE_SENTINEL : null)) as File | null,
          },
          documents: {
            fitnessValidTill:      docs.fitnessCert?.validTill   || "",
            insurancePolicyNumber: docs.insurance?.policyNumber   || "",
            insuranceValidTill:    docs.insurance?.validTill      || "",
            routePermitValidTill:  docs.routePermit?.validTill    || "",
          },
        };

        setDraft(mappedDraft);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load fleet details:", err);
        setError("Failed to load details");
        setLoading(false);
      });
  }, [fleetId, ownerId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#1A1210]/45 p-0 backdrop-blur-[2px]">
        <div className="flex h-40 w-40 flex-col items-center justify-center rounded-2xl bg-white shadow-2xl" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-[#7A1D1B]" />
          <p className="mt-4 text-xs font-bold text-[#6D655F]">Loading details...</p>
        </div>
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#1A1210]/45 p-0 backdrop-blur-[2px]">
        <div className="flex max-w-sm flex-col items-center justify-center rounded-2xl bg-white p-6 shadow-2xl" role="alertdialog" aria-modal="true" aria-labelledby="fleet-preview-error">
          <p id="fleet-preview-error" className="text-sm font-bold text-red-700">{error || "Failed to load"}</p>
          <button type="button" onClick={onClose} className="mt-4 rounded-xl bg-[#7A1D1B] px-4 py-2 text-xs font-bold text-white">Close</button>
        </div>
      </div>
    );
  }

  const decidedRequirements = Object.entries(reviewRequirements || {})
    .filter(([, item]) => ["APPROVED", "REJECTED"].includes(String(item?.status || "").toUpperCase()))
    .map(([key, item]) => ({ key: key as FleetReviewRequirementKey, item }));

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-[#1A1210]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submitted-fleet-title"
    >
      <div className="flex h-[94svh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[28px] border border-[#E5DDD7] bg-[#FFFCFA] shadow-2xl sm:h-[860px] sm:max-h-[94svh] sm:rounded-[28px]">
        <header className="flex items-start justify-between gap-4 border-b border-[#EAE3DD] bg-white px-5 py-4 sm:px-7 sm:py-5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A1D1B]">Bus review</div>
            <h2 id="submitted-fleet-title" className="mt-1 font-display text-xl font-bold text-[#191512]">
              Submitted bus
            </h2>
            <p className="mt-1 text-[11px] font-medium text-[#7B746E]">
              This is the bus information currently held for review.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E6DED8] bg-white p-2 text-[#6D655F] transition hover:bg-[#F8F5F2]"
            aria-label="Close submitted application"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#FDFBF9] px-5 py-5 sm:px-7 sm:py-6">
          <div className="mx-auto max-w-4xl">
            <div className={`mb-5 flex items-center gap-3 rounded-2xl border px-4 py-3 ${reviewStatus === "APPROVED" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : reviewStatus === "REJECTED" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
              {reviewStatus === "APPROVED" ? <CheckCircle2 className="size-4 shrink-0" /> : <Clock3 className="size-4 shrink-0" />}
              <div>
                <p className="text-xs font-black">{reviewStatus === "APPROVED" ? "Approved" : reviewStatus === "REJECTED" ? "Needs changes" : "In review"}</p>
                <p className="mt-0.5 text-[10px] font-semibold opacity-75">
                  {submittedAt ? `Submitted ${new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(submittedAt))}` : "Editing is locked while Shuvmarg reviews this record."}
                </p>
              </div>
            </div>
            {reviewStatus === "REJECTED" && Object.entries(reviewRequirements || {}).some(([, item]) => String(item?.status || "").toUpperCase() === "REJECTED") && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-red-700">Requested changes</p>
                <div className="mt-3 space-y-2">
                  {Object.entries(reviewRequirements || {}).filter(([, item]) => String(item?.status || "").toUpperCase() === "REJECTED").map(([key, item]) => (
                    <div key={key} className="rounded-xl bg-white px-3 py-2.5">
                      <p className="text-xs font-black text-[#211D1A]">{REVIEW_LABELS[key as FleetReviewRequirementKey]}</p>
                      <p className="mt-1 text-[11px] font-semibold text-red-800">{item?.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {decidedRequirements.length > 0 && (
              <div className="mb-5 rounded-2xl border border-[#E8E1DB] bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#6F6761]">Admin review result</p>
                  <span className="text-[10px] font-bold text-[#8A817A]">Approved items stay locked</span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {decidedRequirements.map(({ key, item }) => {
                    const approved = String(item?.status).toUpperCase() === "APPROVED";
                    return (
                      <div key={key} className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 ${approved ? "border-emerald-200 bg-emerald-50/60" : "border-red-200 bg-red-50/60"}`}>
                        {approved ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-red-700" />}
                        <div>
                          <p className={`text-xs font-black ${approved ? "text-emerald-900" : "text-red-900"}`}>{REVIEW_LABELS[key]}</p>
                          <p className={`mt-0.5 text-[10px] font-bold ${approved ? "text-emerald-700" : "text-red-700"}`}>{approved ? "Approved by Shuvmarg" : "Correction requested"}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <ReviewStep draft={draft} readOnly={true} />
          </div>
        </div>

        <footer className="flex justify-end border-t border-[#EAE3DD] bg-white px-5 py-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#7A1D1B] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#5C1414]"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}

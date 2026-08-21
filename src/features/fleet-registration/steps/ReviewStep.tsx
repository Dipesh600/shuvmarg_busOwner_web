"use client";

import { useEffect, useState } from "react";
import {
  Bus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Eye,
  Image as ImageIcon,
  MapPin,
  Navigation,
  Pencil,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import type { FleetRegistrationDraft, FleetStep } from "../types";
import { listMyBrands, type OperatorBrand } from "../api-brands";
import SecureDocViewerModal from "@/components/dashboard/settings/profile/SecureDocViewerModal";

interface ReviewStepProps {
  draft: FleetRegistrationDraft;
  onEditStep?: (step: FleetStep) => void;
  readOnly?: boolean;
}

export default function ReviewStep({ draft, onEditStep, readOnly = false }: ReviewStepProps) {
  const [brands, setBrands] = useState<OperatorBrand[]>([]);
  const [showAllStops, setShowAllStops] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{
    url: string;
    file?: Blob;
    label: string;
    documentType: string;
  } | null>(null);
  const [photoPreviews, setPhotoPreviews] = useState<{
    front?: string;
    rear?: string;
    side?: string;
    cabin?: string;
  }>({});

  // Fetch operator brands for display
  useEffect(() => {
    let active = true;
    void listMyBrands()
      .then((res) => {
        if (active) setBrands(res);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Generate object URLs for uploaded photo previews (skip server-side sentinels)
  useEffect(() => {
    const urls: { [key: string]: string } = {};
    const photos = draft.files.photos;
    // Only create objectURL for actual File/Blob objects; string = already a URL; anything else = sentinel
    const addUrl = (key: string, file: File | null) => {
      if (!file) return;
      if (file instanceof Blob) urls[key] = URL.createObjectURL(file);
      else if (typeof (file as unknown) === "string") urls[key] = file as unknown as string;
      // else: server sentinel — leave blank, PhotoThumb will show shield icon
    };
    addUrl("front", photos.front);
    addUrl("rear",  photos.rear);
    addUrl("side",  photos.side);
    addUrl("cabin", photos.cabin);

    // Object URLs are an external browser resource synchronized to the current files.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhotoPreviews(urls);

    return () => {
      Object.values(urls).forEach((u) => URL.revokeObjectURL(u));
    };
  }, [draft.files.photos]);

  const brandName =
    brands.find((b) => b.id === draft.vehicle.brandId)?.brandName ||
    "Operator Fleet";

  const photosCount = Object.values(draft.files.photos).filter(Boolean).length;
  const docsCount = [
    draft.files.routePermit,
    draft.files.bluebook,
    draft.files.insurance,
    draft.files.fitnessCert,
  ].filter(Boolean).length;

  const servedStops = draft.route.servedStops || [];
  const addedPlaces = draft.route.addedPlaces || [];
  const totalStopsServed = servedStops.length + addedPlaces.length;

  const visibleServedStops = showAllStops
    ? servedStops
    : servedStops.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* ── Pending Review Notice ── */}
      {readOnly && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
            <CheckCircle2 className="size-5 text-amber-600" />
          </div>
          <div>
            <h4 className="text-sm font-black text-amber-900">Fleet Submitted for Review</h4>
            <p className="mt-0.5 text-xs font-medium text-amber-800">
              This fleet is currently under review by the platform team. Editing is disabled until review is complete.
            </p>
          </div>
        </div>
      )}

      {/* ── Top Hero Card ── */}
      <div className="relative overflow-hidden rounded-3xl border border-[#E8E1DB] bg-gradient-to-br from-white via-[#FCFAF8] to-[#F7F2EE] p-6 shadow-2xs">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#7A1D1B] text-white shadow-md shadow-[#7A1D1B]/15">
              <Bus className="size-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#FFF4F1] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#7A1D1B]">
                  {brandName}
                </span>
                <span className="rounded-full bg-[#F3EFEB] px-2.5 py-0.5 text-[10px] font-bold text-[#655E57]">
                  {draft.vehicle.busType} · {draft.vehicle.vehicleType}
                </span>
              </div>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-[#211D1A]">
                {draft.vehicle.busName || "Unnamed Bus"}{" "}
                <span className="font-medium text-[#7D756E]">
                  ({draft.vehicle.busNumber || "Plate pending"})
                </span>
              </h2>
              <p className="text-xs text-[#7D756E]">
                {draft.route.origin || "Origin"} ──►{" "}
                {draft.route.destination || "Destination"} ·{" "}
                {draft.layout?.totalPlaces || 0} Passenger Seats
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start rounded-2xl bg-emerald-50 px-4 py-2.5 text-xs font-black text-emerald-800 md:self-center">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span>Ready for Platform Submission</span>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[#EAE3DC] pt-4 sm:grid-cols-4">
          <div className="rounded-xl bg-white p-3 border border-[#EFE9E4]">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#8A827B]">
              Seating Deck
            </span>
            <p className="mt-0.5 text-sm font-black text-[#211D1A]">
              {draft.layout?.totalPlaces || 0} Seats
            </p>
            <span className="text-[11px] text-[#8A827B]">
              {draft.layout?.templateName || "Custom Template"}
            </span>
          </div>

          <div className="rounded-xl bg-white p-3 border border-[#EFE9E4]">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#8A827B]">
              Corridor Path
            </span>
            <p className="mt-0.5 text-sm font-black text-[#211D1A]">
              {draft.route.selectedVariant
                ? `${draft.route.selectedVariant.distanceKm} km`
                : "Route Set"}
            </p>
            <span className="text-[11px] text-[#8A827B] truncate block">
              {draft.route.selectedVariant?.name || "Direct Highway Path"}
            </span>
          </div>

          <div className="rounded-xl bg-white p-3 border border-[#EFE9E4]">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#8A827B]">
              Served Places
            </span>
            <p className="mt-0.5 text-sm font-black text-[#211D1A]">
              {totalStopsServed} Places
            </p>
            <span className="text-[11px] text-[#8A827B]">
              {servedStops.length} Stops · {addedPlaces.length} Custom
            </span>
          </div>

          <div className="rounded-xl bg-white p-3 border border-[#EFE9E4]">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#8A827B]">
              Documents & Photos
            </span>
            <p className="mt-0.5 text-sm font-black text-[#211D1A]">
              {docsCount}/4 Docs · {photosCount}/4 Photos
            </p>
            <span className="text-[11px] text-emerald-700 font-bold">
              All Files Attached
            </span>
          </div>
        </div>
      </div>

      {/* ── 2-Column Main Review Grid ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Section 1: Vehicle & Brand */}
        <section className="rounded-3xl border border-[#E8E1DB] bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#F0EAE4] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-[#FFF4F1] text-[#7A1D1B]">
                <Bus className="size-4" />
              </div>
              <h3 className="text-base font-black text-[#211D1A]">
                1. Vehicle & Brand Profile
              </h3>
            </div>
            {onEditStep && (
              <button
                type="button"
                onClick={() => onEditStep("vehicle")}
                className="flex items-center gap-1 text-xs font-bold text-[#7A1D1B] transition hover:underline"
              >
                <Pencil className="size-3" />
                Edit
              </button>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <ReviewRow label="Operator Brand" value={brandName} />
            <ReviewRow
              label="Bus Name"
              value={draft.vehicle.busName || "Not set"}
            />
            <ReviewRow
              label="Plate Number"
              value={draft.vehicle.busNumber || "Not set"}
            />
            <ReviewRow
              label="Service Class"
              value={draft.vehicle.busType || "DELUXE"}
            />
            <ReviewRow
              label="Vehicle Category"
              value={draft.vehicle.vehicleType || "BUS"}
            />
            <ReviewRow
              label="Registration Year"
              value={draft.vehicle.registrationYear || "2024"}
            />
          </div>
        </section>

        {/* Section 2: Seating Layout */}
        <section className="rounded-3xl border border-[#E8E1DB] bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#F0EAE4] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-[#FFF4F1] text-[#7A1D1B]">
                <Users className="size-4" />
              </div>
              <h3 className="text-base font-black text-[#211D1A]">
                2. Seating Deck & Capacity
              </h3>
            </div>
            {onEditStep && (
              <button
                type="button"
                onClick={() => onEditStep("layout")}
                className="flex items-center gap-1 text-xs font-bold text-[#7A1D1B] transition hover:underline"
              >
                <Pencil className="size-3" />
                Edit
              </button>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <ReviewRow
              label="Seat Layout Template"
              value={draft.layout?.templateName || "Custom Seat Matrix"}
            />
            <ReviewRow
              label="Total Passenger Seats"
              value={`${draft.layout?.totalPlaces || 0} Bookable Seats`}
            />
            <ReviewRow
              label="Deck Configuration"
              value={
                draft.layout?.layout?.sections && draft.layout.layout.sections.length > 1
                  ? `${draft.layout.layout.sections.length} Cabin Decks (${draft.layout.layout.sections.map((s) => s.name).join(" + ")})`
                  : "Single Deck Express Cabin"
              }
            />
            <ReviewRow
              label="Cabin Matrix"
              value={
                draft.layout?.layout?.sections?.[0]
                  ? `${draft.layout.layout.sections[0].heightUnits} Rows × ${draft.layout.layout.sections[0].widthUnits} Units Grid`
                  : "Standard Configuration"
              }
            />
            <ReviewRow
              label="Booking Status"
              value="Configured for Interactive Seat Maps"
            />
          </div>
        </section>

        {/* Section 3: Vehicle Photos */}
        <section className="rounded-3xl border border-[#E8E1DB] bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#F0EAE4] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-[#FFF4F1] text-[#7A1D1B]">
                <ImageIcon className="size-4" />
              </div>
              <h3 className="text-base font-black text-[#211D1A]">
                3. Vehicle Photos ({photosCount}/4)
              </h3>
            </div>
            {onEditStep && (
              <button
                type="button"
                onClick={() => onEditStep("photos")}
                className="flex items-center gap-1 text-xs font-bold text-[#7A1D1B] transition hover:underline"
              >
                <Pencil className="size-3" />
                Edit
              </button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <PhotoThumb
              label="Front View"
              previewUrl={photoPreviews.front}
              hasFile={Boolean(draft.files.photos.front)}
            />
            <PhotoThumb
              label="Rear View"
              previewUrl={photoPreviews.rear}
              hasFile={Boolean(draft.files.photos.rear)}
            />
            <PhotoThumb
              label="Side Exterior"
              previewUrl={photoPreviews.side}
              hasFile={Boolean(draft.files.photos.side)}
            />
            <PhotoThumb
              label="Cabin / Seating"
              previewUrl={photoPreviews.cabin}
              hasFile={Boolean(draft.files.photos.cabin)}
            />
          </div>
        </section>

        {/* Section 4: Compliance Documents */}
        <section className="rounded-3xl border border-[#E8E1DB] bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#F0EAE4] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-[#FFF4F1] text-[#7A1D1B]">
                <ShieldCheck className="size-4" />
              </div>
              <h3 className="text-base font-black text-[#211D1A]">
                4. Compliance Documents ({docsCount}/4)
              </h3>
            </div>
            {onEditStep && (
              <button
                type="button"
                onClick={() => onEditStep("documents")}
                className="flex items-center gap-1 text-xs font-bold text-[#7A1D1B] transition hover:underline"
              >
                <Pencil className="size-3" />
                Edit
              </button>
            )}
          </div>

          <div className="mt-4 space-y-2.5">
            <DocRow
              title="Route Permit"
              hasFile={Boolean(draft.files.routePermit)}
              file={draft.files.routePermit}
              validTill={draft.documents.routePermitValidTill}
              onView={(file) => setSelectedDocument({ url: typeof file === "string" ? file : "", file: file instanceof Blob ? file : undefined, label: "Route Permit", documentType: "routePermit" })}
            />
            <DocRow
              title="Vehicle Bluebook"
              hasFile={Boolean(draft.files.bluebook)}
              file={draft.files.bluebook}
              onView={(file) => setSelectedDocument({ url: typeof file === "string" ? file : "", file: file instanceof Blob ? file : undefined, label: "Vehicle Bluebook", documentType: "bluebook" })}
            />
            <DocRow
              title="Passenger Insurance"
              hasFile={Boolean(draft.files.insurance)}
              file={draft.files.insurance}
              meta={`Policy: ${draft.documents.insurancePolicyNumber || "Recorded"}`}
              validTill={draft.documents.insuranceValidTill}
              onView={(file) => setSelectedDocument({ url: typeof file === "string" ? file : "", file: file instanceof Blob ? file : undefined, label: "Passenger Insurance", documentType: "insurance" })}
            />
            <DocRow
              title="Fitness Certificate"
              hasFile={Boolean(draft.files.fitnessCert)}
              file={draft.files.fitnessCert}
              validTill={draft.documents.fitnessValidTill}
              onView={(file) => setSelectedDocument({ url: typeof file === "string" ? file : "", file: file instanceof Blob ? file : undefined, label: "Fitness Certificate", documentType: "fitnessCert" })}
            />
          </div>
        </section>
      </div>

      {/* ── Section 5: Journey Corridor, Stops & Boarding Counters (Full Width) ── */}
      <section className="rounded-3xl border border-[#E8E1DB] bg-white p-6 shadow-2xs">
        <div className="flex flex-col justify-between gap-3 border-b border-[#F0EAE4] pb-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-[#FFF4F1] text-[#7A1D1B]">
              <Navigation className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#211D1A]">
                5. Journey Corridor & Served Highway Stops
              </h3>
              <p className="text-xs text-[#7A726B]">
                {draft.route.origin || "Origin"} ──►{" "}
                {draft.route.destination || "Destination"} ·{" "}
                {draft.route.selectedVariant?.name || "Standard Highway Variant"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#F5F1EC] px-3 py-1 text-xs font-black text-[#6B635C]">
              {totalStopsServed} Places Configured
            </span>
            {onEditStep && (
              <button
                type="button"
                onClick={() => onEditStep("route")}
                className="flex items-center gap-1 text-xs font-bold text-[#7A1D1B] transition hover:underline"
              >
                <Pencil className="size-3" />
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Highway Variant Details */}
        <div className="mt-4 grid gap-3 rounded-2xl bg-[#FAF7F4] p-4 sm:grid-cols-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#8A827B]">
              Highway Path
            </span>
            <p className="text-xs font-black text-[#211D1A]">
              {draft.route.selectedVariant?.name || "Direct Corridor"}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#8A827B]">
              Distance & Travel Time
            </span>
            <p className="text-xs font-black text-[#211D1A]">
              {draft.route.selectedVariant?.distanceKm || 0} km · ~
              {Math.round((draft.route.selectedVariant?.durationMinutes || 0) / 60)}{" "}
              hours
            </p>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#8A827B]">
              Round-Trip Operation
            </span>
            <p className="text-xs font-black text-emerald-700">
              {draft.route.returnEnabled
                ? "✓ Return Journey Enabled"
                : "Single Direction Only"}
            </p>
          </div>
        </div>

        {/* Served Stops Listing */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#6B635C]">
              Served Stops & Ticket Counters
            </h4>
            {servedStops.length > 6 && (
              <button
                type="button"
                onClick={() => setShowAllStops((prev) => !prev)}
                className="flex items-center gap-1 text-xs font-bold text-[#7A1D1B] hover:underline"
              >
                {showAllStops ? (
                  <>
                    Show fewer stops <ChevronUp className="size-3.5" />
                  </>
                ) : (
                  <>
                    View all {servedStops.length} stops{" "}
                    <ChevronDown className="size-3.5" />
                  </>
                )}
              </button>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {visibleServedStops.map((stop, idx) => {
              const hasMeetingDetails =
                Boolean(stop.meetingDetails?.counterNumber) ||
                Boolean(stop.meetingDetails?.contactPhone) ||
                Boolean(stop.meetingDetails?.displayName);

              return (
                <div
                  key={stop.stopId}
                  className="flex flex-col justify-between rounded-2xl border border-[#EDE7E1] bg-white p-3 transition hover:border-[#D5CABE]"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#F5F0EB] text-[11px] font-black text-[#5C554F]">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-[#211D1A] truncate block">
                          {stop.name}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                            stop.usage === "PICKUP"
                              ? "bg-blue-50 text-blue-800"
                              : stop.usage === "DROP"
                              ? "bg-amber-50 text-amber-800"
                              : "bg-emerald-50 text-emerald-800"
                          }`}
                        >
                          {stop.usage}
                        </span>
                      </div>

                      {hasMeetingDetails ? (
                        <div className="mt-1.5 rounded-lg bg-[#FAF8F5] p-1.5 text-[10px] text-[#6B635C] space-y-0.5">
                          {stop.meetingDetails.counterNumber && (
                            <p className="font-bold text-[#211D1A]">
                              Counter #{stop.meetingDetails.counterNumber}{" "}
                              {stop.meetingDetails.displayName &&
                                `(${stop.meetingDetails.displayName})`}
                            </p>
                          )}
                          {stop.meetingDetails.contactPhone && (
                            <p className="flex items-center gap-1 text-[#7A1D1B]">
                              <Phone className="size-2.5" />
                              {stop.meetingDetails.contactPhone}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="mt-1 text-[10px] text-[#9A9188]">
                          Standard highway stop
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* User-Added Custom Places */}
          {addedPlaces.length > 0 && (
            <div className="mt-4 rounded-2xl border border-dashed border-[#C99A4A]/60 bg-[#FFFDF9] p-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-[#8C621E]" />
                <span className="text-xs font-black text-[#6B4B13]">
                  Custom Locations for Platform Verification ({addedPlaces.length})
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {addedPlaces.map((place) => (
                  <span
                    key={place.clientKey}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#ECDDBF] bg-white px-2.5 py-1 text-xs font-bold text-[#6B4B13]"
                  >
                    <MapPin className="size-3 text-[#C99A4A]" />
                    {place.name}
                    {place.address && (
                      <span className="text-[10px] font-normal text-[#8A7450]">
                        ({place.address})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Bottom Platform Assurance Seal ── */}
      <div className="flex items-center gap-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-900">
        <ShieldCheck className="size-5 shrink-0 text-emerald-700" />
        <div>
          <p className="font-black text-emerald-950">
            ShuvMarg Operator Platform Verification
          </p>
          <p className="mt-0.5 text-emerald-800">
            Once submitted, your bus details, seat matrix, compliance permits,
            and highway stops are verified by ShuvMarg Operations within 24
            hours for live passenger booking.
          </p>
        </div>
      </div>
      <SecureDocViewerModal selectedDoc={selectedDocument} onClose={() => setSelectedDocument(null)} />
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#F5F0EB] py-2 text-xs last:border-0">
      <span className="text-[#7F7770]">{label}</span>
      <span className="text-right font-black text-[#211D1A]">{value}</span>
    </div>
  );
}

function PhotoThumb({
  label,
  previewUrl,
  hasFile,
}: {
  label: string;
  previewUrl?: string;
  hasFile: boolean;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-[#EDE7E1] bg-[#FAF8F5] p-2.5 text-center">
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-white border border-[#E8E1DB] flex items-center justify-center">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={label}
            className="size-full object-cover"
          />
        ) : hasFile ? (
          <div className="flex flex-col items-center gap-1.5 text-emerald-700">
            <ShieldCheck className="size-6" />
            <span className="text-[10px] font-bold">Stored securely</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-[#A8A099]">
            <ImageIcon className="size-5" />
            <span className="text-[10px]">No photo</span>
          </div>
        )}

        {hasFile && (
          <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
            <CheckCircle2 className="size-3.5" />
          </span>
        )}
      </div>
      <span className="mt-2 text-[11px] font-black text-[#211D1A] truncate w-full">
        {label}
      </span>
      <span
        className={`text-[10px] font-bold ${
          hasFile ? "text-emerald-700" : "text-amber-700"
        }`}
      >
        {hasFile ? "Attached" : "Optional"}
      </span>
    </div>
  );
}

function DocRow({
  title,
  hasFile,
  file,
  meta,
  validTill,
  onView,
}: {
  title: string;
  hasFile: boolean;
  file?: File | string | null;
  meta?: string;
  validTill?: string;
  onView?: (file: File | string) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#EDE7E1] bg-[#FAF8F5] px-3 py-2.5 text-xs">
      <div className="flex items-center gap-2.5">
        <div
          className={`flex size-6 shrink-0 items-center justify-center rounded-lg ${
            hasFile
              ? "bg-emerald-100 text-emerald-800"
              : "bg-[#EFE9E2] text-[#8C837A]"
          }`}
        >
          <FileText className="size-3.5" />
        </div>
        <div>
          <span className="font-black text-[#211D1A] block">{title}</span>
          {(meta || validTill) && (
            <span className="text-[10px] text-[#7A726B] block">
              {meta ? `${meta} · ` : ""}
              {validTill ? `Valid till: ${validTill}` : ""}
            </span>
          )}
        </div>
      </div>

      {file && onView && (
        <button
          type="button"
          onClick={() => onView(file)}
          aria-label={`Preview ${title}`}
          title={`Preview ${title}`}
          className="flex size-7 items-center justify-center rounded-lg border border-[#DCD4CD] bg-white text-[#7A1D1B] transition hover:bg-[#FFF4F1]"
        >
          <Eye className="size-3.5" />
        </button>
      )}

      <div className="flex items-center gap-1">
        {hasFile ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-800">
            <CheckCircle2 className="size-3" />
            Uploaded
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
            Pending
          </span>
        )}
      </div>
    </div>
  );
}

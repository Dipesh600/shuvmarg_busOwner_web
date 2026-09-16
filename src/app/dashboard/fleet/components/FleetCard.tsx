import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BusFront,
  Calendar,
  Clock,
  Eye,
  LayoutGrid,
  Pencil,
  Route,
  Ticket,
  User,
} from "lucide-react";
import type { FleetListItem } from "@/features/fleet-registration/api";
import type { OperatorFleetSetupStatus } from "@/features/operator-dashboard/operator-dashboard-contract";
import { buildFleetLifecycleStory } from "@/features/operator-dashboard/fleet-lifecycle-story";
import {
  getBusFrontImageUrl,
  getCachedBusFrontImageUrl,
} from "@/features/fleet-registration/fleet-image-cache";
import type { OwnerTrip } from "@/features/trip-seat-controls/types";
import { resolveFleetOperationalContext } from "@/features/operator-dashboard/fleet-operational-context";

export interface FleetCardProps {
  fleet: FleetListItem;
  businessApproved: boolean;
  localDraftId: string | null;
  setupStatus?: OperatorFleetSetupStatus | null;
  activeTrip?: OwnerTrip | null;
  dailySales?: { ticketsSold: number; bookingSales: number } | null;
  crewLookup?: Record<string, string> | null;
  onOpenFleet: (draftId: string, readOnly: boolean) => void;
  onPreviewFleet: (fleetId: string) => void;
  onOpenServerDraft: (fleetId: string) => void;
  onCorrectRejectedFleet: (fleetId: string) => void;
  onOpenOperations: (fleetId: string) => void;
  onViewBus: (fleetId: string) => void;
  onViewSeatLayout?: (fleet: FleetListItem) => void;
}

type StatusTheme = "grey" | "amber";

function getStatusTheme(status: string): StatusTheme {
  if (status === "DRAFT") return "grey";
  if (status === "PENDING" || status === "REJECTED" || status === "APPROVED") {
    return "amber";
  }
  return "grey";
}

const themeStyles: Record<
  StatusTheme,
  {
    container: string;
    badge: string;
    text: string;
    subtext: string;
    routeIcon: string;
    progressTrack: string;
    progressBar: string;
    description: string;
  }
> = {
  grey: {
    container: "bg-[#F5F2EE] border-[#E5DFD7]",
    badge: "bg-white border-[#DCD5CD] text-[#554E48]",
    text: "text-[#26221F]",
    subtext: "text-[#746E69]",
    routeIcon: "text-[#655E58]",
    progressTrack: "bg-[#DDD6CE]",
    progressBar: "bg-[#79726B]",
    description: "text-[#554E48]",
  },
  amber: {
    container: "bg-[#FFFBEB] border-[#FDE68A]",
    badge: "bg-amber-100 border-amber-300 text-amber-900",
    text: "text-amber-950",
    subtext: "text-amber-800/80",
    routeIcon: "text-amber-700",
    progressTrack: "bg-amber-200",
    progressBar: "bg-amber-600",
    description: "text-amber-900",
  },
};

export function FleetCard({
  fleet,
  businessApproved,
  localDraftId,
  setupStatus,
  activeTrip,
  dailySales,
  crewLookup,
  onOpenFleet,
  onPreviewFleet,
  onOpenServerDraft,
  onCorrectRejectedFleet,
  onOpenOperations,
  onViewBus,
  onViewSeatLayout,
}: FleetCardProps) {
  const router = useRouter();
  const story = buildFleetLifecycleStory(fleet, setupStatus, {
    businessApproved,
    localDraftId,
  });
  const status = story.status;
  const isDraft = status === "DRAFT";
  const isLive = story.isOperational;
  const themeKey = getStatusTheme(status);
  const theme = themeStyles[themeKey];

  const operational = resolveFleetOperationalContext(
    setupStatus,
    activeTrip,
    story.routeText,
    crewLookup,
    fleet.busNumber,
    fleet.totalSeats,
  );

  const [frontImage, setFrontImage] = useState<string | null>(() =>
    getCachedBusFrontImageUrl(fleet.fleetId, localDraftId),
  );
  const [imageLoading, setImageLoading] = useState<boolean>(!frontImage);

  useEffect(() => {
    if (frontImage) return;
    let isMounted = true;
    getBusFrontImageUrl(fleet.fleetId, localDraftId, fleet.frontImage)
      .then((url) => {
        if (isMounted) {
          setFrontImage(url);
          setImageLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setImageLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [fleet.fleetId, fleet.frontImage, localDraftId, frontImage]);

  return (
    <article
      id={`fleet-${fleet.fleetId}`}
      onClick={isLive ? () => onViewBus(fleet.fleetId) : undefined}
      style={{
        background:
          "radial-gradient(ellipse at 92% 0%, rgba(220, 101, 94, 0.16) 0%, rgba(220, 101, 94, 0.07) 28%, rgba(220, 101, 94, 0.025) 48%, rgba(255, 255, 255, 0) 68%), #ffffff",
      }}
      className={`group scroll-mt-6 rounded-2xl sm:rounded-3xl border border-[#E8E1DB] p-3.5 sm:p-5 shadow-sm transition-all target:border-[#7A1D1B] target:ring-2 target:ring-[#7A1D1B]/10 ${
        isLive
          ? "cursor-pointer hover:border-[#7A1D1B]/60 hover:shadow-md"
          : "cursor-default"
      }`}
    >
      {isLive ? (
        <>
          {/* ── Top Row: Identity, Divider, Operations, View Bus Button ── */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            {/* Left: Bus Identity */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              {/* Squarish Logo/Image Container */}
              <div className="relative size-20 sm:size-28 shrink-0 overflow-hidden rounded-xl sm:rounded-2xl bg-[#F6EFE9] flex items-center justify-center">
                {frontImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={frontImage}
                    alt={fleet.busName}
                    className="size-full object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105"
                  />
                ) : imageLoading ? (
                  <div className="flex size-full items-center justify-center animate-pulse">
                    <BusFront className="size-8 text-[#B5ABA1]" />
                  </div>
                ) : (
                  /* Stylized Vehicle Glyph matching reference */
                  <svg
                    className="w-14 h-10"
                    viewBox="0 0 52 38"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 24C7 24 5.2 21.6 6.5 18.8L12.5 5.8C13.6 3.5 16 2 18.6 2H30C33.8 2 36.5 5.5 35 9.2L28.5 24H10Z"
                      fill="#F25822"
                    />
                    <rect
                      x="27"
                      y="13"
                      width="10"
                      height="21"
                      rx="5"
                      transform="rotate(-28 27 13)"
                      fill="#F25822"
                    />
                  </svg>
                )}
              </div>

              {/* Name, Plate, Type & Seats */}
              <div className="min-w-0 space-y-1">
                <h2 className="truncate text-base font-black leading-tight tracking-tight text-[#191512] sm:text-lg">
                  {fleet.busName}
                </h2>
                <div>
                  <span className="inline-flex items-center rounded-md bg-[#F0ECE6] px-2.5 py-0.5 font-mono text-xs font-black tracking-wider text-[#3E3832]">
                    {fleet.busNumber}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#746E69]">
                  <span className="uppercase tracking-wider">{fleet.busType}</span>
                  <span className="text-[#C5BCB3]">·</span>
                  <span>{fleet.totalSeats} seats</span>
                </div>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="hidden lg:block h-16 w-px bg-[#EBE4DC] shrink-0 mx-1 self-center" />

            {/* Middle: Live Operations, Route, Timing & Crew (Shifted right by 20px via lg:ml-5) */}
            <div className="min-w-0 flex-1 space-y-2 lg:ml-5">
              {/* Route Name */}
              <div className="flex min-w-0 items-center gap-2">
                <Route className="size-4 shrink-0 text-[#C93B2B]" />
                <span className="truncate text-base font-black text-[#191512] sm:text-lg">
                  {operational.routeText}
                </span>
              </div>

              {/* Timing & Assigned Crew details */}
              <div className="space-y-1 text-xs font-medium text-[#554E48]">
                <div className="flex items-center gap-2">
                  <Clock className="size-3.5 shrink-0 text-[#655E58]" />
                  <span>{operational.scheduleText}</span>
                </div>

                <div className="flex items-center gap-2">
                  <User className="size-3.5 shrink-0 text-[#655E58]" />
                  <span>Driver: {operational.driverName || "Not assigned"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <User className="size-3.5 shrink-0 text-[#655E58]" />
                  <span>Conductor: {operational.conductorName || "Not assigned"}</span>
                </div>
              </div>
            </div>

            {/* Right: View bus CTA */}
            <div className="shrink-0 flex items-center lg:justify-end max-sm:w-full">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onViewBus(fleet.fleetId);
                }}
                className="group/btn inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[#7A1D1B] px-6 text-xs font-black text-white shadow-sm transition-all duration-200 hover:bg-[#641715] hover:shadow-md active:scale-[0.97]"
              >
                <span>View bus</span>
                <ArrowRight className="size-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
              </button>
            </div>
          </div>

          {/* ── Bottom Bar: Quick Action Buttons (Matching reference media_1789549462516.png) ── */}
          <div className="mt-4 border-t border-[#EDE7E0] pt-3">
            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-xs sm:text-[13px] font-bold text-[#2E2824]">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onViewBus(fleet.fleetId);
                }}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 transition-colors hover:bg-[#F6F1EA] hover:text-[#7A1D1B] active:scale-[0.98]"
              >
                <Pencil className="size-3.5 text-[#5A524C]" />
                <span>Edit</span>
              </button>

              <div className="hidden sm:block h-3.5 w-px bg-[#E2DBD3] mx-0.5" />

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (onViewSeatLayout) {
                    onViewSeatLayout(fleet);
                  } else {
                    router.push(`/dashboard/seat-layouts?fleetId=${encodeURIComponent(fleet.fleetId)}`);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 transition-colors hover:bg-[#F6F1EA] hover:text-[#7A1D1B] active:scale-[0.98]"
              >
                <LayoutGrid className="size-3.5 text-[#5A524C]" />
                <span>Seat layout</span>
              </button>

              <div className="hidden sm:block h-3.5 w-px bg-[#E2DBD3] mx-0.5" />

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  router.push(`/dashboard/trips?fleetId=${encodeURIComponent(fleet.fleetId)}`);
                }}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 transition-colors hover:bg-[#F6F1EA] hover:text-[#7A1D1B] active:scale-[0.98]"
              >
                <Calendar className="size-3.5 text-[#5A524C]" />
                <span>Trips</span>
              </button>

              <div className="hidden sm:block h-3.5 w-px bg-[#E2DBD3] mx-0.5" />

              <div className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-[#554E48]">
                <Ticket className="size-3.5 text-[#7A1D1B] shrink-0" />
                <span className="flex items-center gap-1.5">
                  <span>Today&apos;s departures:</span>
                  <strong className="font-bold text-[#191512]">
                    {dailySales ? `${dailySales.ticketsSold} tickets` : "Unavailable"}
                  </strong>
                  <span className="text-[#C5BCB3]">·</span>
                  <strong className="font-bold text-[#191512]">
                    {dailySales ? `NPR ${dailySales.bookingSales.toLocaleString("en-NP", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Sales unavailable"}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ── Setup / Onboarding Flow Layout ── */
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
          {/* Portion 1: Informative (Left) */}
          <div className="flex items-center gap-3 sm:gap-4 xl:w-[380px] xl:shrink-0">
            <div className="relative size-20 sm:size-28 shrink-0 overflow-hidden rounded-xl sm:rounded-2xl bg-[#F6EFE9] flex items-center justify-center">
              {frontImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={frontImage}
                  alt={fleet.busName}
                  className="size-full object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105"
                />
              ) : imageLoading ? (
                <div className="flex size-full items-center justify-center animate-pulse">
                  <BusFront className="size-8 text-[#B5ABA1]" />
                </div>
              ) : (
                <svg
                  className="w-14 h-10"
                  viewBox="0 0 52 38"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 24C7 24 5.2 21.6 6.5 18.8L12.5 5.8C13.6 3.5 16 2 18.6 2H30C33.8 2 36.5 5.5 35 9.2L28.5 24H10Z"
                    fill="#F25822"
                  />
                  <rect
                    x="27"
                    y="13"
                    width="10"
                    height="21"
                    rx="5"
                    transform="rotate(-28 27 13)"
                    fill="#F25822"
                  />
                </svg>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <h2 className="truncate text-base font-black leading-tight tracking-tight text-[#191512] sm:text-lg">
                {fleet.busName}
              </h2>
              <div>
                <span className="inline-flex items-center rounded-md border border-[#E2DDD7] bg-[#F3EFEA] px-2 py-0.5 font-mono text-xs font-black tracking-wider text-[#3E3832]">
                  {fleet.busNumber}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#746E69]">
                <span className="uppercase tracking-wider">{fleet.busType}</span>
                <span className="text-[#D0C7BF]">•</span>
                <span>{fleet.totalSeats} seats</span>
              </div>
            </div>
          </div>

          {/* Portion 2: What's Going On (Theme Container) */}
          <div
            className={`min-w-0 flex-1 space-y-2 rounded-2xl border p-3 sm:p-3.5 ${theme.container}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${theme.badge}`}
              >
                {story.label}
              </span>
              {story.nextStepLabel && (
                <span className={`truncate text-xs font-black ${theme.text}`}>
                  Do next: {story.nextStepLabel}
                </span>
              )}
            </div>

            {story.routeText && (
              <div
                className={`flex min-w-0 items-center gap-1.5 text-xs font-black ${theme.text}`}
              >
                <Route className={`size-3.5 shrink-0 ${theme.routeIcon}`} />
                <span className="truncate">{story.routeText}</span>
                {story.routeCode && (
                  <span className="shrink-0 rounded-md border border-black/10 bg-white/80 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-[#655E58]">
                    {story.routeCode}
                  </span>
                )}
              </div>
            )}

            {story.progressPercentage !== null && (
              <div>
                <div
                  className={`flex items-center justify-between text-[10px] font-bold ${theme.subtext}`}
                >
                  <span>{story.progressText || "Setup progress"}</span>
                  <span>{story.progressPercentage}%</span>
                </div>
                <div
                  className={`mt-1 h-1.5 w-full overflow-hidden rounded-full ${theme.progressTrack}`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${theme.progressBar}`}
                    style={{ width: `${story.progressPercentage}%` }}
                  />
                </div>
              </div>
            )}

            <p
              className={`line-clamp-2 text-[11px] font-semibold leading-relaxed ${theme.description}`}
            >
              {story.description}
            </p>
          </div>

          {/* Portion 3: CTA Actions */}
          <div className="flex shrink-0 flex-wrap items-center gap-2.5 max-sm:w-full max-sm:[&>button]:flex-1 xl:w-[260px] xl:justify-end">
            {status === "PENDING" ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onPreviewFleet(fleet.fleetId);
                }}
                className="group/btn inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#D5CDC5] bg-white px-5 text-xs font-bold text-[#191512] shadow-2xs transition-all duration-200 hover:border-[#7A1D1B] hover:bg-[#FAF7F2] hover:text-[#7A1D1B] active:scale-[0.97]"
              >
                <Eye className="size-4 text-[#7A1D1B]" />
                <span>Preview submission</span>
              </button>
            ) : status === "REJECTED" ? (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onPreviewFleet(fleet.fleetId);
                  }}
                  className="group/btn inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#D5CDC5] bg-white px-5 text-xs font-bold text-[#191512] shadow-2xs transition-all duration-200 hover:border-[#7A1D1B] hover:bg-[#FAF7F2] hover:text-[#7A1D1B] active:scale-[0.97]"
                >
                  <Eye className="size-4 text-[#7A1D1B]" />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCorrectRejectedFleet(fleet.fleetId);
                  }}
                  className="group/btn inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#7A1D1B] px-6 text-xs font-black text-white shadow-sm transition-all duration-200 hover:bg-[#641715] hover:shadow-md active:scale-[0.97]"
                >
                  <span>Correct</span>
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                </button>
              </>
            ) : status === "APPROVED" ? (
              <>
                {!story.isOperational && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onPreviewFleet(fleet.fleetId);
                    }}
                    className="group/btn inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#D5CDC5] bg-white px-5 text-xs font-bold text-[#191512] shadow-2xs transition-all duration-200 hover:border-[#7A1D1B] hover:bg-[#FAF7F2] hover:text-[#7A1D1B] active:scale-[0.97]"
                  >
                    <Eye className="size-4 text-[#7A1D1B]" />
                    <span>Preview</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (story.needsOperationsSetup) {
                      onOpenOperations(fleet.fleetId);
                    } else {
                      onViewBus(fleet.fleetId);
                    }
                  }}
                  className="group/btn inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#7A1D1B] px-6 text-xs font-black text-white shadow-sm transition-all duration-200 hover:bg-[#641715] hover:shadow-md active:scale-[0.97]"
                >
                  <span>{story.primaryActionLabel}</span>
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                </button>
              </>
            ) : isDraft && businessApproved ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (localDraftId) onOpenFleet(localDraftId, false);
                  else onOpenServerDraft(fleet.fleetId);
                }}
                className="group/btn inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#7A1D1B] px-6 text-xs font-black text-white shadow-sm transition-all duration-200 hover:bg-[#641715] hover:shadow-md active:scale-[0.97]"
              >
                <span>{story.primaryActionLabel}</span>
                <ArrowRight className="size-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
              </button>
            ) : null}
          </div>
        </div>
      )}
    </article>
  );
}

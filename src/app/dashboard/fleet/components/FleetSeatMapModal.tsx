"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BusFront,
  CheckCircle2,
  DoorClosed,
  Layers,
  Lock,
  ShieldCheck,
  X,
} from "lucide-react";
import type { FleetListItem } from "@/features/fleet-registration/api";
import { getFleetAssignment } from "@/features/seat-layout-v3/api";
import { authFetch } from "@/lib/auth";
import type { LayoutElement, LayoutSection, SeatLayoutV3 } from "@/features/seat-layout-v3/types";
import { layoutPresets } from "@/features/seat-layout-v3/presets";
import { cn } from "@/lib/utils";

interface FleetSeatMapModalProps {
  fleet: FleetListItem;
  onClose: () => void;
  onOpenStudio?: (fleetId: string) => void;
}

function SteeringWheelIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2v6.5" />
      <path d="M4.93 16.07 9.88 13.9" />
      <path d="m19.07 16.07-4.95-2.17" />
    </svg>
  );
}

// Helper to determine if a seat is Window vs Aisle
function getSeatPositionType(element: LayoutElement, section: LayoutSection): {
  isWindow: boolean;
  side: "Left" | "Right" | "Center";
  label: string;
} {
  const isLeft = element.position.x === 0;
  const isRight = element.position.x === section.widthUnits - 1;

  if (isLeft) {
    return { isWindow: true, side: "Left", label: "Left Window" };
  }
  if (isRight) {
    return { isWindow: true, side: "Right", label: "Right Window" };
  }
  return {
    isWindow: false,
    side: element.position.x < section.widthUnits / 2 ? "Left" : "Right",
    label: "Aisle Seat",
  };
}

// Clean Seat Card — matches reference: rounded card, label, small colored bar
function SeatCard({
  element,
  isSelected,
  onSelect,
}: {
  element: LayoutElement;
  isSelected: boolean;
  onSelect: (el: LayoutElement) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(element)}
      className={cn(
        "group flex flex-col items-center justify-center rounded-xl transition-all duration-150 select-none cursor-pointer outline-none w-full min-h-[50px] sm:min-h-[54px]",
        "bg-[#F6F3EF] border",
        isSelected
          ? "border-[#7A1D1B]/50 bg-[#FDF4F4] ring-1 ring-[#7A1D1B]/20 shadow-sm"
          : "border-[#E5E0D8]"
      )}
      style={{
        gridColumn: `${element.position.x + 1} / span ${element.size.width}`,
        gridRow: `${element.position.y + 1} / span ${element.size.height}`,
      }}
      aria-label={`Seat ${element.label}`}
    >
      <span
        className={cn(
          "text-sm font-bold tracking-tight transition-colors",
          isSelected ? "text-[#7A1D1B]" : "text-[#2E2822]"
        )}
      >
        {element.label}
      </span>
      <div
        className={cn(
          "mt-1 h-[3px] w-5 rounded-full transition-colors",
          isSelected ? "bg-[#7A1D1B]/40" : "bg-[#D5CEC5]"
        )}
      />
    </button>
  );
}

// Sleeper Berth Card — taller version of SeatCard
function BerthCard({
  element,
  isSelected,
  onSelect,
}: {
  element: LayoutElement;
  isSelected: boolean;
  onSelect: (el: LayoutElement) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(element)}
      className={cn(
        "group flex flex-col items-center justify-center rounded-xl transition-all duration-150 select-none cursor-pointer outline-none w-full h-full min-h-[100px]",
        "bg-[#F6F3EF] border",
        isSelected
          ? "border-[#7A1D1B]/50 bg-[#FDF4F4] ring-1 ring-[#7A1D1B]/20 shadow-sm"
          : "border-[#E5E0D8]"
      )}
      style={{
        gridColumn: `${element.position.x + 1} / span ${element.size.width}`,
        gridRow: `${element.position.y + 1} / span ${element.size.height}`,
      }}
      aria-label={`Berth ${element.label}`}
    >
      <span
        className={cn(
          "text-sm font-bold tracking-tight transition-colors",
          isSelected ? "text-[#7A1D1B]" : "text-[#2E2822]"
        )}
      >
        {element.label}
      </span>
      <div
        className={cn(
          "mt-1.5 h-[3px] w-5 rounded-full transition-colors",
          isSelected ? "bg-[#7A1D1B]/40" : "bg-[#D5CEC5]"
        )}
      />
    </button>
  );
}

// Bus Body Blueprint — matches reference: light frame, simple cockpit, dashed aisle
function CoachDeckViewer({
  section,
  selectedElement,
  onSelectElement,
}: {
  section: LayoutSection;
  selectedElement: LayoutElement | null;
  onSelectElement: (el: LayoutElement) => void;
}) {
  const isUpperDeck = section.role.includes("UPPER");

  // Determine empty columns for the dashed aisle line
  const occupiedColumns = useMemo(() => {
    const cols = new Set<number>();
    section.elements.forEach((el) => {
      for (let i = 0; i < el.size.width; i++) {
        cols.add(el.position.x + i);
      }
    });
    return cols;
  }, [section.elements]);

  const aisleColumns = useMemo(() => {
    const aisles: number[] = [];
    for (let c = 0; c < section.widthUnits; c++) {
      if (!occupiedColumns.has(c)) {
        aisles.push(c);
      }
    }
    return aisles;
  }, [occupiedColumns, section.widthUnits]);

  return (
    <div className="relative mx-auto flex w-full max-w-[340px] sm:max-w-[380px] flex-col items-center select-none">
      {/* ── Side Mirrors ── */}
      {!isUpperDeck && (
        <>
          <div className="absolute -left-2.5 top-8 z-30 h-8 w-2.5 rounded-l-full bg-[#C8C2BA] border border-[#B5AFA8] shadow-sm" />
          <div className="absolute -right-2.5 top-8 z-30 h-8 w-2.5 rounded-r-full bg-[#C8C2BA] border border-[#B5AFA8] shadow-sm" />
        </>
      )}

      {/* ── Bus Body Frame ── */}
      <div className="relative w-full overflow-hidden rounded-[28px] border-[3px] border-[#D5D0C9] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        {/* ── Front Cockpit (Light background — matches reference) ── */}
        <div className="border-b border-[#E8E3DC] bg-[#F8F5F1] px-4 py-3">
          <div className="flex items-center justify-between">
            {!isUpperDeck ? (
              <>
                {/* Entry Door */}
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl border border-[#E0D8CE] bg-white">
                    <DoorClosed className="size-4 text-[#7A1D1B]" />
                  </div>
                  <span className="text-sm font-bold text-[#3E3832]">Entry</span>
                </div>

                {/* Driver */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#3E3832]">Driver</span>
                  <div className="flex size-9 items-center justify-center rounded-xl border border-[#F0D4D4] bg-[#FDF0F0]">
                    <SteeringWheelIcon className="size-4 text-[#7A1D1B]" />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex w-full items-center justify-center">
                <div className="flex items-center gap-1.5 text-sm font-bold text-[#655E58]">
                  <Layers className="size-4 text-[#7A1D1B]" />
                  <span>Upper Deck</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Passenger Interior ── */}
        <div className="bg-white p-3 sm:p-4">
          {/* Seat Grid */}
          <div
            className="relative grid gap-2 sm:gap-2.5"
            style={{
              gridTemplateColumns: `repeat(${section.widthUnits}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${section.heightUnits}, minmax(50px, 54px))`,
            }}
          >
            {/* Dashed Aisle Line (vertical, centered in aisle column) */}
            {aisleColumns.map((col) => (
              <div
                key={`aisle-${col}`}
                className="pointer-events-none z-0 flex items-center justify-center"
                style={{
                  gridColumn: `${col + 1} / span 1`,
                  gridRow: `1 / span ${section.heightUnits}`,
                }}
              >
                <div className="h-full w-0 border-l-2 border-dashed border-[#DDD7CE]" />
              </div>
            ))}

            {/* Seats & Berths */}
            {section.elements.map((element) => {
              const isSelected = selectedElement?.elementId === element.elementId;

              if (element.kind === "SEAT") {
                return (
                  <SeatCard
                    key={element.elementId}
                    element={element}
                    isSelected={isSelected}
                    onSelect={onSelectElement}
                  />
                );
              }

              if (element.kind === "BERTH") {
                return (
                  <BerthCard
                    key={element.elementId}
                    element={element}
                    isSelected={isSelected}
                    onSelect={onSelectElement}
                  />
                );
              }

              return null;
            })}
          </div>
        </div>

        {/* ── Bus Rear ── */}
        <div className="h-3 rounded-b-[24px] bg-[#F4F0EB] border-t border-[#E8E3DC]" />
      </div>
    </div>
  );
}

export function FleetSeatMapModal({
  fleet,
  onClose,
  onOpenStudio,
}: FleetSeatMapModalProps) {
  const [layout, setLayout] = useState<SeatLayoutV3 | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalPlaces, setTotalPlaces] = useState<number>(fleet.totalSeats || 0);
  const [layoutTitle, setLayoutTitle] = useState<string>("Active Passenger Layout");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // Interactive seat inspection state
  const [selectedElement, setSelectedElement] = useState<LayoutElement | null>(null);

  useEffect(() => {
    let active = true;

    async function loadLayout() {
      setLoading(true);
      try {
        // 1. Try fetching assigned active revision
        const assignmentRes = await getFleetAssignment(fleet.fleetId).catch(() => null);
        const activeLayout = assignmentRes?.assignment?.activeRevision?.layout;

        if (active && activeLayout && activeLayout.sections?.length > 0) {
          setLayout(activeLayout);
          setTotalPlaces(
            assignmentRes?.assignment?.activeRevision?.totalPlaces || fleet.totalSeats || 0
          );
          setLayoutTitle("Assigned Fleet Layout");
          setActiveSectionId(activeLayout.sections[0]?.sectionId || null);
          setLoading(false);
          return;
        }

        // 2. Fallback: Check fleet details endpoint
        const fleetDetailRes = await authFetch(`/busowner/fleets/${encodeURIComponent(fleet.fleetId)}`)
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null);

        const fleetLayout = fleetDetailRes?.data?.seatLayout?.layout;
        if (active && fleetLayout && fleetLayout.sections?.length > 0) {
          setLayout(fleetLayout);
          setTotalPlaces(
            fleetDetailRes?.data?.seatLayout?.totalPlaces ||
              fleetDetailRes?.data?.totalSeats ||
              fleet.totalSeats ||
              0
          );
          setLayoutTitle("Submitted Fleet Layout");
          setActiveSectionId(fleetLayout.sections[0]?.sectionId || null);
          setLoading(false);
          return;
        }

        // 3. Graceful preset fallback matching vehicle type and capacity
        if (active) {
          let preset = layoutPresets.find((p) => p.id === "deluxe-2x1");
          if (fleet.totalSeats === 32 || fleet.totalSeats >= 30) {
            preset = layoutPresets.find((p) => p.id === "standard-2x2");
          } else if (fleet.busType === "SLEEPER") {
            preset = layoutPresets.find((p) => p.id === "full-sleeper");
          }

          if (preset) {
            const built = preset.create();
            setLayout(built);
            setLayoutTitle(preset.name);
            setActiveSectionId(built.sections[0]?.sectionId || null);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load seat layout:", err);
        if (active) {
          const fallbackPreset = layoutPresets.find((p) => p.id === "deluxe-2x1");
          if (fallbackPreset) {
            const built = fallbackPreset.create();
            setLayout(built);
            setLayoutTitle(fallbackPreset.name);
            setActiveSectionId(built.sections[0]?.sectionId || null);
          }
          setLoading(false);
        }
      }
    }

    void loadLayout();

    return () => {
      active = false;
    };
  }, [fleet.fleetId, fleet.busType, fleet.totalSeats]);

  // Current active section
  const currentSection = useMemo(() => {
    if (!layout?.sections?.length) return null;
    return layout.sections.find((s) => s.sectionId === activeSectionId) || layout.sections[0];
  }, [layout, activeSectionId]);

  // Calculations for coach intelligence
  const stats = useMemo(() => {
    if (!layout) {
      return { seatCount: totalPlaces, berthCount: 0, windowCount: 0, aisleCount: 0 };
    }

    let seatCount = 0;
    let berthCount = 0;
    let windowCount = 0;
    let aisleCount = 0;

    layout.sections.forEach((sec) => {
      sec.elements.forEach((el) => {
        if (el.kind === "SEAT") {
          seatCount += 1;
        } else if (el.kind === "BERTH") {
          berthCount += 1;
        }

        if (el.kind === "SEAT" || el.kind === "BERTH") {
          const pos = getSeatPositionType(el, sec);
          if (pos.isWindow) {
            windowCount += 1;
          } else {
            aisleCount += 1;
          }
        }
      });
    });

    return { seatCount, berthCount, windowCount, aisleCount };
  }, [layout, totalPlaces]);

  // Active element under inspection
  const inspectedElement = selectedElement;
  const inspectedPos =
    inspectedElement && currentSection
      ? getSeatPositionType(inspectedElement, currentSection)
      : null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#14100E]/65 p-3 sm:p-5 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-[30px] border border-[#E0D8CE] bg-[#FAF8F5] shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="seat-map-title"
      >
        {/* ── Modal Header: Editorial Mobility Hierarchy ── */}
        <header className="border-b border-[#EAE3DC] bg-white px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  <CheckCircle2 className="size-3 text-emerald-700" />
                  Live on route
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#DDD6CE] bg-[#FAF8F5] px-2.5 py-0.5 text-[10px] font-bold text-[#655E58]">
                  <Lock className="size-2.5 text-[#7A1D1B]" />
                  Layout locked
                </span>
              </div>

              {/* Bus Name & Plate */}
              <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                <h2
                  id="seat-map-title"
                  className="text-lg sm:text-xl font-black tracking-tight text-[#191512]"
                >
                  {fleet.busName}
                </h2>
                {/* Authentic Transit Metal Plate Pill */}
                <span className="inline-flex items-center rounded-lg border border-[#D5CFC7] bg-gradient-to-b from-[#F9F7F3] to-[#ECE5DC] px-2.5 py-0.5 font-mono text-xs font-black tracking-wider text-[#2E2822] shadow-2xs">
                  {fleet.busNumber}
                </span>
              </div>

              {/* Subtitle */}
              <p className="text-xs font-semibold text-[#746E69]">
                {fleet.busType} · {totalPlaces} passenger capacity ({layoutTitle})
              </p>
            </div>

            {/* Circular Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#DCD5CD] bg-white text-[#746E69] transition hover:bg-[#FAF8F5] hover:text-[#191512] shadow-2xs"
              aria-label="Close modal"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>

        {/* ── Content Viewport ── */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Quick Metrics Bar / Tactile Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E5DFD6] bg-white p-3 sm:px-4 sm:py-3 shadow-2xs">
            {/* Seat and Berth Counts */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-bold text-[#4B443E]">
              <div className="flex items-center gap-1.5">
                <div className="size-4 rounded-md border border-[#D5CEC5] bg-gradient-to-b from-white to-[#F0EBE3] shadow-2xs" />
                <span>
                  Seats <span className="text-[#191512]">({stats.seatCount})</span>
                </span>
              </div>

              {stats.berthCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="h-5 w-3.5 rounded-md border border-[#D5CEC5] bg-gradient-to-b from-white to-[#EFEAE2] shadow-2xs" />
                  <span>
                    Sleepers <span className="text-[#191512]">({stats.berthCount})</span>
                  </span>
                </div>
              )}

              <div className="hidden sm:block h-3 w-px bg-[#E5DFD6]" />

              <span className="text-[11px] font-semibold text-[#8A827A]">
                {stats.windowCount} window · {stats.aisleCount} aisle
              </span>
            </div>

            {/* Front to Back direction indicator */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#746E69]">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#9A9188]">
                Front
              </span>
              <ArrowRight className="size-3 text-[#7A1D1B]" />
              <span className="text-[10px] font-black uppercase tracking-wider text-[#9A9188]">
                Rear
              </span>
            </div>
          </div>

          {/* Deck Switcher Tabs (Only if multi-deck) */}
          {layout && layout.sections.length > 1 && (
            <div className="flex items-center justify-center">
              <div className="inline-flex rounded-2xl border border-[#E0D8CE] bg-[#EFEAE2] p-1 shadow-2xs">
                {layout.sections.map((sec) => {
                  const isActive = (currentSection?.sectionId || "") === sec.sectionId;
                  const secPlaces = sec.elements.filter(
                    (e) => e.kind === "SEAT" || e.kind === "BERTH"
                  ).length;

                  return (
                    <button
                      key={sec.sectionId}
                      type="button"
                      onClick={() => setActiveSectionId(sec.sectionId)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-black transition-all",
                        isActive
                          ? "bg-white text-[#191512] shadow-xs"
                          : "text-[#655E58] hover:text-[#191512]"
                      )}
                    >
                      <Layers className="size-3.5 text-[#7A1D1B]" />
                      <span>{sec.name}</span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.2 text-[10px]",
                          isActive
                            ? "bg-[#FAF8F5] text-[#7A1D1B]"
                            : "bg-[#E6DFD5] text-[#655E58]"
                        )}
                      >
                        {secPlaces}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive Seat Inspector Banner */}
          <div className="flex items-center justify-between rounded-xl border border-[#E6E0D7] bg-[#FAF8F5] px-3.5 py-2 text-xs">
            {inspectedElement && inspectedPos ? (
              <div className="flex items-center gap-2 font-bold text-[#191512]">
                <span className="flex size-5 items-center justify-center rounded-md bg-[#7A1D1B] text-[10px] font-black text-white">
                  {inspectedElement.label}
                </span>
                <span>
                  Seat {inspectedElement.label} · {inspectedPos.label} (Row{" "}
                  {inspectedElement.position.y + 1})
                </span>
                <span className="rounded-md bg-[#EBE4DA] px-1.5 py-0.5 text-[10px] font-bold text-[#554E48]">
                  {inspectedElement.kind === "BERTH" ? "Sleeper Berth" : "Reclining Seat"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[#746E69]">
                <BusFront className="size-4 text-[#7A1D1B]" />
                <span className="text-xs font-semibold">
                  Hover or tap any seat to inspect exact position and window/aisle orientation.
                </span>
              </div>
            )}

            <span className="text-[11px] font-bold text-[#8A827A]">
              {currentSection?.name || "Passenger Cabin"}
            </span>
          </div>

          {/* Coach Blueprint Body */}
          {loading ? (
            <div className="flex h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-[#DDD6CE] bg-white">
              <BusFront className="size-8 animate-pulse text-[#7A1D1B]" />
              <p className="mt-3 text-xs font-bold text-[#746E69]">Loading coach arrangement…</p>
            </div>
          ) : currentSection ? (
            <div className="py-2">
              <CoachDeckViewer
                section={currentSection}
                selectedElement={selectedElement}
                onSelectElement={(el) => setSelectedElement(el)}
              />
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-[#DDD6CE] bg-white text-center">
              <BusFront className="size-8 text-[#B5ABA1]" />
              <p className="mt-2 text-sm font-bold text-[#191512]">No layout arrangement found</p>
              <p className="mt-1 text-xs text-[#746E69]">
                This bus has no active layout assigned yet.
              </p>
            </div>
          )}
        </div>

        {/* ── Modal Footer: Single Dominant Action ── */}
        <footer className="flex flex-col gap-3 border-t border-[#EAE3DD] bg-white px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#655E58]">
            <ShieldCheck className="size-4 shrink-0 text-emerald-700" />
            <span>Active trips & passenger bookings are locked to this layout.</span>
          </div>

          <div className="flex items-center justify-end gap-2.5">
            {onOpenStudio && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStudio(fleet.fleetId);
                }}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#DCD5CD] bg-white px-4 text-xs font-bold text-[#554E48] transition hover:bg-[#FAF8F5] hover:text-[#191512]"
              >
                <span>Layout studio</span>
                <ArrowRight className="size-3 text-[#7A1D1B]" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-full bg-[#7A1D1B] px-6 text-xs font-black text-white shadow-sm transition hover:bg-[#641715]"
            >
              Done
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

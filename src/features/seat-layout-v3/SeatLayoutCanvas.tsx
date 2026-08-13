"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { applyTool, canMoveElement, canPlacePassenger } from "./layout";
import type { BuilderTool, LayoutElement, LayoutSection, SeatLayoutV3 } from "./types";

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

function EntryDoorIcon({ className }: { className?: string }) {
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
      <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
      <path d="M2 20h20" />
      <path d="M14 12v.01" />
      <path d="m10 10 3 2-3 2" />
    </svg>
  );
}

function PlaceContent({ element, isSelected }: { element: LayoutElement; isSelected: boolean }) {
  if (element.kind === "BERTH") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-between py-2 px-1">
        {/* Pillow Headrest Notch */}
        <div
          className={cn(
            "h-1.5 w-7 rounded-full transition-colors",
            isSelected ? "bg-white/40" : "bg-[#D6CEC5]"
          )}
        />
        {/* Berth Label */}
        <span className="text-xs font-bold tracking-tight">{element.label}</span>
        {/* Footrest line */}
        <div
          className={cn(
            "h-1 w-4 rounded-full transition-colors",
            isSelected ? "bg-white/20" : "bg-[#EAE4DC]"
          )}
        />
      </div>
    );
  }

  if (element.kind === "DOOR") {
    return (
      <div className="flex flex-col items-center gap-1 text-[#78716C]">
        <EntryDoorIcon className="size-4 text-[#7A1D1B]" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Entry</span>
      </div>
    );
  }

  if (element.kind === "DRIVER") {
    return (
      <div className="flex flex-col items-center gap-1 text-[#78716C]">
        <SteeringWheelIcon className="size-4 text-[#7A1D1B]" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Driver</span>
      </div>
    );
  }

  if (element.kind === "AISLE") return null;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-1">
      <span className="text-xs font-bold tracking-tight">{element.label}</span>
      <div
        className={cn(
          "h-1 w-5 rounded-full transition-colors",
          isSelected ? "bg-white/40" : "bg-[#D6CEC5]"
        )}
      />
    </div>
  );
}

function FrontCabin({ section }: { section: LayoutSection }) {
  const upper = section.role.startsWith("UPPER");
  return (
    <div className="flex items-center justify-between rounded-t-[24px] border-b border-[#EAE4DC] bg-[#FAF8F5] px-4 sm:px-5 py-3.5">
      {!upper ? (
        <>
          <div className="flex items-center gap-2 text-xs font-bold text-[#292524]">
            <div className="flex size-7 items-center justify-center rounded-lg border border-[#E5DFD9] bg-white shadow-xs">
              <EntryDoorIcon className="size-4 text-[#7A1D1B]" />
            </div>
            <span>Entry</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-[#292524]">
            <span>Driver</span>
            <div className="flex size-7 items-center justify-center rounded-lg border border-[#E5DFD9] bg-white shadow-xs">
              <SteeringWheelIcon className="size-4 text-[#7A1D1B]" />
            </div>
          </div>
        </>
      ) : (
        <div className="flex w-full items-center justify-center py-0.5">
          <span className="text-xs font-bold tracking-wide text-[#78716C]">Upper Deck</span>
        </div>
      )}
    </div>
  );
}

type CanvasProps = {
  layout: SeatLayoutV3;
  tool: BuilderTool;
  selectedId: string | null;
  selectedIds?: string[];
  editable?: boolean;
  onChange: (layout: SeatLayoutV3) => void;
  onSelect: (id: string | null) => void;
  onMove?: (sectionId: string, elementId: string, x: number, y: number) => void;
};

interface ActiveDrag {
  element: LayoutElement;
  clientX: number;
  clientY: number;
  targetCol: number;
  targetRow: number;
  isValid: boolean;
}

function Deck({
  section,
  layout,
  tool,
  selectedId,
  selectedIds = [],
  editable,
  onChange,
  onSelect,
  onMove,
}: CanvasProps & { section: LayoutSection }) {
  const isEditable = editable ?? Boolean(onMove);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const suppressClick = useRef(false);

  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);

  const cells = Array.from({ length: section.widthUnits * section.heightUnits }, (_, index) => ({
    x: index % section.widthUnits,
    y: Math.floor(index / section.widthUnits),
  }));

  const places = section.elements.filter((element) => element.kind === "SEAT" || element.kind === "BERTH");

  // Calculate target grid coordinate from a pointer point
  function computeTarget(
    clientX: number,
    clientY: number,
    kind: "SEAT" | "BERTH",
    elementId?: string
  ): { col: number; row: number; isValid: boolean } | null {
    const grid = gridRef.current;
    if (!grid) return null;
    const bounds = grid.getBoundingClientRect();
    if (clientX < bounds.left || clientX > bounds.right || clientY < bounds.top || clientY > bounds.bottom) {
      return null;
    }

    const colWidth = bounds.width / section.widthUnits;
    const rowHeight = bounds.height / section.heightUnits;

    const relX = clientX - bounds.left;
    const relY = clientY - bounds.top;

    const spanWidth = 1;
    const spanHeight = kind === "BERTH" ? 2 : 1;

    let col = Math.floor(relX / colWidth);
    let row = Math.floor(relY / rowHeight);

    col = Math.max(0, Math.min(section.widthUnits - spanWidth, col));
    row = Math.max(0, Math.min(section.heightUnits - spanHeight, row));

    const isValid = elementId
      ? canMoveElement(layout, section.sectionId, elementId, col, row)
      : canPlacePassenger(layout, section.sectionId, col, row, kind);

    return { col, row, isValid };
  }

  function handleStartDrag(e: React.PointerEvent<HTMLButtonElement>, element: LayoutElement) {
    if (!isEditable || !onMove || tool !== "SELECT" || (element.kind !== "SEAT" && element.kind !== "BERTH")) return;
    if (e.pointerType === "mouse" && e.button !== 0) return; // only primary mouse button

    const startX = e.clientX;
    const startY = e.clientY;
    let hasMoved = false;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dist = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
      if (!hasMoved && dist > 4) {
        hasMoved = true;
      }
      if (!hasMoved) return;

      // Prevent native touch scrolling when dragging a seat
      if (moveEvent.cancelable) {
        moveEvent.preventDefault();
      }

      const target = computeTarget(
        moveEvent.clientX,
        moveEvent.clientY,
        element.kind as "SEAT" | "BERTH",
        element.elementId
      );

      if (target) {
        setActiveDrag({
          element,
          clientX: moveEvent.clientX,
          clientY: moveEvent.clientY,
          targetCol: target.col,
          targetRow: target.row,
          isValid: target.isValid,
        });
      }
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);

      if (hasMoved) {
        suppressClick.current = true;
        const target = computeTarget(
          upEvent.clientX,
          upEvent.clientY,
          element.kind as "SEAT" | "BERTH",
          element.elementId
        );

        if (target && target.isValid) {
          onMove?.(section.sectionId, element.elementId, target.col, target.row);
          onSelect(element.elementId);
        }
      }

      setActiveDrag(null);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  }

  return (
    <div className="flex flex-col items-center">
      {/* Deck Title and Counter */}
      <div className="mb-2.5 flex w-full max-w-[340px] sm:max-w-[380px] items-center justify-between px-1">
        <span className="text-xs font-semibold text-[#44403C]">{section.name}</span>
        <span className="text-xs text-[#78716C]">{places.length} places</span>
      </div>

      {/* Bus Shell Container */}
      <div className="w-full max-w-[340px] sm:max-w-[380px] rounded-[26px] border border-[#E5DFD9] bg-white shadow-sm overflow-hidden select-none">
        <FrontCabin section={section} />

        {/* Interior Floor */}
        <div className="p-3.5 sm:p-5 bg-[#FAF8F5]">
          <div
            ref={gridRef}
            onPointerMove={(event) => {
              if (tool === "SEAT" || tool === "BERTH") {
                const target = computeTarget(event.clientX, event.clientY, tool);
                if (target && target.isValid) {
                  setHoverCell({ x: target.col, y: target.row });
                } else {
                  setHoverCell(null);
                }
              }
            }}
            onPointerLeave={() => setHoverCell(null)}
            className="relative grid gap-2 sm:gap-2.5"
            style={{
              gridTemplateColumns: `repeat(${section.widthUnits}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${section.heightUnits}, minmax(44px, 48px))`,
            }}
          >
            {/* Grid cell buttons with explicit gridColumn and gridRow */}
            {cells.map(({ x, y }) => (
              <button
                key={`${x}:${y}`}
                type="button"
                disabled={!isEditable}
                data-layout-cell="true"
                data-section-id={section.sectionId}
                data-x={x}
                data-y={y}
                aria-label={`Position ${x + 1}, ${y + 1}`}
                onClick={() => {
                  if (!isEditable) return;
                  if (tool === "SELECT") {
                    if (selectedId) {
                      const selectedElement = section.elements.find((el) => el.elementId === selectedId);
                      if (selectedElement && canMoveElement(layout, section.sectionId, selectedId, x, y)) {
                        onMove?.(section.sectionId, selectedId, x, y);
                        return;
                      }
                    }
                    return onSelect(null);
                  }
                  if (
                    (tool === "SEAT" || tool === "BERTH") &&
                    !canPlacePassenger(layout, section.sectionId, x, y, tool)
                  )
                    return;

                  setHoverCell(null);
                  const nextLayout = applyTool(layout, section.sectionId, x, y, tool);
                  onChange(nextLayout);

                  // Auto-select the placed element so it's immediately editable
                  const placed = nextLayout.sections
                    .find((s) => s.sectionId === section.sectionId)
                    ?.elements.find((el) => el.position.x === x && el.position.y === y);
                  if (placed) {
                    onSelect(placed.elementId);
                  }
                }}
                className={cn(
                  "rounded-xl border border-transparent transition min-h-[44px] sm:min-h-[48px]",
                  isEditable &&
                    tool !== "SELECT" &&
                    tool !== "ERASE" &&
                    "hover:border-dashed hover:border-[#D6CEC5] hover:bg-[#F2EDE5]/50 cursor-pointer",
                  !isEditable && "pointer-events-none"
                )}
                style={{
                  gridColumn: `${x + 1} / span 1`,
                  gridRow: `${y + 1} / span 1`,
                }}
              />
            ))}

            {/* Add Tool Placement Ghost Preview (Only when cell is free & valid) */}
            {!activeDrag &&
              hoverCell &&
              (tool === "SEAT" || tool === "BERTH") &&
              canPlacePassenger(layout, section.sectionId, hoverCell.x, hoverCell.y, tool) && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none z-20 rounded-xl border-2 border-dashed border-[#7A1D1B] bg-[#7A1D1B]/5 text-[#7A1D1B] flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    gridColumn: `${hoverCell.x + 1} / span 1`,
                    gridRow: `${hoverCell.y + 1} / span ${tool === "BERTH" ? 2 : 1}`,
                  }}
                >
                  <span>{tool === "BERTH" ? "Sleeper" : "Seat"}</span>
                </div>
              )}

            {/* Snapped Drag Target Ghost Footprint */}
            {activeDrag && (
              <div
                aria-hidden="true"
                className={cn(
                  "pointer-events-none z-30 flex items-center justify-center rounded-xl border-2 border-dashed text-xs font-bold transition-all",
                  activeDrag.isValid
                    ? "border-[#7A1D1B] bg-[#7A1D1B]/10 text-[#7A1D1B]"
                    : "border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626]"
                )}
                style={{
                  gridColumn: `${activeDrag.targetCol + 1} / span ${activeDrag.element.size.width}`,
                  gridRow: `${activeDrag.targetRow + 1} / span ${activeDrag.element.size.height}`,
                }}
              >
                <span>{activeDrag.element.label}</span>
              </div>
            )}

            {/* Layout Elements (Seats and Sleepers) */}
            {section.elements.map((element) => {
              const isSelected = selectedId === element.elementId || selectedIds.includes(element.elementId);
              const isCurrentlyDragging = activeDrag?.element.elementId === element.elementId;

              // If currently being dragged, show an empty dashed origin placeholder in the grid
              if (isCurrentlyDragging) {
                return (
                  <div
                    key={element.elementId}
                    className="z-0 rounded-xl border-2 border-dashed border-[#D6CEC5] bg-transparent opacity-30 pointer-events-none"
                    style={{
                      gridColumn: `${element.position.x + 1} / span ${element.size.width}`,
                      gridRow: `${element.position.y + 1} / span ${element.size.height}`,
                    }}
                  />
                );
              }

              return (
                <button
                  key={element.elementId}
                  type="button"
                  disabled={!isEditable}
                  onPointerDown={(event) => handleStartDrag(event, element)}
                  onClick={() => {
                    if (suppressClick.current) {
                      suppressClick.current = false;
                      return;
                    }
                    if (!isEditable) return;
                    if (tool === "SELECT") onSelect(element.elementId);
                    else onChange(applyTool(layout, section.sectionId, element.position.x, element.position.y, tool));
                  }}
                  className={cn(
                    "z-10 flex min-h-0 select-none items-center justify-center rounded-xl border transition-all duration-100",
                    !isSelected &&
                      !isCurrentlyDragging &&
                      "bg-white border-[#E5DFD9] text-[#1C1917] hover:border-[#C4B9AD] shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
                    isSelected &&
                      !isCurrentlyDragging &&
                      "bg-[#7A1D1B] border-[#7A1D1B] text-white shadow-sm ring-2 ring-[#7A1D1B] ring-offset-2",
                    isCurrentlyDragging &&
                      "opacity-25 border-2 border-dashed border-[#D6CEC5] bg-transparent text-transparent",
                    isEditable &&
                      tool === "SELECT" &&
                      (element.kind === "SEAT" || element.kind === "BERTH") &&
                      "cursor-grab active:cursor-grabbing hover:-translate-y-0.5 touch-none",
                    !isEditable && "pointer-events-none"
                  )}
                  style={{
                    gridColumn: `${element.position.x + 1} / span ${element.size.width}`,
                    gridRow: `${element.position.y + 1} / span ${element.size.height}`,
                  }}
                >
                  <PlaceContent element={element} isSelected={isSelected && !isCurrentlyDragging} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Subtle Bus Rear Bumper */}
        <div className="h-2.5 bg-[#FAF8F5] border-t border-[#EAE4DC] flex items-center justify-center">
          <div className="h-0.5 w-10 rounded-full bg-[#E5DFD9]" />
        </div>
      </div>

      {/* Floating Drag Avatar Following Cursor Smoothly */}
      {activeDrag && (
        <div
          className={cn(
            "pointer-events-none fixed z-50 flex select-none items-center justify-center rounded-xl border text-xs font-bold shadow-2xl transition-transform",
            "bg-[#7A1D1B] border-[#7A1D1B] text-white",
            activeDrag.isValid ? "scale-105" : "scale-95 opacity-80 bg-stone-800 border-stone-800"
          )}
          style={{
            left: activeDrag.clientX - (activeDrag.element.kind === "BERTH" ? 32 : 28),
            top: activeDrag.clientY - (activeDrag.element.kind === "BERTH" ? 48 : 24),
            width: activeDrag.element.kind === "BERTH" ? 64 : 56,
            height: activeDrag.element.kind === "BERTH" ? 96 : 48,
          }}
        >
          <PlaceContent element={activeDrag.element} isSelected={true} />
        </div>
      )}
    </div>
  );
}

export default function SeatLayoutCanvas(props: CanvasProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-center gap-6 md:gap-8 py-2",
        props.layout.sections.length > 1 ? "grid md:grid-cols-2 max-w-3xl mx-auto" : "max-w-sm mx-auto"
      )}
    >
      {props.layout.sections.map((section) => (
        <Deck key={section.sectionId} section={section} {...props} />
      ))}
    </div>
  );
}

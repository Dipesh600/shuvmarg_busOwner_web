"use client";

import { useRef, useState, type PointerEvent } from "react";
import { Armchair, BedDouble, CircleGauge, DoorOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { applyTool } from "./layout";
import type { BuilderTool, LayoutElement, LayoutSection, SeatLayoutV3 } from "./types";

const colors: Record<LayoutElement["kind"], string> = {
  SEAT: "border-[#C6655D] bg-[#FFF7F4] text-[#722A25]",
  BERTH: "border-[#7463A5] bg-[#F7F4FF] text-[#463778]",
  AISLE: "border-[#E8E1DB] bg-[#FAF8F5] text-[#9A9189]",
  DOOR: "border-emerald-500 bg-emerald-50 text-emerald-700",
  DRIVER: "border-amber-500 bg-amber-50 text-amber-800",
};

function PlaceContent({ element }: { element: LayoutElement }) {
  if (element.kind === "BERTH") return <><BedDouble className="size-4 shrink-0" /><span>{element.label}</span></>;
  if (element.kind === "DOOR") return <><DoorOpen className="size-4" /><span className="sr-only">Door</span></>;
  if (element.kind === "DRIVER") return <><CircleGauge className="size-4" /><span className="sr-only">Driver</span></>;
  if (element.kind === "AISLE") return null;
  return <><Armchair className="size-3.5 shrink-0" /><span>{element.label}</span></>;
}

function FrontCabin({ section }: { section: LayoutSection }) {
  const upper = section.role.startsWith("UPPER");
  return <div className="mb-2 grid grid-cols-[1fr_auto_1fr] items-center rounded-t-[26px] border-b border-[#E8E1DB] bg-[#F7F3EE] px-4 py-3">
    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#817870]">{!upper && <><DoorOpen className="size-4" />Entry</>}</div>
    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A0978F]">Front</span>
    <div className="flex justify-end text-[#4E4843]">{!upper && <CircleGauge className="size-6" aria-label="Driver" />}</div>
  </div>;
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

function Deck({ section, layout, tool, selectedId, selectedIds = [], editable, onChange, onSelect, onMove }: CanvasProps & { section: LayoutSection }) {
  const isEditable = editable ?? Boolean(onMove);
  const drag = useRef<{ pointerId: number; elementId: string; startX: number; startY: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const cells = Array.from({ length: section.widthUnits * section.heightUnits }, (_, index) => ({ x: index % section.widthUnits, y: Math.floor(index / section.widthUnits) }));
  const places = section.elements.filter((element) => element.kind === "SEAT" || element.kind === "BERTH");
  function beginMove(event: PointerEvent<HTMLButtonElement>, element: LayoutElement) {
    if (!isEditable || !onMove || tool !== "SELECT" || !["SEAT", "BERTH"].includes(element.kind)) return;
    drag.current = { pointerId: event.pointerId, elementId: element.elementId, startX: event.clientX, startY: event.clientY, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingId(element.elementId);
  }
  function trackMove(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - current.startX, event.clientY - current.startY) > 5) {
      current.moved = true;
      event.preventDefault();
    }
  }
  function finishMove(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (current.moved) {
      const target = document.elementsFromPoint(event.clientX, event.clientY)
        .find((item) => item instanceof HTMLElement && item.dataset.layoutCell === "true") as HTMLElement | undefined;
      if (target?.dataset.sectionId === section.sectionId) {
        onMove?.(section.sectionId, current.elementId, Number(target.dataset.x), Number(target.dataset.y));
      }
      suppressClick.current = true;
    }
    drag.current = null;
    setDraggingId(null);
  }
  return <section className="min-w-0 overflow-hidden rounded-[30px] border border-[#DED5CD] bg-white shadow-[0_12px_34px_rgba(44,35,29,0.08)]">
    <div className="flex items-center justify-between px-5 pb-3 pt-4"><div><p className="text-sm font-black text-[#191512]">{section.name}</p><p className="mt-0.5 text-[10px] font-bold text-[#938A82]">{section.role.startsWith("UPPER") ? "Upper level" : "Main passenger cabin"}</p></div><span className="rounded-full bg-[#FAF8F5] px-2.5 py-1 text-[10px] font-bold text-[#746E69]">{places.length} places</span></div>
    <div className="mx-auto mb-5 w-[calc(100%_-_24px)] max-w-[430px] overflow-hidden rounded-[30px] border-2 border-[#D8CEC5] bg-[#FCFAF7] shadow-inner">
      <FrontCabin section={section} />
      <div className="relative px-3 pb-4">
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-8 -translate-x-1/2 rounded-full bg-[#F4F0EB]" aria-hidden="true" />
        <div className="relative grid gap-2" style={{ gridTemplateColumns: `repeat(${section.widthUnits}, minmax(34px, 1fr))`, gridTemplateRows: `repeat(${section.heightUnits}, 48px)` }}>
          {cells.map(({ x, y }) => <button key={`${x}:${y}`} type="button" disabled={!isEditable} data-layout-cell="true" data-section-id={section.sectionId} data-x={x} data-y={y} aria-label={`Position ${x + 1}, ${y + 1}`} onClick={() => { if (!isEditable) return; const hit = section.elements.find((element) => x >= element.position.x && x < element.position.x + element.size.width && y >= element.position.y && y < element.position.y + element.size.height); if (tool === "SELECT") onSelect(hit?.elementId || null); else onChange(applyTool(layout, section.sectionId, x, y, tool)); }} className={cn("rounded-xl border border-transparent transition", isEditable && "hover:border-dashed hover:border-[#CFC3B9] hover:bg-white/70 focus-visible:border-[#7A1D1B]", draggingId && "border-dashed border-[#CFC3B9]", !isEditable && "pointer-events-none")} />)}
          {section.elements.map((element) => <button key={element.elementId} type="button" disabled={!isEditable} onPointerDown={(event) => beginMove(event, element)} onPointerMove={trackMove} onPointerUp={finishMove} onPointerCancel={finishMove} onClick={() => { if (suppressClick.current) { suppressClick.current = false; return; } if (!isEditable) return; if (tool === "SELECT") onSelect(element.elementId); else onChange(applyTool(layout, section.sectionId, element.position.x, element.position.y, tool)); }} className={cn("z-10 flex min-h-0 touch-none select-none items-center justify-center gap-1 overflow-hidden rounded-[13px] border text-[10px] font-black shadow-[0_2px_0_rgba(92,72,59,0.14)] transition", colors[element.kind], element.kind === "SEAT" && "after:absolute after:inset-x-1.5 after:bottom-1 after:h-1 after:rounded-full after:bg-current after:opacity-15", element.kind === "BERTH" && "m-0.5 rounded-[15px]", (selectedId === element.elementId || selectedIds.includes(element.elementId)) && "ring-2 ring-[#7A1D1B] ring-offset-2", draggingId === element.elementId && "scale-105 opacity-75 ring-2 ring-[#7A1D1B]", isEditable && tool === "SELECT" && (element.kind === "SEAT" || element.kind === "BERTH") && "cursor-grab hover:-translate-y-0.5 active:cursor-grabbing", !isEditable && "pointer-events-none")} style={{ gridColumn: `${element.position.x + 1} / span ${element.size.width}`, gridRow: `${element.position.y + 1} / span ${element.size.height}`, position: "relative" }}><PlaceContent element={element} /></button>)}
        </div>
      </div>
    </div>
    {isEditable && <p className="border-t border-[#EEE8E2] px-5 py-3 text-center text-[10px] font-bold text-[#938A82]">Select a place to edit · drag to reposition</p>}
  </section>;
}

export default function SeatLayoutCanvas(props: CanvasProps) {
  return <div className={cn("grid items-start gap-4", props.layout.sections.length > 1 && "lg:grid-cols-2")}>{props.layout.sections.map((section) => <Deck key={section.sectionId} section={section} {...props} />)}</div>;
}

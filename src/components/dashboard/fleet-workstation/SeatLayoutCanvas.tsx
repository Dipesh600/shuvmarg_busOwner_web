"use client";

import type { SeatLayoutConfig, SeatType } from "@/features/operator-dashboard/operator-fleet-api";
import { applyLayoutTool, type LayoutTool, SEAT_TYPE_LABELS, updateSeat } from "@/features/seat-layout/seat-layout-tools";

interface Props {
  layout: SeatLayoutConfig;
  floorIndex: number;
  tool: LayoutTool | "TOGGLE_ACTIVE";
  onChange: (layout: SeatLayoutConfig) => void;
}

const tone: Record<SeatType, string> = {
  STANDARD: "border-stone-300 bg-white text-stone-800",
  SEMI_SLEEPER: "border-sky-300 bg-sky-50 text-sky-900",
  SLEEPER_LOWER: "border-violet-400 bg-violet-100 text-violet-950",
  SLEEPER_UPPER: "border-indigo-400 bg-indigo-100 text-indigo-950",
  SOFA: "border-amber-400 bg-amber-100 text-amber-950",
  PRIORITY: "border-emerald-400 bg-emerald-100 text-emerald-950",
};

function floorTitle(layout: SeatLayoutConfig, index: number) {
  if (layout.busShape === "SLEEPER_COACH") return index === 0 ? "Lower berths" : "Upper berths";
  if (layout.floors.length > 1) return index === 0 ? "Lower deck" : "Upper deck";
  return "Passenger deck";
}

export default function SeatLayoutCanvas({ layout, floorIndex, tool, onChange }: Props) {
  const floor = layout.floors[floorIndex];
  if (!floor) return null;
  const covered = new Set<string>();
  for (const row of floor.rows) for (const cell of row.cells) {
    if (cell.cellType !== "SEAT") continue;
    for (let r = row.rowIndex; r < row.rowIndex + (cell.rowSpan || 1); r += 1) {
      for (let c = cell.colIndex; c < cell.colIndex + (cell.colSpan || 1); c += 1) {
        if (r !== row.rowIndex || c !== cell.colIndex) covered.add(`${r}:${c}`);
      }
    }
  }
  const apply = (rowIndex: number, colIndex: number) => {
    const cell = floor.rows[rowIndex]?.cells.find((item) => item.colIndex === colIndex);
    if (!cell) return;
    if (tool === "TOGGLE_ACTIVE") {
      if (cell.cellType === "SEAT") onChange(updateSeat(layout, floorIndex, rowIndex, colIndex, { isActive: cell.isActive === false }));
      return;
    }
    onChange(applyLayoutTool(layout, floorIndex, rowIndex, colIndex, tool));
  };

  return (
    <section className="min-w-0 rounded-[28px] border border-[#DED6CF] bg-[#F7F3EE] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div><p className="text-sm font-black text-[#201B18]">{floorTitle(layout, floorIndex)}</p><p className="text-[11px] text-[#817A74]">Front at top · rear at bottom</p></div>
        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#817A74]">Level {floorIndex + 1}</span>
      </div>
      <div className="mx-auto max-w-md rounded-[34px] border-[3px] border-[#CFC5BC] bg-white p-4 shadow-[inset_0_0_0_1px_#eee7e0]">
        <div className="mb-4 flex items-center justify-between border-b border-[#EEE8E2] pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9A928B]"><span>Entry</span><span>Driver / front</span></div>
        <div
          className="grid auto-rows-[50px] gap-2"
          style={{ gridTemplateColumns: `repeat(${layout.totalColumns}, minmax(38px, 1fr))` }}
        >
          {floor.rows.flatMap((row) => row.cells.map((cell) => {
            if (covered.has(`${row.rowIndex}:${cell.colIndex}`)) return null;
            const placement = {
              gridRow: `${row.rowIndex + 1} / span ${cell.rowSpan || 1}`,
              gridColumn: `${cell.colIndex + 1} / span ${cell.colSpan || 1}`,
            };
            if (cell.cellType === "SEAT") {
              const type = cell.seatType || "STANDARD";
              return <button key={`${row.rowIndex}:${cell.colIndex}`} type="button" style={placement} onClick={() => apply(row.rowIndex, cell.colIndex)} title={`${cell.seatLabel} · ${SEAT_TYPE_LABELS[type]}`} className={`rounded-xl border-2 p-1 text-[10px] font-black transition hover:-translate-y-0.5 hover:shadow-md ${tone[type]} ${cell.isActive === false ? "opacity-35 grayscale line-through" : ""}`}><span className="block">{cell.seatLabel}</span>{(cell.rowSpan || 1) > 1 && <span className="mt-1 block text-[8px] font-bold uppercase opacity-60">Berth</span>}</button>;
            }
            const label = cell.cellType === "AISLE" ? "Aisle" : cell.cellType === "DOOR" ? "Door" : "+";
            return <button key={`${row.rowIndex}:${cell.colIndex}`} type="button" style={placement} onClick={() => apply(row.rowIndex, cell.colIndex)} className={`rounded-lg border border-dashed text-[9px] font-bold uppercase transition ${cell.cellType === "AISLE" ? "border-transparent bg-stone-100/70 text-stone-400" : cell.cellType === "DOOR" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-stone-200 text-stone-300 hover:border-[#7A1D1B] hover:text-[#7A1D1B]"}`}>{label}</button>;
          }))}
        </div>
        <div className="mt-4 border-t border-[#EEE8E2] pt-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#AAA29A]">Rear</div>
      </div>
    </section>
  );
}

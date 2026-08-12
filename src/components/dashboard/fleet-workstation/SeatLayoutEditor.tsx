"use client";

import { useState } from "react";
import type { SeatLayoutConfig, SeatType } from "@/features/operator-dashboard/operator-fleet-api";
import { countSeats, createBlankLayout, createPreset, type LayoutTool, SEAT_TYPE_LABELS, updateSeat } from "@/features/seat-layout/seat-layout-tools";
import SeatLayoutCanvas from "./SeatLayoutCanvas";

interface Props { value: SeatLayoutConfig; onChange: (layout: SeatLayoutConfig) => void; }
type CanvasTool = LayoutTool | "TOGGLE_ACTIVE";

const toolOptions: Array<{ value: CanvasTool; label: string }> = [
  ...Object.entries(SEAT_TYPE_LABELS).map(([value, label]) => ({ value: value as SeatType, label })),
  { value: "AISLE", label: "Aisle" }, { value: "DOOR", label: "Door" },
  { value: "EMPTY", label: "Erase" }, { value: "TOGGLE_ACTIVE", label: "Withdraw / restore" },
];

export default function SeatLayoutEditor({ value, onChange }: Props) {
  const [tool, setTool] = useState<CanvasTool>("STANDARD");
  const [rows, setRows] = useState(value.floors[0]?.rows.length || 10);
  const [columns, setColumns] = useState(value.totalColumns || 5);
  const resetBlank = () => onChange(createBlankLayout(value.busShape, rows, columns));

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-[#E8E1DB] bg-white p-5">
        <div className="grid gap-5 xl:grid-cols-[240px_1fr]">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#817A74]">Vehicle structure</p><select value={value.busShape} onChange={(event) => onChange(createPreset(event.target.value as SeatLayoutConfig["busShape"]))} className="mt-2 h-11 w-full rounded-xl border border-[#DCD4CD] bg-white px-3 text-sm font-semibold"><option value="SINGLE_DECKER">Single deck</option><option value="DOUBLE_DECKER">Double decker</option><option value="SLEEPER_COACH">Sleeper coach</option><option value="MINI">Mini bus</option></select><button type="button" onClick={() => onChange(createPreset(value.busShape))} className="mt-2 w-full rounded-xl bg-[#FAF8F5] px-3 py-2 text-xs font-bold text-[#655E58]">Load realistic starter layout</button></div>
          <div><div className="flex flex-wrap items-end gap-3"><label className="text-xs font-bold text-[#655E58]">Rows<input type="number" min={4} max={20} value={rows} onChange={(event) => setRows(Number(event.target.value))} className="mt-2 block h-10 w-24 rounded-xl border border-[#DCD4CD] px-3" /></label><label className="text-xs font-bold text-[#655E58]">Columns<input type="number" min={3} max={7} value={columns} onChange={(event) => setColumns(Number(event.target.value))} className="mt-2 block h-10 w-24 rounded-xl border border-[#DCD4CD] px-3" /></label><button type="button" onClick={resetBlank} className="h-10 rounded-xl border border-[#7A1D1B] px-4 text-xs font-bold text-[#7A1D1B]">Build blank canvas</button></div><p className="mt-2 text-xs text-[#817A74]">A blank canvas clears this draft only. It does not change the live fleet until the governed save flow completes.</p></div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#E8E1DB] bg-white p-5"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#817A74]">Placement tool</p><p className="mt-1 text-sm text-[#655E58]">Choose an object, then click its anchor position on either canvas.</p></div><div className="rounded-2xl bg-[#FAF8F5] px-4 py-2 text-right"><strong className="text-xl">{countSeats(value)}</strong><span className="ml-2 text-xs text-[#817A74]">active seats</span></div></div><div className="mt-4 flex flex-wrap gap-2">{toolOptions.map((item) => <button key={item.value} type="button" onClick={() => setTool(item.value)} className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${tool === item.value ? "border-[#7A1D1B] bg-[#7A1D1B] text-white" : "border-[#DDD5CE] bg-white text-[#655E58] hover:border-[#7A1D1B]"}`}>{item.label}</button>)}</div>{tool.startsWith("SLEEPER") && <p className="mt-3 rounded-xl bg-violet-50 p-3 text-xs text-violet-900">A sleeper berth occupies two grid rows. Placement is refused when that footprint overlaps another seat or runs outside the coach.</p>}</section>

      <div className={`grid gap-5 ${value.floors.length > 1 ? "xl:grid-cols-2" : "max-w-3xl"}`}>{value.floors.map((floor) => <SeatLayoutCanvas key={floor.floorIndex} layout={value} floorIndex={floor.floorIndex} tool={tool} onChange={onChange} />)}</div>

      <details className="rounded-3xl border border-[#E8E1DB] bg-white p-5"><summary className="cursor-pointer text-sm font-black">Seat labels and status</summary><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-[#FAF8F5] text-[#817A74]"><tr><th className="p-3">Level</th><th className="p-3">Seat</th><th className="p-3">Type</th><th className="p-3">Label</th><th className="p-3">Status</th></tr></thead><tbody>{value.floors.flatMap((floor) => floor.rows.flatMap((row) => row.cells.filter((cell) => cell.cellType === "SEAT").map((cell) => <tr key={`${floor.floorIndex}:${row.rowIndex}:${cell.colIndex}`} className="border-t border-[#EEE8E2]"><td className="p-3">{floor.floorIndex + 1}</td><td className="p-3 font-bold">{cell.seatLabel}</td><td className="p-3">{SEAT_TYPE_LABELS[cell.seatType || "STANDARD"]}</td><td className="p-3"><input value={cell.seatLabel || ""} onChange={(event) => onChange(updateSeat(value, floor.floorIndex, row.rowIndex, cell.colIndex, { seatLabel: event.target.value }))} className="w-24 rounded-lg border border-[#DCD4CD] p-2" /></td><td className="p-3">{cell.isActive === false ? "Withdrawn" : "Active"}</td></tr>)))}</tbody></table></div></details>
    </div>
  );
}

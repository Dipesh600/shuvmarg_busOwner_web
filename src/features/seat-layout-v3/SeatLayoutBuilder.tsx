"use client";

import { useEffect, useRef, useState } from "react";
import {
  Armchair,
  BedDouble,
  ChevronDown,
  CircleGauge,
  DoorOpen,
  Eraser,
  ListOrdered,
  Minus,
  MousePointer2,
  Plus,
  RotateCcw,
  RotateCw,
  Rows3,
  Save,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  cloneLayout,
  hasPassengerLabel,
  insertPassengerSeatRow,
  insertPassengerSleeperRow,
  moveElement,
  passengerPlaces,
  popPassengerRow,
  removeElements,
  renumberPassengerPlaces,
  updateElement,
  type NumberingScheme,
} from "./layout";
import { layoutPresets } from "./presets";
import SeatLayoutCanvas from "./SeatLayoutCanvas";
import SeatLayoutElementEditor from "./SeatLayoutElementEditor";
import type { BuilderTool, SeatLayoutV3 } from "./types";

const tools: { id: BuilderTool; label: string; icon: typeof MousePointer2 }[] = [
  { id: "SELECT", label: "Select", icon: MousePointer2 },
  { id: "SEAT", label: "Add seats", icon: Armchair },
  { id: "BERTH", label: "Add sleeper seat", icon: BedDouble },
  { id: "AISLE", label: "Add aisle", icon: Rows3 },
  { id: "DOOR", label: "Add door", icon: DoorOpen },
  { id: "DRIVER", label: "Add driver", icon: CircleGauge },
  { id: "ERASE", label: "Remove seats", icon: Eraser },
];

const numberingOptions: { scheme: NumberingScheme; label: string; detail: string }[] = [
  { scheme: "SIDE_AB", label: "Side A & Side B", detail: "Left: A1, A2… / Right: B1, B2…" },
  { scheme: "SIDE_KHA", label: "Side Ka & Side Kha", detail: "Left: Ka1, Ka2… / Right: Kha1, Kha2…" },
  { scheme: "ROW_LETTERS", label: "Row Letters", detail: "Row 1: A1, A2… / Row 2: B1, B2…" },
  { scheme: "PREFIX_SEQUENTIAL", label: "Standard Prefix", detail: "Seats: S1, S2… / Sleepers: L1, L2… / U1, U2…" },
  { scheme: "NUMERIC_ONLY", label: "Numbers Only", detail: "1, 2, 3, 4…" },
];

export default function SeatLayoutBuilder({
  layout,
  onChange,
  onSave,
  busy = false,
  saveLabel = "Save revision",
  simple = false,
}: {
  layout: SeatLayoutV3 | null;
  onChange: (layout: SeatLayoutV3) => void;
  onSave: (layout: SeatLayoutV3) => void;
  busy?: boolean;
  saveLabel?: string;
  simple?: boolean;
}) {
  const [tool, setTool] = useState<BuilderTool>("SELECT");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState("");
  const [history, setHistory] = useState<SeatLayoutV3[]>([]);
  const [future, setFuture] = useState<SeatLayoutV3[]>([]);
  const [labelError, setLabelError] = useState<string | null>(null);
  const [showNumberMenu, setShowNumberMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowNumberMenu(false);
      }
    }
    if (showNumberMenu) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showNumberMenu]);

  const selected =
    layout?.sections.flatMap((section) => section.elements).find((element) => element.elementId === selectedId) || null;

  if (!layout) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {layoutPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange(preset.create())}
            className="rounded-[24px] border border-[#E8E1DB] bg-white p-5 text-left shadow-sm transition hover:border-[#7A1D1B] hover:shadow-md"
          >
            <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#7A1D1B]">
              <Armchair className="size-5" />
            </div>
            <p className="font-bold text-[#191512]">{preset.name}</p>
            <p className="mt-1 text-xs leading-5 text-[#746E69]">{preset.detail}</p>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[#7A1D1B]">Use starting point</p>
          </button>
        ))}
      </div>
    );
  }

  const applyChange = (next: SeatLayoutV3) => {
    if (next === layout) return;
    setHistory((items) => [...items, cloneLayout(layout)].slice(-30));
    setFuture([]);
    onChange(next);
  };

  const clearSelection = () => {
    setSelectedId(null);
    setLabelError(null);
  };

  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((items) => items.slice(0, -1));
    setFuture((items) => [cloneLayout(layout), ...items].slice(0, 30));
    clearSelection();
    onChange(previous);
  };

  const redo = () => {
    const next = future[0];
    if (!next) return;
    setFuture((items) => items.slice(1));
    setHistory((items) => [...items, cloneLayout(layout)].slice(-30));
    clearSelection();
    onChange(next);
  };

  const visibleTools = simple
    ? tools.filter(({ id }) => ["SELECT", "SEAT", "BERTH", "ERASE"].includes(id))
    : tools;

  const selectPlace = (id: string | null) => {
    if (!id) return clearSelection();
    setSelectedId(id);
    setLabelDraft(passengerPlaces(layout).find((element) => element.elementId === id)?.label || "");
    setLabelError(null);
  };

  const applyAutoNumber = (scheme: NumberingScheme) => {
    applyChange(renumberPassengerPlaces(layout, scheme));
    clearSelection();
    setShowNumberMenu(false);
  };

  const addSeatRow = (sectionId: string) => {
    applyChange(insertPassengerSeatRow(layout, sectionId));
  };

  const addSleeperRow = (sectionId: string) => {
    applyChange(insertPassengerSleeperRow(layout, sectionId));
  };

  const removeRow = (sectionId: string) => {
    applyChange(popPassengerRow(layout, sectionId));
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E8E1DB] bg-white p-2.5 shadow-sm">
        {/* Tool Segmented Switch */}
        <div className="flex flex-wrap items-center gap-1.5">
          {visibleTools.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTool(id);
                if (id !== "SELECT") clearSelection();
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition",
                tool === id
                  ? "bg-[#7A1D1B] text-white shadow-sm"
                  : "bg-transparent text-[#655E58] hover:bg-[#FAF8F5] hover:text-[#191512]"
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Action Controls: Undo, Redo, Auto-renumber */}
        <div className="flex flex-wrap items-center gap-2">

          {/* Undo / Redo */}
          <div className="flex items-center rounded-xl border border-[#E8E1DB] bg-[#FAF8F5] p-0.5">
            <button
              type="button"
              disabled={!history.length}
              onClick={undo}
              title="Undo"
              className="flex size-8 items-center justify-center rounded-lg text-xs font-bold text-[#655E58] transition hover:bg-white disabled:opacity-30"
            >
              <RotateCcw className="size-3.5" />
            </button>
            <button
              type="button"
              disabled={!future.length}
              onClick={redo}
              title="Redo"
              className="flex size-8 items-center justify-center rounded-lg text-xs font-bold text-[#655E58] transition hover:bg-white disabled:opacity-30"
            >
              <RotateCw className="size-3.5" />
            </button>
          </div>

          {/* Auto-Number with Scheme Dropdown */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setShowNumberMenu((prev) => !prev)}
              className="inline-flex h-8 items-center rounded-xl border border-[#DCD4CD] bg-white px-2.5 text-[11px] font-bold text-[#655E58] hover:border-[#7A1D1B] transition shadow-sm"
            >
              <ListOrdered className="mr-1.5 size-3.5 text-[#7A1D1B]" />
              Auto-number
              <ChevronDown className="ml-1 size-3 text-[#938A82]" />
            </button>

            {showNumberMenu && (
              <div className="absolute right-0 top-10 z-50 w-64 rounded-2xl border border-[#E8E1DB] bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                <p className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#938A82]">
                  Choose Numbering Pattern
                </p>
                <div className="space-y-1">
                  {numberingOptions.map((opt) => (
                    <button
                      key={opt.scheme}
                      type="button"
                      onClick={() => applyAutoNumber(opt.scheme)}
                      className="w-full rounded-xl px-2.5 py-2 text-left transition hover:bg-[#FAF8F5] hover:text-[#7A1D1B]"
                    >
                      <p className="text-xs font-bold text-[#191512]">{opt.label}</p>
                      <p className="text-[10px] text-[#746E69]">{opt.detail}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Builder Grid */}
      <div className="grid gap-5 md:grid-cols-[1fr_260px] items-start">
        {/* Center: Canvas Area with ample breathing room */}
        <div className="min-w-0 rounded-[26px] border border-[#E8E1DB] bg-white p-4 sm:p-6 shadow-sm">
          <SeatLayoutCanvas
            layout={layout}
            tool={tool}
            selectedId={selectedId}
            onSelect={selectPlace}
            onMove={(sectionId, elementId, x, y) => applyChange(moveElement(layout, sectionId, elementId, x, y))}
            onChange={applyChange}
          />
        </div>

        {/* Right Sidebar: Selected Place & Action */}
        <aside className="space-y-4 rounded-[26px] border border-[#E8E1DB] bg-white p-5 shadow-sm">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#938A82]">Summary</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[#191512]">{passengerPlaces(layout).length}</span>
              <span className="text-xs font-bold text-[#746E69]">places</span>
            </div>
          </div>

          {selected && (selected.kind === "SEAT" || selected.kind === "BERTH") ? (
            <div className="space-y-3 border-t border-[#EEE8E2] pt-3">
              <SeatLayoutElementEditor
                element={selected}
                labelValue={labelDraft}
                labelError={labelError}
                onLabelInput={(label) => {
                  setLabelDraft(label);
                  setLabelError(null);
                }}
                onLabelCommit={() => {
                  if (!labelDraft.trim()) return setLabelError("Passenger label is required.");
                  if (hasPassengerLabel(layout, labelDraft, selected.elementId))
                    return setLabelError("That label is already used.");
                  setLabelError(null);
                  applyChange(updateElement(layout, selected.elementId, { label: labelDraft.trim() }));
                }}
              />
              <button
                type="button"
                onClick={() => {
                  applyChange(removeElements(layout, [selected.elementId]));
                  clearSelection();
                }}
                className="flex w-full items-center justify-center rounded-xl border border-red-200 bg-red-50/40 py-2 text-xs font-bold text-red-700 hover:bg-red-100/50 transition"
              >
                <Trash2 className="mr-1.5 size-3.5" />
                Remove this place
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#E8E1DB] bg-[#FAF8F5] p-3 text-xs leading-5 text-[#817A74]">
              Select a seat or sleeper to rename or reposition. Drag or click an empty space to move.
            </div>
          )}

          {/* Deck Dimensions / Row Controls for all decks */}
          <div className="space-y-3 border-t border-[#EEE8E2] pt-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#938A82]">Add & Remove Rows</p>
            {layout.sections.map((section) => (
              <div key={section.sectionId} className="space-y-2 rounded-xl bg-[#FAF8F5] p-2.5 border border-[#E8E1DB]">
                <div className="flex items-center justify-between text-xs font-bold text-[#44403C]">
                  <span>{section.name}</span>
                  <span className="text-[11px] text-[#78716C]">{section.heightUnits} rows</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => addSeatRow(section.sectionId)}
                    disabled={section.heightUnits >= 40}
                    className="flex h-8 items-center justify-center gap-1 rounded-lg border border-[#DCD4CD] bg-white text-[11px] font-bold text-[#191512] transition hover:border-[#7A1D1B] hover:text-[#7A1D1B] disabled:opacity-40 shadow-2xs"
                  >
                    <Plus className="size-3 text-[#7A1D1B]" />
                    Seat row
                  </button>
                  <button
                    type="button"
                    onClick={() => addSleeperRow(section.sectionId)}
                    disabled={section.heightUnits + 2 > 40}
                    className="flex h-8 items-center justify-center gap-1 rounded-lg border border-[#DCD4CD] bg-white text-[11px] font-bold text-[#191512] transition hover:border-[#7A1D1B] hover:text-[#7A1D1B] disabled:opacity-40 shadow-2xs"
                  >
                    <Plus className="size-3 text-[#7A1D1B]" />
                    Sleeper (1×2)
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(section.sectionId)}
                  disabled={section.heightUnits <= 2}
                  className="flex h-7 w-full items-center justify-center gap-1 rounded-lg border border-transparent bg-stone-200/50 text-[11px] font-bold text-[#655E58] transition hover:bg-red-50 hover:text-red-700 disabled:opacity-30"
                >
                  <Minus className="size-3" />
                  Remove back row
                </button>
              </div>
            ))}
          </div>

          <button
            disabled={busy || passengerPlaces(layout).length === 0 || Boolean(labelError)}
            onClick={() => onSave(layout)}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-[#7A1D1B] text-xs font-bold text-white shadow-sm transition hover:bg-[#641715] disabled:opacity-50"
          >
            <Save className="mr-2 size-4" />
            {busy ? "Saving…" : saveLabel}
          </button>
        </aside>
      </div>
    </div>
  );
}

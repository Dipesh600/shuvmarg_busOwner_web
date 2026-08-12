import type { CellType, SeatLayoutCell, SeatLayoutConfig, SeatType } from "@/features/operator-dashboard/operator-fleet-api";

export type LayoutTool = SeatType | "AISLE" | "DOOR" | "EMPTY";

export function cloneLayout(layout: SeatLayoutConfig): SeatLayoutConfig {
  return structuredClone(layout);
}

export function countSeats(layout: SeatLayoutConfig) {
  return layout.floors.reduce((total, floor) => total + floor.rows.reduce(
    (floorTotal, row) => floorTotal + row.cells.filter((cell) => cell.cellType === "SEAT" && cell.isActive !== false).length,
    0
  ), 0);
}

function footprint(type?: SeatType) {
  return type === "SLEEPER_LOWER" || type === "SLEEPER_UPPER"
    ? { rowSpan: 2, colSpan: 1 } : { rowSpan: 1, colSpan: 1 };
}

function emptyCell(colIndex: number): SeatLayoutCell {
  return { colIndex, cellType: "EMPTY", seatId: null, seatLabel: null };
}

function blankRows(rowCount: number, columns: number) {
  return Array.from({ length: rowCount }, (_, rowIndex) => ({
    rowIndex,
    rowType: "SEAT_ROW" as const,
    cells: Array.from({ length: columns }, (_, colIndex) => emptyCell(colIndex)),
  }));
}

export function createBlankLayout(
  busShape: SeatLayoutConfig["busShape"],
  rowCount = 10,
  totalColumns = 5
): SeatLayoutConfig {
  const floorCount = busShape === "DOUBLE_DECKER" || busShape === "SLEEPER_COACH" ? 2 : 1;
  return {
    busShape,
    layoutVariant: "CUSTOM",
    hasKaKha: false,
    totalColumns,
    floors: Array.from({ length: floorCount }, (_, floorIndex) => ({
      floorIndex,
      rows: blankRows(rowCount, totalColumns),
    })),
  };
}

function nextSeatIdentity(layout: SeatLayoutConfig, floorIndex: number) {
  const count = layout.floors.flatMap((floor) => floor.rows.flatMap((row) => row.cells))
    .filter((cell) => cell.cellType === "SEAT").length + 1;
  const prefix = layout.floors.length > 1 ? (floorIndex === 0 ? "L" : "U") : "S";
  return { seatId: `${prefix}-${count}`, seatLabel: `${prefix}${count}` };
}

function occupiedByOther(layout: SeatLayoutConfig, floorIndex: number, rowIndex: number, colIndex: number) {
  const occupied = new Set<string>();
  for (const row of layout.floors[floorIndex]?.rows || []) {
    for (const cell of row.cells) {
      if (cell.cellType !== "SEAT" || (row.rowIndex === rowIndex && cell.colIndex === colIndex)) continue;
      for (let r = row.rowIndex; r < row.rowIndex + (cell.rowSpan || 1); r += 1) {
        for (let c = cell.colIndex; c < cell.colIndex + (cell.colSpan || 1); c += 1) occupied.add(`${r}:${c}`);
      }
    }
  }
  return occupied;
}

export function canPlaceSeat(layout: SeatLayoutConfig, floorIndex: number, rowIndex: number, colIndex: number, type: SeatType) {
  const floor = layout.floors[floorIndex];
  if (!floor) return false;
  const size = footprint(type);
  if (rowIndex + size.rowSpan > floor.rows.length || colIndex + size.colSpan > layout.totalColumns) return false;
  const occupied = occupiedByOther(layout, floorIndex, rowIndex, colIndex);
  for (let r = rowIndex; r < rowIndex + size.rowSpan; r += 1) {
    for (let c = colIndex; c < colIndex + size.colSpan; c += 1) if (occupied.has(`${r}:${c}`)) return false;
  }
  return true;
}

export function applyLayoutTool(
  layout: SeatLayoutConfig,
  floorIndex: number,
  rowIndex: number,
  colIndex: number,
  tool: LayoutTool
) {
  const next = cloneLayout(layout);
  const cell = next.floors[floorIndex]?.rows[rowIndex]?.cells.find((item) => item.colIndex === colIndex);
  if (!cell) return layout;
  if (tool === "EMPTY" || tool === "AISLE" || tool === "DOOR") {
    Object.assign(cell, {
      cellType: tool as CellType,
      seatId: null,
      seatLabel: tool === "DOOR" ? "Door" : null,
      seatType: undefined,
      rowSpan: undefined,
      colSpan: undefined,
    });
    return next;
  }
  if (!canPlaceSeat(next, floorIndex, rowIndex, colIndex, tool)) return layout;
  const identity = cell.cellType === "SEAT" && cell.seatId
    ? { seatId: cell.seatId, seatLabel: cell.seatLabel } : nextSeatIdentity(next, floorIndex);
  Object.assign(cell, {
    cellType: "SEAT",
    ...identity,
    seatType: tool,
    isActive: true,
    ...footprint(tool),
  });
  return next;
}

export function createPreset(shape: SeatLayoutConfig["busShape"]): SeatLayoutConfig {
  const layout = createBlankLayout(shape, shape === "MINI" ? 6 : 10, 5);
  const sleeper = shape === "SLEEPER_COACH";
  let result = layout;
  for (const floor of layout.floors) {
    for (let rowIndex = 0; rowIndex < floor.rows.length; rowIndex += sleeper ? 2 : 1) {
      const mixedUpper = shape === "DOUBLE_DECKER" && floor.floorIndex === 1 && rowIndex < 4;
      const columns = mixedUpper ? (rowIndex % 2 === 0 ? [0, 1, 3, 4] : [4]) : [0, 1, 3, 4];
      for (const colIndex of columns) {
        const upperSleeper = mixedUpper && rowIndex % 2 === 0 && colIndex !== 4;
        const type: SeatType = sleeper
          ? (floor.floorIndex === 0 ? "SLEEPER_LOWER" : "SLEEPER_UPPER")
          : upperSleeper ? "SLEEPER_UPPER" : "STANDARD";
        result = applyLayoutTool(result, floor.floorIndex, rowIndex, colIndex, type);
      }
    }
  }
  return { ...result, layoutVariant: sleeper ? "SLEEPER" : "2x2" };
}

export function updateSeat(
  layout: SeatLayoutConfig,
  floorIndex: number,
  rowIndex: number,
  colIndex: number,
  update: Partial<Pick<SeatLayoutCell, "seatLabel" | "seatType" | "isActive">>
) {
  if (update.seatType) return applyLayoutTool(layout, floorIndex, rowIndex, colIndex, update.seatType);
  const next = cloneLayout(layout);
  const cell = next.floors[floorIndex]?.rows[rowIndex]?.cells.find((item) => item.colIndex === colIndex);
  if (cell?.cellType === "SEAT") Object.assign(cell, update);
  return next;
}

interface ComparableSeat {
  seatLabel: string | null;
  seatType?: SeatType;
  isActive: boolean;
  floorIndex: number;
  rowIndex: number;
  colIndex: number;
  rowSpan: number;
  colSpan: number;
}

function seatIndex(layout: SeatLayoutConfig) {
  const result = new Map<string, ComparableSeat>();
  for (const floor of layout.floors) for (const row of floor.rows) for (const cell of row.cells) {
    if (cell.cellType !== "SEAT" || !cell.seatId) continue;
    result.set(cell.seatId.trim().toLowerCase(), {
      seatLabel: cell.seatLabel, seatType: cell.seatType, isActive: cell.isActive !== false,
      floorIndex: floor.floorIndex, rowIndex: row.rowIndex, colIndex: cell.colIndex,
      rowSpan: cell.rowSpan || 1, colSpan: cell.colSpan || 1,
    });
  }
  return result;
}

export function isAdditionOnly(current: SeatLayoutConfig, proposed: SeatLayoutConfig) {
  const before = seatIndex(current);
  const after = seatIndex(proposed);
  let added = false;
  for (const [seatId, currentSeat] of before) {
    const proposedSeat = after.get(seatId);
    if (!proposedSeat || JSON.stringify(proposedSeat) !== JSON.stringify(currentSeat)) return false;
  }
  for (const seatId of after.keys()) if (!before.has(seatId)) added = true;
  return added;
}

export const SEAT_TYPE_LABELS: Record<SeatType, string> = {
  STANDARD: "Standard", SEMI_SLEEPER: "Semi-sleeper", SLEEPER_LOWER: "Sleeper lower",
  SLEEPER_UPPER: "Sleeper upper", SOFA: "Sofa", PRIORITY: "Priority",
};

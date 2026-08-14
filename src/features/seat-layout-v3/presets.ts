import type { LayoutElement, LayoutSection, SeatLayoutV3, VehicleCategory } from "./types";
const attributes = { comfort: "STANDARD" as const, commercialClass: "STANDARD" as const, accessible: false };
function places(prefix: string, kind: "SEAT" | "BERTH", rows: number, columns: number[], step = 1) { let count = 0; return Array.from({ length: rows }, (_, row) => columns.map((x): LayoutElement => { count += 1; return { elementId: `${prefix}-${count}`, kind, label: `${prefix}${count}`, position: { x, y: row * step }, size: kind === "BERTH" ? { width: 1, height: 2 } : { width: 1, height: 1 }, attributes }; })).flat(); }
function section(sectionId: string, name: string, role: LayoutSection["role"], order: number, widthUnits: number, heightUnits: number, elements: LayoutElement[]): LayoutSection { return { sectionId, name, role, order, widthUnits, heightUnits, elements }; }
const layout = (vehicleCategory: VehicleCategory, sections: LayoutSection[]): SeatLayoutV3 => ({ schemaVersion: 3, vehicleCategory, sections });
export const createBlankBusLayout = (): SeatLayoutV3 => layout("BUS", [section("lower", "Passenger cabin", "LOWER_CABIN", 0, 5, 2, [])]);
export const layoutPresets = [
  { id: "standard-2x2", name: "Standard 2 × 2", detail: "32 upright seats", create: () => layout("BUS", [section("lower", "Passenger cabin", "LOWER_CABIN", 0, 5, 8, places("S", "SEAT", 8, [0, 1, 3, 4]))]) },
  { id: "deluxe-2x1", name: "Deluxe 2 × 1", detail: "21 reclining-ready seats", create: () => layout("BUS", [section("lower", "Passenger cabin", "LOWER_CABIN", 0, 4, 7, places("D", "SEAT", 7, [0, 1, 3]))]) },
  { id: "mixed", name: "Mixed seat + sleeper", detail: "Seats and full-length berths", create: () => layout("BUS", [section("mixed", "Mixed cabin", "LOWER_CABIN", 0, 5, 8, [...places("M", "SEAT", 4, [0, 1, 3, 4]), ...places("MB", "BERTH", 2, [0, 3], 2).map((item) => ({ ...item, position: { ...item.position, y: item.position.y + 4 } }))])]) },
  { id: "lower-upper", name: "Lower seats + upper sleepers", detail: "Side-by-side lower and upper plans", create: () => layout("BUS", [section("lower", "Lower cabin", "LOWER_CABIN", 0, 5, 7, places("L", "SEAT", 7, [0, 1, 3, 4])), section("upper", "Upper berths", "UPPER_BERTH_LEVEL", 1, 4, 8, places("U", "BERTH", 4, [0, 2], 2))]) },
  { id: "full-sleeper", name: "Full sleeper", detail: "Lower and upper berth levels", create: () => layout("BUS", [section("lower-berths", "Lower berths", "LOWER_BERTH_LEVEL", 0, 4, 8, places("LB", "BERTH", 4, [0, 2], 2)), section("upper-berths", "Upper berths", "UPPER_BERTH_LEVEL", 1, 4, 8, places("UB", "BERTH", 4, [0, 2], 2))]) },
  { id: "mini", name: "Minibus 2 × 1", detail: "Compact 18-seat cabin", create: () => layout("MINIBUS", [section("mini", "Passenger cabin", "LOWER_CABIN", 0, 4, 6, places("H", "SEAT", 6, [0, 1, 3]))]) },
  { id: "blank-bus", name: "Empty bus", detail: "Start with a blank passenger cabin", create: createBlankBusLayout },
];

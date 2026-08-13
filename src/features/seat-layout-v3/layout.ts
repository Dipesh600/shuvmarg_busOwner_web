import type { BuilderTool, LayoutElement, SeatLayoutV3 } from "./types";
export const cloneLayout = (layout: SeatLayoutV3): SeatLayoutV3 => structuredClone(layout);
export const passengerPlaces = (layout: SeatLayoutV3) => layout.sections.flatMap((section) => section.elements.filter((element) => element.kind === "SEAT" || element.kind === "BERTH"));
function nextIdentity(layout: SeatLayoutV3, kind: "SEAT" | "BERTH") { const prefix = kind === "BERTH" ? "B" : "S"; const used = new Set(layout.sections.flatMap((section) => section.elements.map((element) => element.elementId))); let number = 1; while (used.has(`${prefix}-${number}`)) number += 1; return { elementId: `${prefix}-${number}`, label: `${prefix}${number}` }; }
function overlaps(a: LayoutElement, b: LayoutElement) { return a.position.x < b.position.x + b.size.width && a.position.x + a.size.width > b.position.x && a.position.y < b.position.y + b.size.height && a.position.y + a.size.height > b.position.y; }
export function applyTool(layout: SeatLayoutV3, sectionId: string, x: number, y: number, tool: BuilderTool) {
  if (tool === "SELECT") return layout; const next = cloneLayout(layout); const section = next.sections.find((item) => item.sectionId === sectionId); if (!section) return layout;
  const hit = section.elements.find((element) => x >= element.position.x && x < element.position.x + element.size.width && y >= element.position.y && y < element.position.y + element.size.height);
  if (tool === "ERASE") { if (hit) section.elements = section.elements.filter((element) => element.elementId !== hit.elementId); return next; }
  if (hit) return layout; const kind = tool as Exclude<BuilderTool, "SELECT" | "ERASE">; const size = kind === "BERTH" ? { width: 1, height: 2 } : { width: 1, height: 1 };
  if (x + size.width > section.widthUnits || y + size.height > section.heightUnits) return layout;
  const identity = kind === "SEAT" || kind === "BERTH" ? nextIdentity(next, kind) : { elementId: `${kind.toLowerCase()}-${crypto.randomUUID()}`, label: null };
  const candidate: LayoutElement = { ...identity, kind, position: { x, y }, size, ...((kind === "SEAT" || kind === "BERTH") ? { attributes: { comfort: "STANDARD" as const, commercialClass: "STANDARD" as const, accessible: false } } : {}) };
  if (section.elements.some((element) => overlaps(element, candidate))) return layout; section.elements.push(candidate); return next;
}
export function updateElement(layout: SeatLayoutV3, elementId: string, update: Partial<LayoutElement>) { const next = cloneLayout(layout); for (const section of next.sections) { const element = section.elements.find((item) => item.elementId === elementId); if (element) Object.assign(element, update); } return next; }
export function resizeSection(layout: SeatLayoutV3, sectionId: string, height: number) { const next = cloneLayout(layout); const section = next.sections.find((item) => item.sectionId === sectionId); if (!section) return layout; section.heightUnits = Math.max(2, Math.min(40, height)); section.elements = section.elements.filter((element) => element.position.y + element.size.height <= section.heightUnits); return next; }

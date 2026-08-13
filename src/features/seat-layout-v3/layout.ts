import type { BuilderTool, LayoutElement, SeatLayoutV3 } from "./types";
export const cloneLayout = (layout: SeatLayoutV3): SeatLayoutV3 => structuredClone(layout);
export const passengerPlaces = (layout: SeatLayoutV3) => layout.sections.flatMap((section) => section.elements.filter((element) => element.kind === "SEAT" || element.kind === "BERTH"));
function nextIdentity(layout: SeatLayoutV3, kind: "SEAT" | "BERTH") { const prefix = kind === "BERTH" ? "B" : "S"; const used = new Set(layout.sections.flatMap((section) => section.elements.map((element) => element.elementId))); let number = 1; while (used.has(`${prefix}-${number}`)) number += 1; return { elementId: `${prefix}-${number}`, label: `${prefix}${number}` }; }
function overlaps(a: LayoutElement, b: LayoutElement) { return a.position.x < b.position.x + b.size.width && a.position.x + a.size.width > b.position.x && a.position.y < b.position.y + b.size.height && a.position.y + a.size.height > b.position.y; }
export function canPlacePassenger(layout: SeatLayoutV3, sectionId: string, x: number, y: number, kind: "SEAT" | "BERTH") {
  const section = layout.sections.find((item) => item.sectionId === sectionId);
  if (!section) return false;
  const size = kind === "BERTH" ? { width: 1, height: 2 } : { width: 1, height: 1 };
  if (x < 0 || y < 0 || x + size.width > section.widthUnits || y + size.height > section.heightUnits) return false;
  const candidate: LayoutElement = { elementId: "preview", label: null, kind, position: { x, y }, size };
  return !section.elements.some((element) => overlaps(element, candidate));
}
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
export function updateElements(layout: SeatLayoutV3, elementIds: string[], update: Partial<LayoutElement>) { const next = cloneLayout(layout); const ids = new Set(elementIds); for (const section of next.sections) { section.elements.forEach((element) => { if (ids.has(element.elementId)) Object.assign(element, structuredClone(update)); }); } return next; }
export function updatePassengerAttributes(layout: SeatLayoutV3, elementIds: string[], attributes: Partial<NonNullable<LayoutElement["attributes"]>>) { const next = cloneLayout(layout); const ids = new Set(elementIds); for (const section of next.sections) { section.elements.forEach((element) => { if (ids.has(element.elementId) && element.attributes) element.attributes = { ...element.attributes, ...attributes }; }); } return next; }
export function removeElements(layout: SeatLayoutV3, elementIds: string[]) { const next = cloneLayout(layout); const ids = new Set(elementIds); for (const section of next.sections) section.elements = section.elements.filter((element) => !ids.has(element.elementId)); return renumberPassengerPlaces(next); }
export function moveElement(layout: SeatLayoutV3, sectionId: string, elementId: string, x: number, y: number) {
  const next = cloneLayout(layout);
  const sourceSection = next.sections.find((section) => section.elements.some((element) => element.elementId === elementId));
  const targetSection = next.sections.find((section) => section.sectionId === sectionId);
  const element = sourceSection?.elements.find((item) => item.elementId === elementId);
  if (!sourceSection || !targetSection || !element) return layout;
  if (sourceSection.sectionId !== targetSection.sectionId) return layout;
  if (x < 0 || y < 0 || x + element.size.width > targetSection.widthUnits || y + element.size.height > targetSection.heightUnits) return layout;
  const candidate = { ...element, position: { x, y } };
  if (targetSection.elements.some((other) => other.elementId !== elementId && overlaps(other, candidate))) return layout;
  element.position = { x, y };
  return next;
}
export function resizeSection(layout: SeatLayoutV3, sectionId: string, height: number) { const next = cloneLayout(layout); const section = next.sections.find((item) => item.sectionId === sectionId); if (!section) return layout; section.heightUnits = Math.max(2, Math.min(40, height)); section.elements = section.elements.filter((element) => element.position.y + element.size.height <= section.heightUnits); return next; }

function passengerPrefix(sectionRole: string, element: LayoutElement) {
  if (element.kind === "BERTH") return sectionRole.startsWith("UPPER") ? "U" : "L";
  return sectionRole === "UPPER_DECK" ? "U" : "S";
}

export function renumberPassengerPlaces(layout: SeatLayoutV3) {
  const next = cloneLayout(layout);
  const counters = new Map<string, number>();
  [...next.sections].sort((a, b) => a.order - b.order).forEach((section) => {
    [...section.elements]
      .filter((element) => element.kind === "SEAT" || element.kind === "BERTH")
      .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x)
      .forEach((element) => {
        const prefix = passengerPrefix(section.role, element);
        const key = `${section.sectionId}:${prefix}`;
        const number = (counters.get(key) || 0) + 1;
        counters.set(key, number);
        element.label = `${prefix}${number}`;
      });
  });
  return next;
}

export function hasPassengerLabel(layout: SeatLayoutV3, label: string, excludingElementId?: string) {
  const normalized = label.trim().toLocaleLowerCase();
  return passengerPlaces(layout).some((element) => element.elementId !== excludingElementId && element.label?.trim().toLocaleLowerCase() === normalized);
}

export function duplicatePassengerRow(layout: SeatLayoutV3, sectionId: string, rowY: number) {
  const next = cloneLayout(layout);
  const section = next.sections.find((item) => item.sectionId === sectionId);
  if (!section) return layout;
  const row = section.elements.filter((element) => element.position.y === rowY);
  if (!row.length) return layout;
  const step = Math.max(...row.map((element) => element.size.height));
  if (section.heightUnits + step > 40) return layout;
  section.elements.forEach((element) => { if (element.position.y > rowY) element.position.y += step; });
  const used = new Set(section.elements.map((element) => element.elementId));
  row.forEach((source, index) => {
    let elementId = `${source.elementId}-copy`;
    let suffix = 2;
    while (used.has(elementId)) { elementId = `${source.elementId}-copy-${suffix}`; suffix += 1; }
    used.add(elementId);
    section.elements.push({ ...structuredClone(source), elementId, label: source.label ? `${source.label}-${index + 1}` : null, position: { ...source.position, y: rowY + step } });
  });
  section.heightUnits += step;
  return renumberPassengerPlaces(next);
}

export function removePassengerRow(layout: SeatLayoutV3, sectionId: string, rowY: number) {
  const next = cloneLayout(layout);
  const section = next.sections.find((item) => item.sectionId === sectionId);
  if (!section) return layout;
  const row = section.elements.filter((element) => element.position.y === rowY);
  if (!row.length) return layout;
  const step = Math.max(...row.map((element) => element.size.height));
  const ids = new Set(row.map((element) => element.elementId));
  section.elements = section.elements.filter((element) => !ids.has(element.elementId));
  section.elements.forEach((element) => { if (element.position.y > rowY) element.position.y -= step; });
  section.heightUnits = Math.max(2, section.heightUnits - step);
  return renumberPassengerPlaces(next);
}

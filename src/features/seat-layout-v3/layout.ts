import type { BuilderTool, LayoutElement, LayoutSection, SeatLayoutV3 } from "./types";

export const cloneLayout = (layout: SeatLayoutV3): SeatLayoutV3 => structuredClone(layout);

export const passengerPlaces = (layout: SeatLayoutV3) =>
  layout.sections.flatMap((section) =>
    section.elements.filter((element) => element.kind === "SEAT" || element.kind === "BERTH")
  );

export type NumberingScheme =
  | "SIDE_AB" // Left: A1.. / Right: B1.. (Sleepers: LA1.. / LB1.. or UA1.. / UB1..)
  | "SIDE_KHA" // Left: Ka1.. / Right: Kha1.. (Sleepers: LKa1.. / LKha1..)
  | "ROW_LETTERS" // Row 1: A1.. / Row 2: B1..
  | "NUMERIC_ONLY" // 1, 2, 3, 4...
  | "PREFIX_SEQUENTIAL"; // Seats: S1.. / Sleepers: L1.. / U1..

function nextIdentity(
  layout: SeatLayoutV3,
  kind: "SEAT" | "BERTH",
  section?: LayoutSection,
  x = 0
) {
  const sectionRole = section?.role || "LOWER_CABIN";
  const isUpper = sectionRole.startsWith("UPPER");
  const widthUnits = section?.widthUnits || 5;
  const midX = (widthUnits - 1) / 2;
  const isLeft = x < midX;

  const allPlaces = layout.sections.flatMap((s) =>
    s.elements.filter((el) => el.kind === "SEAT" || el.kind === "BERTH")
  );
  const sectionPlaces = (section?.elements || []).filter(
    (el) => el.kind === "SEAT" || el.kind === "BERTH"
  );

  // Check if layout uses Side A/B pattern
  const hasA = allPlaces.some((p) => /^[UuLl]?[Aa]\d+$/.test(p.label || ""));
  const hasB = allPlaces.some((p) => /^[UuLl]?[Bb]\d+$/.test(p.label || ""));
  const isSideAB = (hasA && hasB) || (hasA && isLeft) || (hasB && !isLeft);

  // Check if layout uses Ka/Kha pattern
  const hasKa = allPlaces.some((p) => /^[UuLl]?Ka\d+$/i.test(p.label || ""));
  const hasKha = allPlaces.some((p) => /^[UuLl]?Kha\d+$/i.test(p.label || ""));
  const isSideKaKha = (hasKa && hasKha) || (hasKa && isLeft) || (hasKha && !isLeft);

  let prefix = "";

  if (kind === "BERTH") {
    // Sleeper berths get independent prefixes
    const deckPrefix = isUpper ? "U" : "L";
    if (isSideAB) {
      prefix = `${deckPrefix}${isLeft ? "A" : "B"}`;
    } else if (isSideKaKha) {
      prefix = `${deckPrefix}${isLeft ? "Ka" : "Kha"}`;
    } else {
      // Check existing berths in section
      const existingBerths = sectionPlaces.filter((p) => p.kind === "BERTH" && p.label);
      if (existingBerths.length > 0) {
        const match = existingBerths[0].label?.match(/^([A-Za-z]+)/);
        if (match) prefix = match[1];
      }
      if (!prefix) {
        prefix = isUpper ? "U" : "LB";
      }
    }
  } else {
    // Upright Seats get standard seat prefixes
    const deckPrefix = isUpper ? "U" : "";
    if (isSideAB) {
      prefix = `${deckPrefix}${isLeft ? "A" : "B"}`;
    } else if (isSideKaKha) {
      prefix = `${deckPrefix}${isLeft ? "Ka" : "Kha"}`;
    } else {
      const existingSeats = sectionPlaces.filter((p) => p.kind === "SEAT" && p.label);
      if (existingSeats.length > 0) {
        const match = existingSeats[0].label?.match(/^([A-Za-z]+)/);
        if (match) prefix = match[1];
      }
      if (!prefix) {
        prefix = isUpper ? "U" : "S";
      }
    }
  }

  const usedLabels = new Set(
    allPlaces.map((el) => el.label?.toUpperCase()).filter(Boolean)
  );
  const usedIds = new Set(allPlaces.map((el) => el.elementId));

  const regex = new RegExp(`^${prefix}(\\d+)$`, "i");
  const numbersUsedWithPrefix = new Set<number>();
  allPlaces.forEach((p) => {
    const m = p.label?.match(regex);
    if (m) numbersUsedWithPrefix.add(parseInt(m[1], 10));
  });

  let number = 1;
  while (
    numbersUsedWithPrefix.has(number) ||
    usedLabels.has(`${prefix}${number}`.toUpperCase()) ||
    usedIds.has(`${prefix.toLowerCase()}-${number}`)
  ) {
    number += 1;
  }

  const elementId = `${prefix.toLowerCase()}-${number}-${crypto.randomUUID().slice(0, 4)}`;
  const label = `${prefix}${number}`;

  return { elementId, label };
}

export function overlaps(a: LayoutElement, b: LayoutElement) {
  return (
    a.position.x < b.position.x + b.size.width &&
    a.position.x + a.size.width > b.position.x &&
    a.position.y < b.position.y + b.size.height &&
    a.position.y + a.size.height > b.position.y
  );
}

export function canPlacePassenger(
  layout: SeatLayoutV3,
  sectionId: string,
  x: number,
  y: number,
  kind: "SEAT" | "BERTH"
) {
  const section = layout.sections.find((item) => item.sectionId === sectionId);
  if (!section) return false;
  const size = kind === "BERTH" ? { width: 1, height: 2 } : { width: 1, height: 1 };
  if (x < 0 || y < 0 || x + size.width > section.widthUnits) return false;
  if (y + size.height > section.heightUnits) {
    if (kind === "BERTH" && y + 1 === section.heightUnits && section.heightUnits < 40) {
      // Allowed via seamless auto-expansion on last row
    } else {
      return false;
    }
  }
  const candidate: LayoutElement = { elementId: "preview", label: null, kind, position: { x, y }, size };
  return !section.elements.some((element) => overlaps(element, candidate));
}

export function canMoveElement(
  layout: SeatLayoutV3,
  sectionId: string,
  elementId: string,
  x: number,
  y: number
): boolean {
  const section = layout.sections.find((s) => s.sectionId === sectionId);
  if (!section) return false;
  const element = section.elements.find((el) => el.elementId === elementId);
  if (!element) return false;
  if (x < 0 || y < 0 || x + element.size.width > section.widthUnits || y + element.size.height > section.heightUnits)
    return false;
  const candidate: LayoutElement = { ...element, position: { x, y } };
  return !section.elements.some((other) => other.elementId !== elementId && overlaps(other, candidate));
}

export function applyTool(layout: SeatLayoutV3, sectionId: string, x: number, y: number, tool: BuilderTool) {
  if (tool === "SELECT") return layout;
  const next = cloneLayout(layout);
  const section = next.sections.find((item) => item.sectionId === sectionId);
  if (!section) return layout;

  const hit = section.elements.find(
    (element) =>
      x >= element.position.x &&
      x < element.position.x + element.size.width &&
      y >= element.position.y &&
      y < element.position.y + element.size.height
  );

  if (tool === "ERASE") {
    if (hit) section.elements = section.elements.filter((element) => element.elementId !== hit.elementId);
    return next;
  }

  if (hit) return layout;

  const kind = tool as Exclude<BuilderTool, "SELECT" | "ERASE">;
  const size = kind === "BERTH" ? { width: 1, height: 2 } : { width: 1, height: 1 };
  if (x + size.width > section.widthUnits) return layout;
  if (y + size.height > section.heightUnits) {
    if (kind === "BERTH" && y + 1 === section.heightUnits && section.heightUnits < 40) {
      section.heightUnits += 1;
    } else {
      return layout;
    }
  }

  const identity =
    kind === "SEAT" || kind === "BERTH"
      ? nextIdentity(next, kind, section, x)
      : { elementId: `${kind.toLowerCase()}-${crypto.randomUUID()}`, label: null };

  const candidate: LayoutElement = {
    ...identity,
    kind,
    position: { x, y },
    size,
    ...(kind === "SEAT" || kind === "BERTH"
      ? { attributes: { comfort: "STANDARD" as const, commercialClass: "STANDARD" as const, accessible: false } }
      : {}),
  };

  if (section.elements.some((element) => overlaps(element, candidate))) return layout;
  section.elements.push(candidate);
  return next;
}

export function updateElement(layout: SeatLayoutV3, elementId: string, update: Partial<LayoutElement>) {
  const next = cloneLayout(layout);
  for (const section of next.sections) {
    const element = section.elements.find((item) => item.elementId === elementId);
    if (element) Object.assign(element, update);
  }
  return next;
}

export function updateElements(layout: SeatLayoutV3, elementIds: string[], update: Partial<LayoutElement>) {
  const next = cloneLayout(layout);
  const ids = new Set(elementIds);
  for (const section of next.sections) {
    section.elements.forEach((element) => {
      if (ids.has(element.elementId)) Object.assign(element, structuredClone(update));
    });
  }
  return next;
}

export function updatePassengerAttributes(
  layout: SeatLayoutV3,
  elementIds: string[],
  attributes: Partial<NonNullable<LayoutElement["attributes"]>>
) {
  const next = cloneLayout(layout);
  const ids = new Set(elementIds);
  for (const section of next.sections) {
    section.elements.forEach((element) => {
      if (ids.has(element.elementId) && element.attributes)
        element.attributes = { ...element.attributes, ...attributes };
    });
  }
  return next;
}

export function removeElements(layout: SeatLayoutV3, elementIds: string[]) {
  const next = cloneLayout(layout);
  const ids = new Set(elementIds);
  for (const section of next.sections) section.elements = section.elements.filter((element) => !ids.has(element.elementId));
  return renumberPassengerPlaces(next);
}

export function moveElement(layout: SeatLayoutV3, sectionId: string, elementId: string, x: number, y: number) {
  const next = cloneLayout(layout);
  const sourceSection = next.sections.find((section) =>
    section.elements.some((element) => element.elementId === elementId)
  );
  const targetSection = next.sections.find((section) => section.sectionId === sectionId);
  const element = sourceSection?.elements.find((item) => item.elementId === elementId);
  if (!sourceSection || !targetSection || !element) return layout;
  if (sourceSection.sectionId !== targetSection.sectionId) return layout;
  if (
    x < 0 ||
    y < 0 ||
    x + element.size.width > targetSection.widthUnits ||
    y + element.size.height > targetSection.heightUnits
  )
    return layout;
  const candidate = { ...element, position: { x, y } };
  if (targetSection.elements.some((other) => other.elementId !== elementId && overlaps(other, candidate)))
    return layout;
  element.position = { x, y };
  return next;
}

export function resizeSection(layout: SeatLayoutV3, sectionId: string, height: number) {
  const next = cloneLayout(layout);
  const section = next.sections.find((item) => item.sectionId === sectionId);
  if (!section) return layout;
  section.heightUnits = Math.max(2, Math.min(40, height));
  section.elements = section.elements.filter((element) => element.position.y + element.size.height <= section.heightUnits);
  return next;
}

function passengerPrefix(sectionRole: string, element: LayoutElement) {
  if (element.kind === "BERTH") return sectionRole.startsWith("UPPER") ? "U" : "L";
  return sectionRole === "UPPER_DECK" ? "U" : "S";
}

export function detectActiveNumberingScheme(layout: SeatLayoutV3): NumberingScheme {
  const places = passengerPlaces(layout).filter((p) => p.label && p.label.trim().length > 0);
  if (!places.length) return "SIDE_AB";

  const labels = places.map((p) => p.label!.replace(/-copy(-\d+)?$/i, "").trim());

  // Check Ka/Kha
  if (labels.some((l) => /^(L|U)?(Ka|Kha)\d+$/i.test(l))) {
    return "SIDE_KHA";
  }

  // Check pure numbers (e.g. 1, 2, 3...)
  if (labels.every((l) => /^\d+$/.test(l))) {
    return "NUMERIC_ONLY";
  }

  // Check standard S / U prefix
  if (labels.some((l) => /^S\d+$/i.test(l))) {
    return "PREFIX_SEQUENTIAL";
  }

  // Check Side A / Side B (e.g. A1, A2, B1, B2, LA1, LB1, UA1, UB1)
  const hasSideA = labels.some((l) => /^[LU]?A\d+$/i.test(l));
  const hasSideB = labels.some((l) => /^[LU]?B\d+$/i.test(l));
  if (hasSideA || hasSideB) {
    const hasC = labels.some((l) => /^[LU]?C\d+$/i.test(l));
    const hasD = labels.some((l) => /^[LU]?D\d+$/i.test(l));
    if (hasC || hasD) {
      return "ROW_LETTERS";
    }
    return "SIDE_AB";
  }

  return "SIDE_AB";
}

export function renumberPassengerPlaces(
  layout: SeatLayoutV3,
  scheme?: NumberingScheme
) {
  const activeScheme = scheme || detectActiveNumberingScheme(layout);
  const next = cloneLayout(layout);

  if (activeScheme === "SIDE_AB" || activeScheme === "SIDE_KHA") {
    const isKaKha = activeScheme === "SIDE_KHA";

    next.sections.forEach((section) => {
      const midX = (section.widthUnits - 1) / 2;
      const isUpper = section.role.startsWith("UPPER");
      const deckPrefix = isUpper ? "U" : "";

      const seats = section.elements
        .filter((el) => el.kind === "SEAT")
        .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);

      const berths = section.elements
        .filter((el) => el.kind === "BERTH")
        .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);

      // Number seats independently
      let seatLeft = 1;
      let seatRight = 1;
      seats.forEach((seat) => {
        const isLeft = seat.position.x < midX;
        const leftP = isKaKha ? "Ka" : "A";
        const rightP = isKaKha ? "Kha" : "B";
        const prefix = isLeft ? leftP : rightP;
        const num = isLeft ? seatLeft++ : seatRight++;
        seat.label = `${deckPrefix}${prefix}${num}`;
      });

      // Number sleeper berths independently with distinct berth prefix
      let berthLeft = 1;
      let berthRight = 1;
      berths.forEach((berth) => {
        const isLeft = berth.position.x < midX;
        const bPrefix = isUpper ? "U" : "L";
        const leftP = isKaKha ? "Ka" : "A";
        const rightP = isKaKha ? "Kha" : "B";
        const sideP = isLeft ? leftP : rightP;
        const num = isLeft ? berthLeft++ : berthRight++;
        berth.label = `${bPrefix}${sideP}${num}`;
      });
    });
    return next;
  }

  if (activeScheme === "ROW_LETTERS") {
    next.sections.forEach((section) => {
      const isUpper = section.role.startsWith("UPPER");
      const deckPrefix = isUpper ? "U" : "";

      const places = section.elements
        .filter((el) => el.kind === "SEAT" || el.kind === "BERTH")
        .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);

      const rowMap = new Map<number, typeof places>();
      places.forEach((p) => {
        const row = rowMap.get(p.position.y) || [];
        row.push(p);
        rowMap.set(p.position.y, row);
      });

      let rowIndex = 0;
      Array.from(rowMap.keys())
        .sort((a, b) => a - b)
        .forEach((rowY) => {
          const rowPlaces = rowMap.get(rowY)!;
          const letter = String.fromCharCode(65 + (rowIndex % 26));
          rowPlaces.forEach((place, index) => {
            const bTag = place.kind === "BERTH" ? "B" : "";
            place.label = `${deckPrefix}${bTag}${letter}${index + 1}`;
          });
          rowIndex += 1;
        });
    });
    return next;
  }

  if (activeScheme === "NUMERIC_ONLY") {
    let count = 1;
    [...next.sections]
      .sort((a, b) => a.order - b.order)
      .forEach((section) => {
        section.elements
          .filter((el) => el.kind === "SEAT" || el.kind === "BERTH")
          .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x)
          .forEach((place) => {
            place.label = `${count}`;
            count += 1;
          });
      });
    return next;
  }

  // Default: PREFIX_SEQUENTIAL (Separate counters per prefix)
  const counters = new Map<string, number>();
  [...next.sections]
    .sort((a, b) => a.order - b.order)
    .forEach((section) => {
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
  return passengerPlaces(layout).some(
    (element) =>
      element.elementId !== excludingElementId && element.label?.trim().toLocaleLowerCase() === normalized
  );
}

export function duplicatePassengerRow(layout: SeatLayoutV3, sectionId: string, rowY: number) {
  const activeScheme = detectActiveNumberingScheme(layout);
  const next = cloneLayout(layout);
  const section = next.sections.find((item) => item.sectionId === sectionId);
  if (!section) return layout;
  const row = section.elements.filter((element) => element.position.y === rowY);
  if (!row.length) return layout;
  const step = Math.max(...row.map((element) => element.size.height));
  if (section.heightUnits + step > 40) return layout;
  section.elements.forEach((element) => {
    if (element.position.y > rowY) element.position.y += step;
  });
  const used = new Set(section.elements.map((element) => element.elementId));
  row.forEach((source, index) => {
    let elementId = `${source.elementId}-copy`;
    let suffix = 2;
    while (used.has(elementId)) {
      elementId = `${source.elementId}-copy-${suffix}`;
      suffix += 1;
    }
    used.add(elementId);
    section.elements.push({
      ...structuredClone(source),
      elementId,
      label: source.label ? `${source.label}-${index + 1}` : null,
      position: { ...source.position, y: rowY + step },
    });
  });
  section.heightUnits += step;
  return renumberPassengerPlaces(next, activeScheme);
}

export function removePassengerRow(layout: SeatLayoutV3, sectionId: string, rowY: number) {
  const activeScheme = detectActiveNumberingScheme(layout);
  const next = cloneLayout(layout);
  const section = next.sections.find((item) => item.sectionId === sectionId);
  if (!section) return layout;
  const row = section.elements.filter((element) => element.position.y === rowY);
  if (!row.length) return layout;
  const step = Math.max(...row.map((element) => element.size.height));
  const ids = new Set(row.map((element) => element.elementId));
  section.elements = section.elements.filter((element) => !ids.has(element.elementId));
  section.elements.forEach((element) => {
    if (element.position.y > rowY) element.position.y -= step;
  });
  section.heightUnits = Math.max(2, section.heightUnits - step);
  return renumberPassengerPlaces(next, activeScheme);
}

export function insertPassengerSeatRow(layout: SeatLayoutV3, sectionId: string) {
  const activeScheme = detectActiveNumberingScheme(layout);
  const next = cloneLayout(layout);
  const section = next.sections.find((item) => item.sectionId === sectionId);
  if (!section || section.heightUnits >= 40) return layout;

  const seats = section.elements.filter((el) => el.kind === "SEAT");
  const used = new Set(section.elements.map((el) => el.elementId));

  if (seats.length > 0) {
    const seatRowY = Math.max(...seats.map((el) => el.position.y));
    const sourceRow = seats.filter((el) => el.position.y === seatRowY);

    // Shift all subsequent elements (e.g. rear sleepers, back bench) down by 1 row
    section.elements.forEach((el) => {
      if (el.position.y > seatRowY) {
        el.position.y += 1;
      }
    });

    // Insert new seats in the seat zone ahead
    sourceRow.forEach((source, index) => {
      let elementId = `seat-${crypto.randomUUID().slice(0, 8)}`;
      while (used.has(elementId)) {
        elementId = `seat-${crypto.randomUUID().slice(0, 8)}`;
      }
      used.add(elementId);

      section.elements.push({
        ...structuredClone(source),
        elementId,
        label: source.label ? `${source.label}-copy-${index + 1}` : null,
        position: { ...source.position, y: seatRowY + 1 },
      });
    });

    section.heightUnits = Math.max(
      2,
      ...section.elements.map((element) => element.position.y + element.size.height)
    );
    return renumberPassengerPlaces(next, activeScheme);
  }

  // Fallback: If no seats exist, add standard left/right seats at the top
  section.elements.forEach((el) => {
    el.position.y += 1;
  });

  const width = section.widthUnits;
  const cols = width >= 4 ? [0, 1, width - 2, width - 1] : width >= 3 ? [0, width - 1] : [0];
  cols.forEach((col) => {
    const elementId = `seat-${crypto.randomUUID().slice(0, 8)}`;
    section.elements.push({
      elementId,
      kind: "SEAT",
      label: null,
      position: { x: col, y: 0 },
      size: { width: 1, height: 1 },
      attributes: { comfort: "STANDARD", commercialClass: "STANDARD", accessible: false },
    });
  });

  section.heightUnits = Math.max(
    2,
    ...section.elements.map((element) => element.position.y + element.size.height)
  );
  return renumberPassengerPlaces(next, activeScheme);
}

export function insertPassengerSleeperRow(layout: SeatLayoutV3, sectionId: string) {
  const activeScheme = detectActiveNumberingScheme(layout);
  const next = cloneLayout(layout);
  const section = next.sections.find((item) => item.sectionId === sectionId);
  if (!section || section.heightUnits + 2 > 40) return layout;

  const berths = section.elements.filter((el) => el.kind === "BERTH");
  const used = new Set(section.elements.map((el) => el.elementId));

  if (berths.length > 0) {
    const berthRowY = Math.max(...berths.map((el) => el.position.y));
    const sourceRow = berths.filter((el) => el.position.y === berthRowY);

    // Shift any trailing elements (e.g. back row) down by 2 rows
    section.elements.forEach((el) => {
      if (el.position.y > berthRowY + 1) {
        el.position.y += 2;
      }
    });

    // Insert new 2-unit sleepers in the sleeper zone
    sourceRow.forEach((source, index) => {
      let elementId = `berth-${crypto.randomUUID().slice(0, 8)}`;
      while (used.has(elementId)) {
        elementId = `berth-${crypto.randomUUID().slice(0, 8)}`;
      }
      used.add(elementId);

      section.elements.push({
        ...structuredClone(source),
        elementId,
        label: source.label ? `${source.label}-copy-${index + 1}` : null,
        position: { ...source.position, y: berthRowY + 2 },
        size: { width: 1, height: 2 },
      });
    });

    section.heightUnits = Math.max(
      2,
      ...section.elements.map((element) => element.position.y + element.size.height)
    );
    return renumberPassengerPlaces(next, activeScheme);
  }

  // Fallback: If no berths exist yet, append 1x2 berths at the rear of the bus
  const insertY = section.elements.reduce(
    (end, element) => Math.max(end, element.position.y + element.size.height),
    0
  );
  const width = section.widthUnits;
  const cols = width >= 4 ? [0, 1, width - 2, width - 1] : width >= 3 ? [0, width - 1] : [0];

  cols.forEach((col) => {
    const elementId = `berth-${crypto.randomUUID().slice(0, 8)}`;
    section.elements.push({
      elementId,
      kind: "BERTH",
      label: null,
      position: { x: col, y: insertY },
      size: { width: 1, height: 2 },
      attributes: { comfort: "SEMI_SLEEPER", commercialClass: "STANDARD", accessible: false },
    });
  });

  section.heightUnits = Math.max(2, insertY + 2);
  return renumberPassengerPlaces(next, activeScheme);
}

export function appendPassengerRow(layout: SeatLayoutV3, sectionId: string) {
  return insertPassengerSeatRow(layout, sectionId);
}

export function popPassengerRow(layout: SeatLayoutV3, sectionId: string) {
  const next = cloneLayout(layout);
  const section = next.sections.find((item) => item.sectionId === sectionId);
  if (!section || section.heightUnits <= 2) return layout;

  const passengerElements = section.elements.filter((el) => el.kind === "SEAT" || el.kind === "BERTH");
  if (!passengerElements.length) {
    section.heightUnits = Math.max(2, section.heightUnits - 1);
    return next;
  }

  const maxY = Math.max(...passengerElements.map((el) => el.position.y));
  return removePassengerRow(layout, sectionId, maxY);
}

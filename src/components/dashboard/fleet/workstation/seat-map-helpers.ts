import React from "react";
import type { LayoutElement, LayoutSection, SeatLayoutV3 } from "@/features/seat-layout-v3/types";

export function SteeringWheelIcon({ className }: { className?: string }) {
  return React.createElement(
    "svg",
    {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
    },
    React.createElement("circle", { cx: "12", cy: "12", r: "10" }),
    React.createElement("circle", { cx: "12", cy: "12", r: "3.5" }),
    React.createElement("path", { d: "M12 2v6.5" }),
    React.createElement("path", { d: "M4.93 16.07 9.88 13.9" }),
    React.createElement("path", { d: "m19.07 16.07-4.95-2.17" })
  );
}

export function findAisleColumns(section?: LayoutSection | null): number[] {
  if (!section) return [];
  const occupied = new Set<number>();
  section.elements.forEach((el) => {
    for (let i = 0; i < el.size.width; i++) occupied.add(el.position.x + i);
  });
  const aisles: number[] = [];
  for (let c = 0; c < section.widthUnits; c++) {
    if (!occupied.has(c)) aisles.push(c);
  }
  return aisles;
}

export function generateFallbackLayout(capacity: number): SeatLayoutV3 {
  const isCompact = capacity <= 21;
  const cols = isCompact ? [0, 1, 3] : [0, 1, 3, 4];
  const widthUnits = isCompact ? 4 : 5;
  const seatsPerRow = cols.length;
  const rowCount = Math.max(1, Math.ceil(capacity / seatsPerRow));
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

  const elements: LayoutElement[] = [];
  let seatNum = 0;
  for (let r = 0; r < rowCount && seatNum < capacity; r++) {
    const rowChar = letters[r % letters.length];
    for (let cIdx = 0; cIdx < cols.length && seatNum < capacity; cIdx++) {
      seatNum++;
      const x = cols[cIdx];
      elements.push({
        elementId: `seat-${r}-${x}`,
        kind: "SEAT",
        label: `${rowChar}${cIdx + 1}`,
        position: { x, y: r },
        size: { width: 1, height: 1 },
      });
    }
  }

  return {
    schemaVersion: 3,
    vehicleCategory: "BUS",
    sections: [
      {
        sectionId: "lower",
        name: "Passenger cabin",
        role: "LOWER_CABIN",
        order: 0,
        widthUnits,
        heightUnits: rowCount,
        elements,
      },
    ],
  };
}

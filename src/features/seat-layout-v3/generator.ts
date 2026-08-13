import type { LayoutElement, LayoutSection, SeatLayoutV3, VehicleCategory } from "./types";

export type CabinArrangement = "SINGLE_SEATS" | "SINGLE_SLEEPERS" | "LOWER_SEATS_UPPER_SLEEPERS";
export type SeatPattern = "TWO_BY_TWO" | "TWO_BY_ONE";

export interface GuidedLayoutConfig {
  vehicleCategory: VehicleCategory;
  arrangement: CabinArrangement;
  seatPattern: SeatPattern;
  lowerRows: number;
  upperBerthRows: number;
}

const passengerAttributes = {
  comfort: "STANDARD" as const,
  commercialClass: "STANDARD" as const,
  accessible: false,
};

function passengerPlaces(prefix: string, kind: "SEAT" | "BERTH", rows: number, columns: number[]): LayoutElement[] {
  let number = 0;
  const rowStep = kind === "BERTH" ? 2 : 1;
  return Array.from({ length: rows }, (_, row) => columns.map((x) => {
    number += 1;
    return {
      elementId: `${prefix}-${number}`,
      kind,
      label: `${prefix}${number}`,
      position: { x, y: row * rowStep },
      size: kind === "BERTH" ? { width: 1, height: 2 } : { width: 1, height: 1 },
      attributes: { ...passengerAttributes },
    };
  })).flat();
}

function section(
  sectionId: string,
  name: string,
  role: LayoutSection["role"],
  order: number,
  widthUnits: number,
  heightUnits: number,
  elements: LayoutElement[],
): LayoutSection {
  return { sectionId, name, role, order, widthUnits, heightUnits, elements };
}

export function defaultGuidedLayoutConfig(vehicleCategory: VehicleCategory = "BUS"): GuidedLayoutConfig {
  return {
    vehicleCategory,
    arrangement: "SINGLE_SEATS",
    seatPattern: vehicleCategory === "BUS" ? "TWO_BY_TWO" : "TWO_BY_ONE",
    lowerRows: vehicleCategory === "BUS" ? 8 : 6,
    upperBerthRows: 3,
  };
}

export function generateGuidedLayout(input: GuidedLayoutConfig): SeatLayoutV3 {
  const lowerRows = Math.max(2, Math.min(20, Math.round(input.lowerRows)));
  const upperRows = Math.max(2, Math.min(4, Math.round(input.upperBerthRows)));
  const sections: LayoutSection[] = [];

  if (input.arrangement === "SINGLE_SLEEPERS") {
    sections.push(section("lower-berths", "Sleeper cabin", "LOWER_BERTH_LEVEL", 0, 4, lowerRows * 2, passengerPlaces("B", "BERTH", lowerRows, [0, 2])));
  } else {
    const columns = input.seatPattern === "TWO_BY_TWO" ? [0, 1, 3, 4] : [0, 1, 3];
    const width = input.seatPattern === "TWO_BY_TWO" ? 5 : 4;
    sections.push(section("lower", "Lower cabin", "LOWER_CABIN", 0, width, lowerRows, passengerPlaces("S", "SEAT", lowerRows, columns)));
  }

  if (input.arrangement === "LOWER_SEATS_UPPER_SLEEPERS") {
    sections.push(section("upper", "Upper sleeper deck", "UPPER_BERTH_LEVEL", 1, 4, upperRows * 2, passengerPlaces("U", "BERTH", upperRows, [0, 2])));
  }

  return { schemaVersion: 3, vehicleCategory: input.vehicleCategory, sections };
}

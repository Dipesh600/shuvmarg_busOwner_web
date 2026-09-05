import type {
  OperatorRouteStop,
  OperatorRouteTiming,
  OperatorStopBehavior,
} from "./route-configuration-api.ts";

export function toMinutesFromOrigin(stop: OperatorRouteStop): number {
  const value = stop.durationFromOriginMins ?? stop.estimatedMinutesFromOrigin ?? 0;
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function minutesToTimeValue(totalMinutes: number): string {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function toInputTime(value?: string | null): string {
  if (!value) return "";
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return "";
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return "";
  const isPm = match[3].toUpperCase() === "PM";
  if (hours === 12) hours = 0;
  const hours24 = hours + (isPm ? 12 : 0);
  return `${String(hours24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function fromInputTime(value: string): string {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return "";
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const isPm = hours >= 12;
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${isPm ? "PM" : "AM"}`;
}

export function calculateDeparture(arrival12h: string, haltMins: number): string {
  const input = toInputTime(arrival12h);
  if (!input) return "";
  const [hours, minutes] = input.split(":").map(Number);
  return fromInputTime(minutesToTimeValue(hours * 60 + minutes + haltMins));
}

export function calculateHaltFromTimes(arrival12h: string, departure12h: string): number {
  const diff = calculateDurationMinutes(arrival12h, departure12h);
  return diff !== null && diff >= 0 ? diff : 5;
}

export function calculateDurationMinutes(start12h: string, end12h: string): number | null {
  const startInput = toInputTime(start12h);
  const endInput = toInputTime(end12h);
  if (!startInput || !endInput) return null;
  const [startH, startM] = startInput.split(":").map(Number);
  const [endH, endM] = endInput.split(":").map(Number);
  const startTotal = startH * 60 + startM;
  let endTotal = endH * 60 + endM;
  if (endTotal < startTotal) {
    endTotal += 1440; // overnight journey
  }
  return endTotal - startTotal;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} mins`;
  if (m === 0) return `${h} hrs`;
  return `${h}h ${m}m`;
}

export function buildInitialTiming(stops: OperatorRouteStop[]): OperatorRouteTiming[] {
  return stops.map((stop, index) => {
    const stopId = stop.stopId._id;
    const first = index === 0;
    const last = index === stops.length - 1;
    const existing = stop.timing;
    const estimate = minutesToTimeValue(6 * 60 + toMinutesFromOrigin(stop));
    return {
      stopId,
      estimatedArrival: existing?.estimatedArrival || (first ? "" : fromInputTime(estimate)),
      estimatedDeparture: existing?.estimatedDeparture || (last ? "" : fromInputTime(estimate)),
      haltDuration: existing?.haltDuration ?? 5,
      dayOffset: existing?.dayOffset ?? 0,
      stopBehavior: first
        ? "BOARDING_ONLY"
        : last
          ? "DROPPING_ONLY"
          : existing?.stopBehavior || "BOTH",
    };
  });
}

export function getInitialActiveStopIds(stops: OperatorRouteStop[]): string[] {
  const selected = stops.filter((stop) => stop.isActive).map((stop) => stop.stopId._id);
  if (selected.length) return selected;
  if (stops.length < 2) return stops.map((stop) => stop.stopId._id);
  return [stops[0].stopId._id, stops[stops.length - 1].stopId._id];
}

export function generateSmartTimingsFromOrigin({
  originDeparture12h,
  stops,
  currentTimings,
}: {
  originDeparture12h: string;
  stops: OperatorRouteStop[];
  currentTimings: OperatorRouteTiming[];
}): OperatorRouteTiming[] {
  const inputTime = toInputTime(originDeparture12h);
  if (!inputTime) return currentTimings;
  const [startH, startM] = inputTime.split(":").map(Number);
  const originMinutes = startH * 60 + startM;

  let accumulatedHalt = 0;
  return stops.map((stop, idx) => {
    const stopId = stop.stopId._id;
    const isFirst = idx === 0;
    const isLast = idx === stops.length - 1;
    const existing = currentTimings.find((item) => item.stopId === stopId);
    const haltDuration = existing?.haltDuration ?? (isLast ? 0 : 5);

    if (isFirst) {
      return {
        stopId,
        estimatedArrival: "",
        estimatedDeparture: originDeparture12h,
        haltDuration: 0,
        dayOffset: 0,
        stopBehavior: "BOARDING_ONLY" as OperatorStopBehavior,
      };
    }

    const travelOffset = toMinutesFromOrigin(stop) || idx * 45;
    const arrivalMinutes = originMinutes + travelOffset + accumulatedHalt;
    const arrivalTime12h = fromInputTime(minutesToTimeValue(arrivalMinutes));
    const departureTime12h = isLast ? "" : calculateDeparture(arrivalTime12h, haltDuration);

    if (!isLast) {
      accumulatedHalt += haltDuration;
    }

    return {
      stopId,
      estimatedArrival: arrivalTime12h,
      estimatedDeparture: departureTime12h,
      haltDuration,
      dayOffset: existing?.dayOffset ?? 0,
      stopBehavior: isLast
        ? ("DROPPING_ONLY" as OperatorStopBehavior)
        : existing?.stopBehavior || ("BOTH" as OperatorStopBehavior),
    };
  });
}

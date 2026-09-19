export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface CalendarDay {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
}

export function getCalendarDays(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: CalendarDay[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      date: daysInPrevMonth - i,
      month: month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: d, month, year, isCurrentMonth: true });
  }

  const totalSlots = days.length > 35 ? 42 : 35;
  const remaining = totalSlots - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push({
      date: d,
      month: month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false,
    });
  }

  return days;
}

export function dateKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function isToday(y: number, m: number, d: number): boolean {
  const now = new Date();
  return now.getFullYear() === y && now.getMonth() === m && now.getDate() === d;
}

export const todayCardGradient = {
  background:
    "radial-gradient(ellipse at 92% 0%, rgba(220, 101, 94, 0.20) 0%, rgba(220, 101, 94, 0.08) 32%, rgba(220, 101, 94, 0.02) 58%, rgba(255, 255, 255, 0) 78%), #ffffff",
};

export function isPastDate(y: number, m: number, d: number): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return new Date(y, m, d).getTime() < today;
}

export function isPastTrip(
  tripDate?: string,
  departureTime?: string,
  status?: string
): boolean {
  if (status && ["completed", "cancelled"].includes(status.toLowerCase())) {
    return true;
  }
  if (!tripDate) return false;
  const now = new Date();
  const t = new Date(tripDate);
  if (Number.isNaN(t.getTime())) return false;

  const todayKey = dateKey(now.getFullYear(), now.getMonth(), now.getDate());
  const tripKey = dateKey(t.getFullYear(), t.getMonth(), t.getDate());

  if (tripKey < todayKey) return true;
  if (tripKey > todayKey) return false;

  if (departureTime && departureTime.includes(":")) {
    const [h, m] = departureTime.split(":").map((v) => parseInt(v, 10));
    if (!Number.isNaN(h) && !Number.isNaN(m)) {
      const tripMin = h * 60 + m;
      const nowMin = now.getHours() * 60 + now.getMinutes();
      return tripMin < nowMin;
    }
  }
  return false;
}

export function extractPersonPhone(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return /^[+0-9\s-]{7,16}$/.test(value.trim()) ? value.trim() : null;
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    const p =
      o.phone ||
      o.phoneNumber ||
      (o.profile as Record<string, unknown> | undefined)?.phone ||
      (o.staff as Record<string, unknown> | undefined)?.phone;
    return typeof p === "string" && p.trim() ? p.trim() : null;
  }
  return null;
}

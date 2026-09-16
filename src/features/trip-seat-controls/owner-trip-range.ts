export function nepalServiceDate(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
export function shiftServiceDate(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}
export function ownerTripsPath(from?: string, to?: string): string {
  const today = nepalServiceDate();
  return `/busowner/getMyTrips?${new URLSearchParams({ from: from || shiftServiceDate(today, -30), to: to || shiftServiceDate(today, 60) })}`;
}

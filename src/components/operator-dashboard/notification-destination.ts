export function notificationDestination(type: string, meta?: { fleetId?: unknown }): string | undefined {
  if (type !== "FLEET_VIDEO_REMINDER" || typeof meta?.fleetId !== "string" || !/^[a-f\d]{24}$/i.test(meta.fleetId)) return undefined;
  return `/dashboard/fleet/${meta.fleetId}?tab=documents`;
}

import { fetchOperatorDashboardState } from "./operator-dashboard-api";
import { listOwnerTrips } from "@/features/trip-seat-controls/api";
// Fleet readiness already contains crew names. Do not load entire crew directories here.
export async function readFleetWorkspace(force = false) {
  const dashboard = await fetchOperatorDashboardState({ force });
  const ownerTrips = dashboard.verificationStatus === "approved"
    ? await listOwnerTrips().catch(() => null) : null;
  return { dashboard, ownerTrips };
}

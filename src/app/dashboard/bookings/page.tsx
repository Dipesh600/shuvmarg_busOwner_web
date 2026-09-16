import { Suspense } from "react";
import BookingsWorkspace from "@/features/owner-workspace/BookingsWorkspace";
export default function BookingsPage() {
  return <Suspense fallback={<p role="status">Loading bookings…</p>}><BookingsWorkspace /></Suspense>;
}

import { Suspense } from "react";
import { BookingsContent } from "./components/BookingsContent";
import { Loader2 } from "lucide-react";

export default function BookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full flex items-center justify-center rounded-2xl sm:rounded-3xl border border-[#EDE7E0] bg-white p-12 text-xs text-[#746E69] gap-2 shadow-xs">
          <Loader2 className="size-4 animate-spin text-[#7A1D1B]" />
          <span>Loading bookings…</span>
        </div>
      }
    >
      <BookingsContent />
    </Suspense>
  );
}

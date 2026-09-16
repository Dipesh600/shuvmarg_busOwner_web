import React from "react";
import { ArrowRight, ChevronRight, RefreshCw, Send } from "lucide-react";
import type { TemplateDetail } from "@/features/seat-layout-v3/types";

interface SeatLayoutOperationsProps {
  selected: TemplateDetail;
  fleets: Array<{ fleetId: string; busName: string; busNumber: string }>;
  fleetId: string;
  busy: boolean;
  onFleetChange: (val: string) => void;
  onSubmitDraft: () => void;
  onAssignFleet: () => void;
}

export function SeatLayoutOperations({
  selected,
  fleets,
  fleetId,
  busy,
  onFleetChange,
  onSubmitDraft,
  onAssignFleet,
}: SeatLayoutOperationsProps) {
  const hasPublished = selected.revisions.some((r) => r.status === "PUBLISHED");
  const canAssign = hasPublished && Boolean(fleetId) && !busy;

  return (
    <section className="grid gap-6 lg:grid-cols-2 mt-6">
      {/* ── Left Card: Revision History ── */}
      <div className="rounded-3xl border border-[#EDE7E0] bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#FFF1EE] text-[#7A1D1B]">
            <RefreshCw className="size-3.5" />
          </div>
          <h2 className="text-sm font-bold text-[#191512]">Revision history</h2>
        </div>

        <div className="mt-4 space-y-2.5">
          {selected.revisions.length === 0 && (
            <p className="py-4 text-center text-xs text-[#938A82]">
              No revisions recorded yet.
            </p>
          )}

          {selected.revisions.map((revision) => (
            <div
              key={revision.id}
              className="flex items-center justify-between rounded-2xl bg-[#FAF8F5] border border-[#EDE7E0] p-4 transition"
            >
              <div>
                <p className="text-sm font-bold text-[#191512]">
                  Revision {revision.revisionNumber}
                </p>
                <p className="mt-0.5 text-xs text-[#746E69]">
                  {revision.totalPlaces} places · {revision.status.replaceAll("_", " ")}
                </p>
              </div>

              {revision.status === "DRAFT" ? (
                <button
                  type="button"
                  onClick={onSubmitDraft}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-xl bg-[#191512] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#2A2520] disabled:opacity-50 cursor-pointer"
                >
                  <Send className="size-3.5" />
                  <span>Submit</span>
                </button>
              ) : (
                <ChevronRight className="size-4 text-[#938A82]" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Card: Use on a Fleet ── */}
      <div className="rounded-3xl border border-[#EDE7E0] bg-white p-6 shadow-xs flex flex-col justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#191512]">Use on a fleet</h2>
          <p className="mt-1 text-xs text-[#746E69] leading-relaxed">
            Only published revisions can be assigned. Changing an existing fleet creates a review request.
          </p>

          <label className="mt-4 block text-[10px] font-bold uppercase tracking-widest text-[#938A82]">
            Choose fleet
            <select
              value={fleetId}
              onChange={(e) => onFleetChange(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-[#EDE7E0] bg-[#FAF8F5] px-3.5 text-sm font-semibold text-[#191512] outline-none focus:border-[#7A1D1B] focus:bg-white transition"
            >
              <option value="">Select a bus from your fleet…</option>
              {fleets.map((fleet) => (
                <option key={fleet.fleetId} value={fleet.fleetId}>
                  {fleet.busName} · {fleet.busNumber}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={onAssignFleet}
          disabled={!canAssign}
          className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] text-xs font-bold text-white shadow-xs transition hover:bg-[#641715] disabled:opacity-40 disabled:hover:bg-[#7A1D1B] cursor-pointer"
        >
          <span>Assign published revision</span>
          <ArrowRight className="size-3.5" />
        </button>
      </div>
    </section>
  );
}

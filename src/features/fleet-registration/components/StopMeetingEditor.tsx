"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Check,
  ChevronUp,
  Clock,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { listStopBoardingLocations } from "../api-route-setup";
import type { CanonicalBoardingLocation, CustomBoardingPoint, FleetServedStop } from "../route-types";

export default function StopMeetingEditor({
  stop,
  value,
  onChange,
  onClose,
}: {
  stop: { id: string; name: string; district: string | null; province: string | null };
  value: FleetServedStop;
  onChange: (next: FleetServedStop) => void;
  onClose: () => void;
}) {
  const [locations, setLocations] = useState<CanonicalBoardingLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCounter, setCustomCounter] = useState("");
  const [customPhone, setCustomPhone] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");

  const customPoints = value.customBoardingPoints || [];

  useEffect(() => {
    let active = true;
    void listStopBoardingLocations(stop.id)
      .then((data) => {
        if (active) setLocations(data.locations);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [stop.id]);

  function toggleCanonicalLocation(id: string) {
    const selected = value.boardingLocationIds.includes(id)
      ? value.boardingLocationIds.filter((item) => item !== id)
      : [...value.boardingLocationIds, id];
    onChange({
      ...value,
      boardingLocationIds: selected,
      boardingMode: selected.length || customPoints.length ? "BOARDING_LOCATIONS" : "STOP_FALLBACK",
    });
  }

  function handleAddCustomPoint() {
    if (!customName.trim()) return;
    const newPoint: CustomBoardingPoint = {
      clientKey: `cp-${Date.now()}`,
      name: customName.trim(),
      counterNumber: customCounter.trim(),
      contactPhone: customPhone.trim(),
      reportingInstructions: customInstructions.trim(),
    };
    const nextCustom = [...customPoints, newPoint];
    onChange({
      ...value,
      customBoardingPoints: nextCustom,
      boardingMode: "BOARDING_LOCATIONS",
    });
    setCustomName("");
    setCustomCounter("");
    setCustomPhone("");
    setCustomInstructions("");
    setShowAddCustom(false);
  }

  function handleRemoveCustomPoint(clientKey: string) {
    const nextCustom = customPoints.filter((p) => p.clientKey !== clientKey);
    onChange({
      ...value,
      customBoardingPoints: nextCustom,
      boardingMode:
        value.boardingLocationIds.length || nextCustom.length ? "BOARDING_LOCATIONS" : "STOP_FALLBACK",
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-[#E3DBD4] bg-white p-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F0EBE6] pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-[#FFF4F1] text-[#7A1D1B]">
            <Building2 className="size-4" />
          </span>
          <div>
            <h6 className="text-xs font-black text-[#211D1A]">
              Boarding Counters &amp; Meeting Points for {stop.name}
            </h6>
            <p className="text-[11px] text-[#7E766F]">
              Tell passengers exactly where to report, check in, and board.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-7 items-center justify-center rounded-lg text-[#888078] transition hover:bg-[#F3EFEB] hover:text-[#211D1A]"
          aria-label="Close editor"
        >
          <ChevronUp className="size-4" />
        </button>
      </div>

      {/* Boarding Location Selection Mode */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-wider text-[#8A827B]">
          1. Select Pickup / Boarding Spots
        </label>

        {/* Option A: Standard Stop Fallback */}
        <div
          onClick={() =>
            onChange({
              ...value,
              boardingMode: "STOP_FALLBACK",
              boardingLocationIds: [],
              customBoardingPoints: [],
            })
          }
          className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
            value.boardingMode === "STOP_FALLBACK" &&
            value.boardingLocationIds.length === 0 &&
            customPoints.length === 0
              ? "border-[#7A1D1B] bg-[#FFF4F1]/60 shadow-xs"
              : "border-[#E8E1DA] bg-[#FAF8F5] hover:border-[#CFC4BA]"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex size-5 items-center justify-center rounded-full border ${
                value.boardingMode === "STOP_FALLBACK" &&
                value.boardingLocationIds.length === 0 &&
                customPoints.length === 0
                  ? "border-[#7A1D1B] bg-[#7A1D1B] text-white"
                  : "border-[#C5BCB3] bg-white"
              }`}
            >
              {value.boardingMode === "STOP_FALLBACK" &&
                value.boardingLocationIds.length === 0 &&
                customPoints.length === 0 && <Check className="size-3" />}
            </div>
            <div>
              <p className="text-xs font-black text-[#211D1A]">
                General Stop Point ({stop.name})
              </p>
              <p className="text-[11px] text-[#7F776F]">
                Standard highway stop or main chowk.
              </p>
            </div>
          </div>
          <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-[#696159] border border-[#E3DBD3]">
            Default
          </span>
        </div>

        {/* Option B: Registered Canonical Bus Parks / Counters */}
        {loading ? (
          <div className="flex items-center gap-2 rounded-xl bg-[#FAF8F5] p-3 text-xs font-medium text-[#847C74]">
            <Loader2 className="size-4 animate-spin text-[#7A1D1B]" />
            Loading registered bus parks…
          </div>
        ) : (
          locations.map((loc) => {
            const isSelected = value.boardingLocationIds.includes(loc.id);
            return (
              <div
                key={loc.id}
                onClick={() => toggleCanonicalLocation(loc.id)}
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                  isSelected
                    ? "border-[#7A1D1B] bg-[#FFF4F1]/60 shadow-xs"
                    : "border-[#E8E1DA] bg-white hover:border-[#CFC4BA]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-5 items-center justify-center rounded-lg border ${
                      isSelected
                        ? "border-[#7A1D1B] bg-[#7A1D1B] text-white"
                        : "border-[#C5BCB3] bg-white"
                    }`}
                  >
                    {isSelected && <Check className="size-3" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black text-[#211D1A]">{loc.name}</p>
                      <span className="rounded-md bg-[#F3EFEB] px-1.5 py-0.2 text-[9px] font-bold text-[#6B635B]">
                        Bus Park
                      </span>
                    </div>
                    {(loc.landmark || loc.address) && (
                      <p className="text-[11px] text-[#7F776F]">
                        {loc.landmark || loc.address}
                      </p>
                    )}
                  </div>
                </div>
                <MapPin className="size-4 text-[#7A1D1B]" />
              </div>
            );
          })
        )}

        {/* Option C: Operator's Custom Added Counters */}
        {customPoints.map((cp) => (
          <div
            key={cp.clientKey}
            className="flex items-center justify-between rounded-xl border border-[#7A1D1B]/40 bg-[#FFF9F7] p-3 shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-5 items-center justify-center rounded-lg bg-[#7A1D1B] text-white text-[10px] font-bold">
                ✓
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-black text-[#211D1A]">{cp.name}</p>
                  {cp.counterNumber && (
                    <span className="rounded-md bg-[#F8F1E3] px-1.5 py-0.2 text-[9px] font-extrabold text-[#7A1D1B] border border-[#EBD6B5]">
                      Counter {cp.counterNumber}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#7F776F]">
                  {[cp.contactPhone, cp.reportingInstructions].filter(Boolean).join(" · ") ||
                    "Custom meeting counter"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveCustomPoint(cp.clientKey)}
              className="flex size-6 items-center justify-center rounded-lg text-[#9B928A] transition hover:bg-red-50 hover:text-red-700"
              title={`Remove ${cp.name}`}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Custom Counter Form */}
      {!showAddCustom ? (
        <button
          type="button"
          onClick={() => setShowAddCustom(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-[#C5BCB3] bg-[#FAF8F5] px-3 py-2 text-xs font-black text-[#7A1D1B] transition hover:border-[#7A1D1B] hover:bg-[#FFF4F1]"
        >
          <Plus className="size-3.5" />
          Add Brand Specific Counter or Booth
        </button>
      ) : (
        <div className="space-y-3 rounded-xl border border-[#E2D8CF] bg-[#FAF8F5] p-3.5">
          <div className="flex items-center justify-between">
            <h6 className="text-xs font-black text-[#211D1A]">
              Add Brand Ticket Counter / Meeting Spot
            </h6>
            <button
              type="button"
              onClick={() => setShowAddCustom(false)}
              className="text-xs font-bold text-[#8C837C] hover:text-[#211D1A]"
            >
              Cancel
            </button>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#736B64]">
                Counter or Spot Name *
              </label>
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Shuvmarg Main Counter / Gate 2"
                className="mt-1 h-9 w-full rounded-xl border border-[#D5CCC3] bg-white px-3 text-xs font-medium text-[#211D1A] outline-none focus:border-[#7A1D1B]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#736B64]">
                Counter Number (Optional)
              </label>
              <input
                value={customCounter}
                onChange={(e) => setCustomCounter(e.target.value)}
                placeholder="e.g. Counter #4"
                className="mt-1 h-9 w-full rounded-xl border border-[#D5CCC3] bg-white px-3 text-xs font-medium text-[#211D1A] outline-none focus:border-[#7A1D1B]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#736B64]">
                Contact Phone (Optional)
              </label>
              <input
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="e.g. 9801234567"
                className="mt-1 h-9 w-full rounded-xl border border-[#D5CCC3] bg-white px-3 text-xs font-medium text-[#211D1A] outline-none focus:border-[#7A1D1B]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#736B64]">
                Passenger Reporting Instructions
              </label>
              <input
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g. Please report to Counter #4 at least 20 minutes before departure"
                className="mt-1 h-9 w-full rounded-xl border border-[#D5CCC3] bg-white px-3 text-xs font-medium text-[#211D1A] outline-none focus:border-[#7A1D1B]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddCustom(false)}
              className="rounded-xl px-3 py-1.5 text-xs font-bold text-[#736B64] hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!customName.trim()}
              onClick={handleAddCustomPoint}
              className="rounded-xl bg-[#7A1D1B] px-3.5 py-1.5 text-xs font-black text-white shadow-xs transition hover:bg-[#601715] disabled:opacity-40"
            >
              Save Counter
            </button>
          </div>
        </div>
      )}

      {/* Dispatch & Contact Details */}
      <div className="border-t border-[#F0EBE6] pt-3.5 space-y-2.5">
        <label className="text-[10px] font-black uppercase tracking-wider text-[#8A827B]">
          2. Counter Contact &amp; Dispatch Details (Optional)
        </label>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div>
            <label className="flex items-center gap-1 text-[10px] font-bold text-[#736B64]">
              <User className="size-3 text-[#8A827B]" />
              <span>Contact Person Name</span>
            </label>
            <input
              value={value.meetingDetails.contactName || ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  meetingDetails: { ...value.meetingDetails, contactName: e.target.value },
                })
              }
              placeholder="e.g. Ramesh Thapa"
              className="mt-1 h-9 w-full rounded-xl border border-[#D5CCC3] bg-white px-3 text-xs font-medium text-[#211D1A] outline-none focus:border-[#7A1D1B]"
            />
          </div>

          <div>
            <label className="flex items-center gap-1 text-[10px] font-bold text-[#736B64]">
              <Phone className="size-3 text-[#8A827B]" />
              <span>Station Desk Phone</span>
            </label>
            <input
              value={value.meetingDetails.contactPhone || ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  meetingDetails: { ...value.meetingDetails, contactPhone: e.target.value },
                })
              }
              placeholder="e.g. 01-4455667 / 9801122334"
              className="mt-1 h-9 w-full rounded-xl border border-[#D5CCC3] bg-white px-3 text-xs font-medium text-[#211D1A] outline-none focus:border-[#7A1D1B]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="flex items-center gap-1 text-[10px] font-bold text-[#736B64]">
              <Clock className="size-3 text-[#8A827B]" />
              <span>Reporting &amp; Arrival Instructions</span>
            </label>
            <input
              value={value.meetingDetails.reportingInstructions || ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  meetingDetails: {
                    ...value.meetingDetails,
                    reportingInstructions: e.target.value,
                  },
                })
              }
              placeholder="e.g. Passengers must arrive 20 minutes prior to boarding with ticket SMS."
              className="mt-1 h-9 w-full rounded-xl border border-[#D5CCC3] bg-white px-3 text-xs font-medium text-[#211D1A] outline-none focus:border-[#7A1D1B]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

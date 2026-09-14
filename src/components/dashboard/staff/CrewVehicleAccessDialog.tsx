"use client";

import { useEffect, useMemo, useState } from "react";
import { BusFront, LoaderCircle, X } from "lucide-react";
import { listOperatorFleets, type FleetListItem } from "@/features/fleet-registration/api";
import { updateCrewVehicleScope } from "@/features/crew-management/api";
import type { CrewVehicleScope, StaffMember } from "./staff-contract";

interface Props {
  staff: StaffMember;
  onClose: () => void;
  onSaved: (message: string) => void;
}

const options: Array<{ value: CrewVehicleScope; title: string; description: string }> = [
  { value: "ANY_VEHICLE", title: "Any vehicle", description: "Can work on any vehicle in this brand." },
  { value: "ONE_VEHICLE", title: "One vehicle", description: "Can work only on one selected vehicle." },
  { value: "SELECTED_VEHICLES", title: "Selected vehicles", description: "Can work on the vehicles you choose." },
];

export default function CrewVehicleAccessDialog({ staff, onClose, onSaved }: Props) {
  const [scope, setScope] = useState<CrewVehicleScope>(staff.vehicleScope || "ANY_VEHICLE");
  const [selected, setSelected] = useState<string[]>(staff.allowedVehicleIds || []);
  const [fleets, setFleets] = useState<FleetListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    listOperatorFleets()
      .then(items => { if (current) setFleets(items); })
      .catch(failure => { if (current) setError((failure as Error).message); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, []);

  const brandFleets = useMemo(
    () => fleets.filter(fleet => fleet.brandId === staff.brandId),
    [fleets, staff.brandId],
  );

  const chooseScope = (value: CrewVehicleScope) => {
    setScope(value);
    if (value === "ANY_VEHICLE") setSelected([]);
    if (value === "ONE_VEHICLE" && selected.length > 1) setSelected(selected.slice(0, 1));
  };
  const toggle = (fleetId: string) => setSelected(current => {
    if (scope === "ONE_VEHICLE") return [fleetId];
    return current.includes(fleetId)
      ? current.filter(id => id !== fleetId)
      : [...current, fleetId];
  });
  const valid = scope === "ANY_VEHICLE"
    || (scope === "ONE_VEHICLE" ? selected.length === 1 : selected.length > 0);

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true); setError("");
    try {
      await updateCrewVehicleScope(staff, scope, selected);
      onSaved("Vehicle access updated.");
    } catch (failure) { setError((failure as Error).message); }
    finally { setSaving(false); }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="vehicle-access-title">
    <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
      <header className="sticky top-0 z-10 flex items-start justify-between border-b border-neutral-200 bg-white px-6 py-5">
        <div><p className="text-xs font-bold uppercase tracking-wider text-[#7A1D1B]">Crew access</p><h2 id="vehicle-access-title" className="mt-1 text-xl font-bold text-neutral-900">Vehicles for {staff.fullName}</h2><p className="mt-1 text-sm text-neutral-500">Choose which vehicles this {staff.role} may serve.</p></div>
        <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="rounded-xl p-2 text-neutral-500 hover:bg-neutral-100"><X className="h-5 w-5" /></button>
      </header>
      <div className="space-y-5 p-6">
        <div className="grid gap-3">{options.map(option => <button key={option.value} type="button" onClick={() => chooseScope(option.value)} className={`rounded-2xl border p-4 text-left transition ${scope === option.value ? "border-[#7A1D1B] bg-[#FFF6F2] ring-2 ring-[#7A1D1B]/10" : "border-neutral-200 hover:border-neutral-300"}`}><span className="font-bold text-neutral-900">{option.title}</span><span className="mt-1 block text-sm text-neutral-500">{option.description}</span></button>)}</div>
        {scope !== "ANY_VEHICLE" && <section><h3 className="text-sm font-bold text-neutral-900">Choose vehicle{scope === "SELECTED_VEHICLES" ? "s" : ""}</h3>
          {loading ? <LoaderCircle className="mx-auto my-8 h-6 w-6 animate-spin text-[#7A1D1B]" />
            : brandFleets.length === 0 ? <p className="mt-3 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500">No vehicles are registered under this brand.</p>
              : <div className="mt-3 grid gap-2">{brandFleets.map(fleet => <label key={fleet.fleetId} className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 p-3"><input type={scope === "ONE_VEHICLE" ? "radio" : "checkbox"} name="crew-vehicle" checked={selected.includes(fleet.fleetId)} onChange={() => toggle(fleet.fleetId)} className="accent-[#7A1D1B]" /><BusFront className="h-4 w-4 text-[#7A1D1B]" /><span className="min-w-0"><span className="block truncate text-sm font-bold text-neutral-900">{fleet.busName}</span><span className="text-xs text-neutral-500">{fleet.busNumber}</span></span></label>)}</div>}
        </section>}
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        <div className="flex gap-3"><button type="button" onClick={onClose} disabled={saving} className="h-11 flex-1 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-700">Cancel</button><button type="button" onClick={() => void save()} disabled={!valid || saving} className="flex h-11 flex-1 items-center justify-center rounded-xl bg-[#7A1D1B] text-sm font-bold text-white disabled:opacity-45">{saving ? <LoaderCircle className="h-5 w-5 animate-spin" /> : "Save access"}</button></div>
      </div>
    </div>
  </div>;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Search, UserPlus, X } from "lucide-react";
import type { OperatorBrand } from "@/features/fleet-registration/api-brands";
import {
  createAgent, inviteAgent, listAssignmentOptions, lookupAgent,
} from "@/features/agent-assignment/api";
import {
  EMPTY_ASSIGNMENT_DRAFT, validateAssignmentDraft,
  type AgentPreview, type AssignmentDraft, type AssignmentOptions,
} from "@/features/agent-assignment/agent-assignment-contract";

interface Props { brands: OperatorBrand[]; onClose: () => void; onInvited: () => void; }
type SourceMode = "code" | "create";

const OUTLETS = ["TICKET_COUNTER", "TRAVEL_AGENCY", "MOBILE_SHOP", "HOTEL", "SOLO"];
const inputClass = "h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-[#7A1D1B]";

export default function AgentAssignmentDialog({ brands, onClose, onInvited }: Props) {
  const [mode, setMode] = useState<SourceMode>("code");
  const [draft, setDraft] = useState<AssignmentDraft>({
    ...EMPTY_ASSIGNMENT_DRAFT, brandId: brands.find((brand) => brand.status === "ACTIVE")?.id || "",
  });
  const [preview, setPreview] = useState<AgentPreview | null>(null);
  const [options, setOptions] = useState<AssignmentOptions | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createdMessage, setCreatedMessage] = useState("");
  const [createFields, setCreateFields] = useState({
    name: "", phone: "", outletType: "SOLO", district: "", municipality: "", placeName: "",
  });

  useEffect(() => {
    if (!draft.brandId) return undefined;
    let active = true;
    listAssignmentOptions(draft.brandId)
      .then((value) => { if (active) setOptions(value); })
      .catch((failure: Error) => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, [draft.brandId]);

  const currentOptions = options?.brand.id === draft.brandId ? options : null;
  const scopeOptions = useMemo(() => draft.accessScope === "ROUTES"
    ? currentOptions?.routes || [] : draft.accessScope === "SCHEDULES" ? currentOptions?.schedules || [] : [],
  [currentOptions, draft.accessScope]);

  const patchDraft = <K extends keyof AssignmentDraft>(key: K, value: AssignmentDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const findAgent = async (code = draft.agentCode, preserveCreatedMessage = false) => {
    if (!code.trim()) return setError("Enter the agent ID.");
    setBusy(true); setError("");
    if (!preserveCreatedMessage) setCreatedMessage("");
    try {
      const found = await lookupAgent(code);
      setPreview(found);
      patchDraft("agentCode", found.agentCode);
    } catch (failure) { setError((failure as Error).message); }
    finally { setBusy(false); }
  };

  const createNewAgent = async () => {
    if (Object.values(createFields).some((value) => !value.trim())) {
      return setError("Name, phone, outlet type, district, municipality and place are required.");
    }
    setBusy(true); setError("");
    try {
      const created = await createAgent({ ...createFields, brandId: draft.brandId || undefined });
      setCreatedMessage(created.smsSent
        ? "Agent created and activation details sent by SMS. Set the assignment terms below."
        : "Agent created. SMS was not confirmed, so share the Agent ID directly.");
      await findAgent(created.agentCode, true);
    } catch (failure) { setError((failure as Error).message); setBusy(false); }
  };

  const toggleScopeId = (id: string) => {
    const key = draft.accessScope === "ROUTES" ? "allowedRouteIds" : "allowedScheduleIds";
    const values = draft[key];
    patchDraft(key, values.includes(id) ? values.filter((value) => value !== id) : [...values, id]);
  };

  const submit = async () => {
    const validation = validateAssignmentDraft(draft);
    if (validation) return setError(validation);
    setBusy(true); setError("");
    try { await inviteAgent(draft); onInvited(); onClose(); }
    catch (failure) { setError((failure as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="agent-dialog-title">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-neutral-50 shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-5">
          <div><h2 id="agent-dialog-title" className="text-xl font-bold text-neutral-900">Add a ticket agent</h2><p className="text-sm text-neutral-500">The agent must accept before they can sell.</p></div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-neutral-500 hover:bg-neutral-100" aria-label="Close"><X className="h-5 w-5" /></button>
        </header>

        <div className="space-y-6 p-6">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-neutral-200/60 p-1">
            {(["code", "create"] as SourceMode[]).map((value) => <button key={value} type="button" onClick={() => { setMode(value); setPreview(null); setError(""); }} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${mode === value ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}>{value === "code" ? "Use Agent ID" : "Create new agent"}</button>)}
          </div>

          <label className="block text-sm font-bold text-neutral-700">Operator brand<select value={draft.brandId} onChange={(event) => setDraft((current) => ({ ...current, brandId: event.target.value, allowedRouteIds: [], allowedScheduleIds: [] }))} className={`${inputClass} mt-2`}><option value="">Choose a brand</option>{brands.filter((brand) => brand.status === "ACTIVE").map((brand) => <option key={brand.id} value={brand.id}>{brand.brandName}</option>)}</select></label>

          {!preview && mode === "code" && <section className="rounded-2xl border border-neutral-200 bg-white p-5"><label className="text-sm font-bold text-neutral-700">Agent ID</label><div className="mt-2 flex gap-2"><input value={draft.agentCode} onChange={(event) => patchDraft("agentCode", event.target.value)} placeholder="SM-AG-…" className={inputClass} /><button type="button" onClick={() => void findAgent()} disabled={busy} className="flex items-center gap-2 rounded-xl bg-[#7A1D1B] px-5 text-sm font-bold text-white disabled:opacity-50"><Search className="h-4 w-4" />Find</button></div></section>}

          {!preview && mode === "create" && <section className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-5 sm:grid-cols-2">
            {[['name','Full name'],['phone','Mobile number'],['district','District'],['municipality','Municipality'],['placeName','Place or locality']].map(([key,label]) => <label key={key} className="text-sm font-bold text-neutral-700">{label}<input value={createFields[key as keyof typeof createFields]} onChange={(event) => setCreateFields((current) => ({ ...current, [key]: event.target.value }))} className={`${inputClass} mt-2`} /></label>)}
            <label className="text-sm font-bold text-neutral-700">Outlet type<select value={createFields.outletType} onChange={(event) => setCreateFields((current) => ({ ...current, outletType: event.target.value }))} className={`${inputClass} mt-2`}>{OUTLETS.map((outlet) => <option key={outlet} value={outlet}>{outlet.replaceAll("_", " ")}</option>)}</select></label>
            <button type="button" onClick={() => void createNewAgent()} disabled={busy || !draft.brandId} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] text-sm font-bold text-white disabled:opacity-50 sm:col-span-2"><UserPlus className="h-4 w-4" />Create identity</button>
          </section>}

          {createdMessage && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{createdMessage}</p>}
          {preview && <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><p className="font-bold text-neutral-900">{preview.name || "Unnamed agent"}</p><p className="mt-1 font-mono text-sm text-emerald-800">{preview.agentCode}</p><p className="mt-2 text-xs text-neutral-600">{preview.outletType?.replaceAll("_", " ") || "Outlet not set"} · {preview.municipality || preview.district || "Location unavailable"} · {preview.kycStatus.replaceAll("_", " ")}</p></section>}

          {preview && <>
            <section className="rounded-2xl border border-neutral-200 bg-white p-5"><h3 className="font-bold text-neutral-900">Inventory access</h3><div className="mt-3 grid gap-2 sm:grid-cols-3">{([['ALL_BUSES','All buses'],['ROUTES','Specific routes'],['SCHEDULES','Specific schedules']] as const).map(([value,label]) => <button key={value} type="button" onClick={() => setDraft((current) => ({ ...current, accessScope: value, allowedRouteIds: [], allowedScheduleIds: [] }))} className={`rounded-xl border px-3 py-3 text-sm font-bold ${draft.accessScope === value ? "border-[#7A1D1B] bg-[#7A1D1B]/5 text-[#7A1D1B]" : "border-neutral-200 text-neutral-600"}`}>{label}</button>)}</div>
              {draft.accessScope !== "ALL_BUSES" && <div className="mt-4 max-h-48 space-y-2 overflow-y-auto rounded-xl bg-neutral-50 p-3">{scopeOptions.length === 0 ? <p className="text-sm text-amber-700">No active choices exist for this brand.</p> : scopeOptions.map((option) => { const selected = (draft.accessScope === "ROUTES" ? draft.allowedRouteIds : draft.allowedScheduleIds).includes(option.id); const label = "departureTime" in option ? `${option.routeName || "Route"} · ${option.bus.number || option.bus.name || "Bus"} · ${option.departureTime}` : `${option.name}${option.code ? ` · ${option.code}` : ""}`; return <label key={option.id} className="flex cursor-pointer items-center gap-3 rounded-lg bg-white p-3 text-sm"><input type="checkbox" checked={selected} onChange={() => toggleScopeId(option.id)} /><span>{label}</span></label>; })}</div>}
            </section>

            <section className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-5 sm:grid-cols-2"><h3 className="sm:col-span-2 font-bold text-neutral-900">Permissions and commission</h3>
              {[['canSellCash','Cash sales'],['canSellOnline','Online sales'],['canCancel','Can cancel']].map(([key,label]) => <label key={key} className="flex items-center gap-3 text-sm font-semibold text-neutral-700"><input type="checkbox" checked={draft[key as 'canSellCash']} onChange={(event) => patchDraft(key as 'canSellCash', event.target.checked)} />{label}</label>)}
              <label className="text-sm font-bold text-neutral-700">Max seats per booking<input type="number" min="1" value={draft.maxSeatsPerBooking} onChange={(event) => patchDraft("maxSeatsPerBooking", event.target.value)} placeholder="No limit" className={`${inputClass} mt-2`} /></label>
              <label className="text-sm font-bold text-neutral-700">Max discount %<input type="number" min="0" max="100" value={draft.maxDiscountPct} onChange={(event) => patchDraft("maxDiscountPct", event.target.value)} className={`${inputClass} mt-2`} /></label>
              {draft.canCancel && <label className="text-sm font-bold text-neutral-700">Cancel cutoff (minutes before departure)<input type="number" min="0" value={draft.cancelWindowMins} onChange={(event) => patchDraft("cancelWindowMins", event.target.value)} className={`${inputClass} mt-2`} /></label>}
              <label className="text-sm font-bold text-neutral-700">Commission type<select value={draft.commissionMode} onChange={(event) => patchDraft("commissionMode", event.target.value as AssignmentDraft['commissionMode'])} className={`${inputClass} mt-2`}><option value="PERCENT">Percent of fare</option><option value="FLAT_PER_SEAT">Flat per seat</option><option value="FLAT_PER_BOOKING">Flat per booking</option></select></label>
              <label className="text-sm font-bold text-neutral-700">Commission value<input type="number" min="0" value={draft.commissionValue} onChange={(event) => patchDraft("commissionValue", event.target.value)} className={`${inputClass} mt-2`} /><span className="mt-1 block text-xs font-normal text-neutral-500">Paid by your business, not by Shuvmarg.</span></label>
            </section>
          </>}

          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {preview && <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-bold">Cancel</button><button type="button" onClick={() => void submit()} disabled={busy} className="flex items-center gap-2 rounded-xl bg-[#7A1D1B] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy && <LoaderCircle className="h-4 w-4 animate-spin" />}Send invitation</button></div>}
        </div>
      </div>
    </div>
  );
}

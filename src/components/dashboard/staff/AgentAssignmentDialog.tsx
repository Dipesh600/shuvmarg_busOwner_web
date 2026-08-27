"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Search, UserPlus, X } from "lucide-react";
import type { OperatorBrand } from "@/features/fleet-registration/api-brands";
import {
  createAgent, inviteAgent, listAssignmentOptions, lookupAgent,
} from "@/features/agent-assignment/api";
import {
  AGENT_PERMISSION_AVAILABILITY, EMPTY_ASSIGNMENT_DRAFT, assignmentDraftsForBrands, validateAssignmentDraft,
  type AgentPreview, type AssignmentDraft, type AssignmentOptions,
} from "@/features/agent-assignment/agent-assignment-contract";
import AgentCreateFields, { type CreateAgentFields } from "./AgentCreateFields";
import { AgentBrandMultiSelect, AgentSearchableSelect } from "./AgentFormControls";

interface Props { brands: OperatorBrand[]; onClose: () => void; onInvited: () => void; }
type SourceMode = "code" | "create";

const inputClass = "h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-[#7A1D1B]";

export default function AgentAssignmentDialog({ brands, onClose, onInvited }: Props) {
  const [mode, setMode] = useState<SourceMode>("code");
  const [draft, setDraft] = useState<AssignmentDraft>({ ...EMPTY_ASSIGNMENT_DRAFT });
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [preview, setPreview] = useState<AgentPreview | null>(null);
  const [options, setOptions] = useState<AssignmentOptions | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createdMessage, setCreatedMessage] = useState("");
  const [createdMessageTone, setCreatedMessageTone] = useState<"success" | "warning">("success");
  const [identityCreated, setIdentityCreated] = useState(false);
  const [createFields, setCreateFields] = useState<CreateAgentFields>({
    name: "", phone: "", outletType: "TICKET_COUNTER", district: "", municipality: "", placeName: "",
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

  const changeBrands = (ids: string[]) => {
    setSelectedBrandIds(ids);
    setDraft((current) => ({
      ...current,
      brandId: ids.length === 1 ? ids[0] : "",
      accessScope: ids.length === 1 ? current.accessScope : "ALL_BUSES",
      allowedRouteIds: [],
      allowedScheduleIds: [],
    }));
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
      const created = await createAgent({
        ...createFields,
        brandId: selectedBrandIds.length === 1 ? selectedBrandIds[0] : undefined,
      });
      setIdentityCreated(true);
      const smsStatus = created.smsStatus
        || (created.smsSent ? "QUEUED" : created.requiresAgentActivation ? "FAILED" : "NOT_REQUIRED");
      setCreatedMessageTone(smsStatus === "NOT_REQUIRED" ? "success" : "warning");
      setCreatedMessage(smsStatus === "QUEUED"
        ? "Agent created. The SMS provider accepted the activation message into its queue; phone delivery is not yet confirmed."
        : smsStatus === "FAILED"
          ? "Agent created, but the activation SMS could not be queued. The account still requires activation."
          : "Existing account found. No SMS was sent; the agent should use their current Shuvmarg login.");
      await findAgent(created.agentCode, true);
    } catch (failure) { setError((failure as Error).message); setBusy(false); }
  };

  const toggleScopeId = (id: string) => {
    const key = draft.accessScope === "ROUTES" ? "allowedRouteIds" : "allowedScheduleIds";
    const values = draft[key];
    patchDraft(key, values.includes(id) ? values.filter((value) => value !== id) : [...values, id]);
  };

  const submit = async () => {
    if (selectedBrandIds.length === 0) {
      if (identityCreated) return onClose();
      return setError("Choose at least one operator brand to send an invitation.");
    }
    const invitationDrafts = assignmentDraftsForBrands(draft, selectedBrandIds);
    const validation = validateAssignmentDraft(invitationDrafts[0]);
    if (validation) return setError(validation);
    setBusy(true); setError("");
    try {
      const results = await Promise.allSettled(invitationDrafts.map(inviteAgent));
      const failedIds = invitationDrafts.filter((_, index) => results[index].status === "rejected").map((item) => item.brandId);
      onInvited();
      if (failedIds.length === 0) return onClose();
      changeBrands(failedIds);
      const firstFailure = results.find((result) => result.status === "rejected");
      const detail = firstFailure?.status === "rejected" && firstFailure.reason instanceof Error
        ? firstFailure.reason.message : "Try the remaining brands again.";
      setError(`${invitationDrafts.length - failedIds.length} invitation(s) sent; ${failedIds.length} failed. ${detail}`);
    } catch (failure) { setError((failure as Error).message); }
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

          {mode === "code" && !preview && <AgentBrandMultiSelect options={brands.filter((brand) => brand.status === "ACTIVE").map((brand) => ({ value: brand.id, label: brand.brandName }))} values={selectedBrandIds} onChange={changeBrands} />}

          {!preview && mode === "code" && <section className="rounded-2xl border border-neutral-200 bg-white p-5"><label className="text-sm font-bold text-neutral-700">Agent ID</label><div className="mt-2 flex gap-2"><input value={draft.agentCode} onChange={(event) => patchDraft("agentCode", event.target.value)} placeholder="SM-AG-…" className={inputClass} /><button type="button" onClick={() => void findAgent()} disabled={busy} className="flex items-center gap-2 rounded-xl bg-[#7A1D1B] px-5 text-sm font-bold text-white disabled:opacity-50"><Search className="h-4 w-4" />Find</button></div></section>}

          {!preview && mode === "create" && <><AgentCreateFields fields={createFields} brands={brands} brandIds={selectedBrandIds} onFieldsChange={setCreateFields} onBrandIdsChange={changeBrands} /><button type="button" onClick={() => void createNewAgent()} disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] text-sm font-bold text-white disabled:opacity-50"><UserPlus className="h-4 w-4" />Create identity</button></>}

          {createdMessage && <p className={`rounded-xl border p-3 text-sm ${createdMessageTone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{createdMessage}</p>}
          {preview && <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><p className="font-bold text-neutral-900">{preview.name || "Unnamed agent"}</p><p className="mt-1 font-mono text-sm text-emerald-800">{preview.agentCode}</p><p className="mt-2 text-xs text-neutral-600">{preview.outletType?.replaceAll("_", " ") || "Outlet not set"} · {preview.municipality || preview.district || "Location unavailable"} · {preview.kycStatus.replaceAll("_", " ")}</p></section>}
          {preview && <AgentBrandMultiSelect options={brands.filter((brand) => brand.status === "ACTIVE").map((brand) => ({ value: brand.id, label: brand.brandName }))} values={selectedBrandIds} onChange={changeBrands} />}

          {preview && selectedBrandIds.length > 0 && <>
            <section className="rounded-2xl border border-neutral-200 bg-white p-5"><h3 className="font-bold text-neutral-900">Inventory access</h3><p className="mt-1 text-xs leading-5 text-neutral-500">Access is always limited to the selected brand. The agent can sell only after accepting, passing KYC, and while the trip is active and open for booking.</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{([['ALL_BUSES','All buses','All current and upcoming sellable trips'],['ROUTES','Specific routes','Trips on selected route variants only'],['SCHEDULES','Specific schedules','Dated trips from selected recurring schedules']] as const).map(([value,label,help]) => { const disabled = selectedBrandIds.length !== 1 && value !== "ALL_BUSES"; return <button key={value} type="button" disabled={disabled} onClick={() => setDraft((current) => ({ ...current, accessScope: value, allowedRouteIds: [], allowedScheduleIds: [] }))} className={`rounded-xl border px-3 py-3 text-left disabled:cursor-not-allowed disabled:opacity-40 ${draft.accessScope === value ? "border-[#7A1D1B] bg-[#7A1D1B]/5 text-[#7A1D1B]" : "border-neutral-200 text-neutral-600"}`}><span className="block text-sm font-bold">{label}</span><span className="mt-1 block text-xs font-normal leading-4">{help}</span></button>; })}</div>{selectedBrandIds.length > 1 && <p className="mt-3 text-xs text-neutral-500">Each selected brand receives its own all-buses invitation. Configure route or schedule limits one brand at a time.</p>}
              {draft.accessScope !== "ALL_BUSES" && <div className="mt-4 max-h-48 space-y-2 overflow-y-auto rounded-xl bg-neutral-50 p-3">{scopeOptions.length === 0 ? <p className="text-sm text-amber-700">No active choices exist for this brand.</p> : scopeOptions.map((option) => { const selected = (draft.accessScope === "ROUTES" ? draft.allowedRouteIds : draft.allowedScheduleIds).includes(option.id); const label = "departureTime" in option ? `${option.routeName || "Route"} · ${option.bus.number || option.bus.name || "Bus"} · ${option.departureTime}` : `${option.name}${option.code ? ` · ${option.code}` : ""}`; return <label key={option.id} className="flex cursor-pointer items-center gap-3 rounded-lg bg-white p-3 text-sm"><input type="checkbox" checked={selected} onChange={() => toggleScopeId(option.id)} /><span>{label}</span></label>; })}</div>}
            </section>

            <section className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-5 sm:grid-cols-2"><div className="sm:col-span-2"><h3 className="font-bold text-neutral-900">Permissions and commission</h3><p className="mt-1 text-xs leading-5 text-neutral-500">Only cash seat sales and the seat limit are enforced by the current agent sale flow.</p></div>
              <label className="flex items-start gap-3 text-sm font-semibold text-neutral-700"><input type="checkbox" className="mt-1" checked={draft.canSellCash} onChange={(event) => patchDraft("canSellCash", event.target.checked)} /><span>Cash sales<span className="block text-xs font-normal text-neutral-500">Allows off-platform cash bookings after the assignment and KYC checks pass.</span></span></label>
              <label className="flex items-start gap-3 text-sm font-semibold text-neutral-400"><input type="checkbox" className="mt-1" checked={false} disabled /><span>Online sales<span className="block text-xs font-normal">Not available in the current backend.</span></span></label>
              <label className="flex items-start gap-3 text-sm font-semibold text-neutral-400"><input type="checkbox" className="mt-1" checked={false} disabled /><span>Agent cancellation<span className="block text-xs font-normal">Not available in the current backend.</span></span></label>
              <label className="text-sm font-bold text-neutral-700">Max seats per booking<input type="number" min="1" value={draft.maxSeatsPerBooking} onChange={(event) => patchDraft("maxSeatsPerBooking", event.target.value)} placeholder="No limit" className={`${inputClass} mt-2`} /><span className="mt-1 block text-xs font-normal text-neutral-500">Leave empty for no assignment-level limit.</span></label>
              {!AGENT_PERMISSION_AVAILABILITY.discount && <p className="rounded-xl bg-neutral-50 p-3 text-xs leading-5 text-neutral-500 sm:col-span-2"><span className="font-bold text-neutral-700">Discount limit:</span> not shown because the current cash-sale endpoint does not accept or enforce an agent discount.</p>}
              <AgentSearchableSelect label="Commission type" value={draft.commissionMode} onChange={(value) => patchDraft("commissionMode", value as AssignmentDraft['commissionMode'])} placeholder="Select commission type" options={[{ value: "PERCENT", label: "Percent of fare" }, { value: "FLAT_PER_SEAT", label: "Flat per seat" }, { value: "FLAT_PER_BOOKING", label: "Flat per booking" }]} />
              <label className="text-sm font-bold text-neutral-700">Commission value<input type="number" min="0" value={draft.commissionValue} onChange={(event) => patchDraft("commissionValue", event.target.value)} className={`${inputClass} mt-2`} /><span className="mt-1 block text-xs font-normal leading-5 text-neutral-500">Recorded as your agreement with the agent. Shuvmarg does not calculate, pay, or settle this cash commission yet.</span></label>
            </section>
          </>}

          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {preview && <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-bold">Cancel</button><button type="button" onClick={() => void submit()} disabled={busy} className="flex items-center gap-2 rounded-xl bg-[#7A1D1B] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy && <LoaderCircle className="h-4 w-4 animate-spin" />}{selectedBrandIds.length === 0 && identityCreated ? "Done" : `Send ${selectedBrandIds.length > 1 ? `${selectedBrandIds.length} invitations` : "invitation"}`}</button></div>}
        </div>
      </div>
    </div>
  );
}

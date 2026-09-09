"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Search, X } from "lucide-react";
import type { OperatorBrand } from "@/features/fleet-registration/api-brands";
import {
  createAgent, inviteAgent, listAssignmentOptions, lookupAgent, resendAgentInvitation,
} from "@/features/agent-assignment/api";
import {
  EMPTY_ASSIGNMENT_DRAFT, assignmentDraftsForBrands, validateAssignmentDraft,
  type AgentPreview, type AssignmentDraft, type AssignmentOptions,
} from "@/features/agent-assignment/agent-assignment-contract";
import AgentCreateFields, { type CreateAgentFields } from "./AgentCreateFields";
import { AgentBrandMultiSelect, AgentSearchableSelect } from "./AgentFormControls";

interface Props { brands: OperatorBrand[]; onClose: () => void; onInvited: () => void; }
type SourceMode = "code" | "create";

const inputClass = "h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-[#7A1D1B]";
const verificationLabel = (status: string) => ({
  APPROVED: "Identity verified",
  VERIFIED_BASIC: "Identity verified",
  PHONE_VERIFIED: "Phone verified",
  PENDING: "Verification in progress",
  REJECTED: "Verification needs attention",
  NO_APPLICATION: "Verification not started",
}[status] || "Verification not started");

const outletLabel = (value?: string | null) => value
  ? value.toLocaleLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toLocaleUpperCase())
  : "Outlet not set";

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
  const [createdAgentId, setCreatedAgentId] = useState("");
  const [createdSmsNeedsAttention, setCreatedSmsNeedsAttention] = useState(false);
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
    const creatingIdentity = mode === "create" && !preview;
    if (creatingIdentity && Object.values(createFields).some((value) => !value.trim())) {
      return setError("Name, phone, outlet type, district, municipality and place are required.");
    }
    const draftToValidate = creatingIdentity ? { ...draft, agentCode: "pending-agent-code" } : draft;
    const invitationDrafts = assignmentDraftsForBrands(draftToValidate, selectedBrandIds);
    const validation = validateAssignmentDraft(invitationDrafts[0]);
    if (validation) return setError(validation);
    setBusy(true); setError("");
    try {
      let agentCode = draft.agentCode;
      let keepOpenForSms = false;
      if (creatingIdentity) {
        const created = await createAgent({
          ...createFields,
          brandId: selectedBrandIds.length === 1 ? selectedBrandIds[0] : undefined,
        });
        agentCode = created.agentCode;
        setIdentityCreated(true);
        setCreatedAgentId(created.agentId);
        patchDraft("agentCode", agentCode);
        const smsStatus = created.smsStatus
          || (created.smsSent ? "QUEUED" : created.requiresAgentActivation ? "FAILED" : "NOT_REQUIRED");
        setCreatedMessageTone(["FAILED", "PENDING"].includes(smsStatus) ? "warning" : "success");
        keepOpenForSms = ["FAILED", "PENDING"].includes(smsStatus);
        setCreatedSmsNeedsAttention(keepOpenForSms);
        setCreatedMessage(smsStatus === "QUEUED"
          ? "Agent account created and activation instructions accepted into the SMS queue."
          : ["FAILED", "PENDING"].includes(smsStatus)
            ? "Agent account created. The activation SMS is saved for retry; you can resend it if needed."
            : "The existing Shuvmarg login will be used; no new SMS was needed.");
      }
      const drafts = assignmentDraftsForBrands({ ...draft, agentCode }, selectedBrandIds);
      const results = await Promise.allSettled(drafts.map(inviteAgent));
      const failedIds = drafts.filter((_, index) => results[index].status === "rejected").map((item) => item.brandId);
      if (failedIds.length < drafts.length) onInvited();
      if (failedIds.length === 0) {
        if (keepOpenForSms) { changeBrands([]); return; }
        return onClose();
      }
      changeBrands(failedIds);
      if (creatingIdentity) await findAgent(agentCode, true);
      const firstFailure = results.find((result) => result.status === "rejected");
      const detail = firstFailure?.status === "rejected" && firstFailure.reason instanceof Error
        ? firstFailure.reason.message : "Try the remaining brands again.";
      setError(`${drafts.length - failedIds.length} invitation(s) sent; ${failedIds.length} failed. ${detail}`);
    } catch (failure) { setError((failure as Error).message); }
    finally { setBusy(false); }
  };

  const resendCreatedActivation = async () => {
    if (!createdAgentId) return;
    setBusy(true); setError("");
    try {
      const response = await resendAgentInvitation(createdAgentId);
      const accepted = response.data.smsStatus === "PROVIDER_ACCEPTED";
      setCreatedSmsNeedsAttention(!accepted);
      setCreatedMessageTone(accepted ? "success" : "warning");
      setCreatedMessage(response.message || (accepted
        ? "Activation instructions were accepted into the SMS queue."
        : "Activation instructions are saved for automatic retry."));
    } catch (failure) { setError((failure as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="agent-dialog-title">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-neutral-50 shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-5">
          <div><h2 id="agent-dialog-title" className="text-xl font-bold text-neutral-900">Add a ticket agent</h2><p className="text-sm text-neutral-500">Add their details, choose where they can sell, and send an invite.</p></div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-neutral-500 hover:bg-neutral-100" aria-label="Close"><X className="h-5 w-5" /></button>
        </header>

        <div className="space-y-6 p-6">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-neutral-200/60 p-1">
            {(["code", "create"] as SourceMode[]).map((value) => <button key={value} type="button" onClick={() => { setMode(value); setPreview(null); setError(""); }} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${mode === value ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}>{value === "code" ? "Connect existing agent" : "Create new agent"}</button>)}
          </div>

          {mode === "code" && !preview && <AgentBrandMultiSelect options={brands.filter((brand) => brand.status === "ACTIVE").map((brand) => ({ value: brand.id, label: brand.brandName }))} values={selectedBrandIds} onChange={changeBrands} />}

          {!preview && mode === "code" && <section className="rounded-2xl border border-neutral-200 bg-white p-5"><label className="text-sm font-bold text-neutral-700">Agent ID</label><div className="mt-2 flex gap-2"><input value={draft.agentCode} onChange={(event) => patchDraft("agentCode", event.target.value)} placeholder="SM-AG-…" className={inputClass} /><button type="button" onClick={() => void findAgent()} disabled={busy} className="flex items-center gap-2 rounded-xl bg-[#7A1D1B] px-5 text-sm font-bold text-white disabled:opacity-50"><Search className="h-4 w-4" />Find</button></div></section>}

          {!preview && mode === "create" && <AgentCreateFields fields={createFields} brands={brands} brandIds={selectedBrandIds} onFieldsChange={setCreateFields} onBrandIdsChange={changeBrands} />}

          {createdMessage && <div className={`rounded-xl border p-3 text-sm ${createdMessageTone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}><p>{createdMessage}</p>{createdSmsNeedsAttention && createdAgentId && <button type="button" disabled={busy} onClick={() => void resendCreatedActivation()} className="mt-3 rounded-lg border border-current px-3 py-2 text-xs font-bold disabled:opacity-50">Resend activation SMS</button>}</div>}
          {preview && <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><p className="font-bold text-neutral-900">{preview.name || "Unnamed agent"}</p><p className="mt-1 font-mono text-sm text-emerald-800">{preview.agentCode}</p><p className="mt-2 text-xs text-neutral-600">{outletLabel(preview.outletType)} · {preview.municipality || preview.district || "Location unavailable"} · {verificationLabel(preview.kycStatus)}</p></section>}
          {preview && <AgentBrandMultiSelect options={brands.filter((brand) => brand.status === "ACTIVE").map((brand) => ({ value: brand.id, label: brand.brandName }))} values={selectedBrandIds} onChange={changeBrands} />}

          {(preview || mode === "create") && selectedBrandIds.length > 0 && <>
            <section className="rounded-2xl border border-neutral-200 bg-white p-5"><h3 className="font-bold text-neutral-900">Where can this agent sell?</h3><p className="mt-1 text-sm text-neutral-500">Choose how much of your trip list they can use.</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{([['ALL_BUSES','All trips','Every available trip'],['ROUTES','Selected routes','Only routes you choose'],['SCHEDULES','Selected departures','Only departures you choose']] as const).map(([value,label,help]) => { const disabled = selectedBrandIds.length !== 1 && value !== "ALL_BUSES"; return <button key={value} type="button" disabled={disabled} onClick={() => setDraft((current) => ({ ...current, accessScope: value, allowedRouteIds: [], allowedScheduleIds: [] }))} className={`rounded-xl border px-3 py-3 text-left disabled:cursor-not-allowed disabled:opacity-40 ${draft.accessScope === value ? "border-[#7A1D1B] bg-[#7A1D1B]/5 text-[#7A1D1B]" : "border-neutral-200 text-neutral-600"}`}><span className="block text-sm font-bold">{label}</span><span className="mt-1 block text-xs font-normal leading-4">{help}</span></button>; })}</div>{selectedBrandIds.length > 1 && <p className="mt-3 text-xs text-neutral-500">With several brands selected, this agent gets all trips from each brand. To limit routes or departures, invite them to one brand at a time.</p>}
              {draft.accessScope !== "ALL_BUSES" && <div className="mt-4 max-h-48 space-y-2 overflow-y-auto rounded-xl bg-neutral-50 p-3">{scopeOptions.length === 0 ? <p className="text-sm text-amber-700">No routes or departures are available for this brand yet.</p> : scopeOptions.map((option) => { const selected = (draft.accessScope === "ROUTES" ? draft.allowedRouteIds : draft.allowedScheduleIds).includes(option.id); const label = "departureTime" in option ? `${option.routeName || "Route"} · ${option.bus.number || option.bus.name || "Bus"} · ${option.departureTime}` : `${option.name}${option.code ? ` · ${option.code}` : ""}`; return <label key={option.id} className="flex cursor-pointer items-center gap-3 rounded-lg bg-white p-3 text-sm"><input type="checkbox" checked={selected} onChange={() => toggleScopeId(option.id)} /><span>{label}</span></label>; })}</div>}
            </section>

            <section className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-5 sm:grid-cols-2"><div className="sm:col-span-2"><h3 className="font-bold text-neutral-900">Booking rules</h3><p className="mt-1 text-sm text-neutral-500">Set simple limits for this agent.</p></div>
              <label className="flex items-start gap-3 text-sm font-semibold text-neutral-700"><input type="checkbox" className="mt-1" checked={draft.canSellCash} onChange={(event) => patchDraft("canSellCash", event.target.checked)} /><span>Allow cash bookings<span className="block text-xs font-normal text-neutral-500">The agent collects payment directly from the passenger.</span></span></label>
              <label className="text-sm font-bold text-neutral-700">Seats allowed in one booking<input type="number" min="1" value={draft.maxSeatsPerBooking} onChange={(event) => patchDraft("maxSeatsPerBooking", event.target.value)} placeholder="No limit" className={`${inputClass} mt-2`} /><span className="mt-1 block text-xs font-normal text-neutral-500">Leave empty if there is no limit.</span></label>
              <div className="border-t border-neutral-100 pt-4 sm:col-span-2"><h3 className="font-bold text-neutral-900">Agent commission <span className="text-sm font-normal text-neutral-400">Optional</span></h3><p className="mt-1 text-sm text-neutral-500">Record what you have agreed to pay the agent. You pay them directly.</p></div>
              <AgentSearchableSelect label="How is commission calculated?" value={draft.commissionMode} onChange={(value) => patchDraft("commissionMode", value as AssignmentDraft['commissionMode'])} placeholder="Choose a method" options={[{ value: "PERCENT", label: "Percentage of ticket price" }, { value: "FLAT_PER_SEAT", label: "Fixed amount for each seat" }, { value: "FLAT_PER_BOOKING", label: "Fixed amount for each booking" }]} />
              <label className="text-sm font-bold text-neutral-700">{draft.commissionMode === "PERCENT" ? "Commission percentage" : "Commission amount (Rs.)"}<input type="number" min="0" max={draft.commissionMode === "PERCENT" ? 100 : undefined} value={draft.commissionValue} onChange={(event) => patchDraft("commissionValue", event.target.value)} className={`${inputClass} mt-2`} /><span className="mt-1 block text-xs font-normal text-neutral-500">Enter 0 if no commission is paid.</span></label>
            </section>
            <p className="text-center text-xs text-neutral-500">The agent can start selling after accepting your invitation and completing account verification.</p>
          </>}

          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {(preview || mode === "create") && <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-bold">Cancel</button><button type="button" onClick={() => void submit()} disabled={busy} className="flex items-center gap-2 rounded-xl bg-[#7A1D1B] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy && <LoaderCircle className="h-4 w-4 animate-spin" />}{selectedBrandIds.length === 0 && identityCreated ? "Done" : mode === "create" && !preview ? `Create agent & send ${selectedBrandIds.length > 1 ? `${selectedBrandIds.length} invitations` : "invitation"}` : `Send ${selectedBrandIds.length > 1 ? `${selectedBrandIds.length} invitations` : "invitation"}`}</button></div>}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, Layers3, Save, ShieldCheck } from "lucide-react";
import Link from "next/link";
import {
  assignSeatLayoutVersion,
  deriveSeatTemplate,
  getFleetDetail,
  listSeatLayoutRevisions,
  listSeatTemplates,
  requestSeatLayoutRevision,
  type FleetDetail,
  type SeatLayoutConfig,
  type SeatLayoutRevision,
  type SeatTemplateRecord,
} from "@/features/operator-dashboard/operator-fleet-api";
import { cloneLayout, countSeats, isAdditionOnly } from "@/features/seat-layout/seat-layout-tools";
import SeatLayoutEditor from "./SeatLayoutEditor";

interface Props { fleetId: string; }

export default function FleetSeatWorkstation({ fleetId }: Props) {
  const [fleet, setFleet] = useState<FleetDetail | null>(null);
  const [templates, setTemplates] = useState<SeatTemplateRecord[]>([]);
  const [revisions, setRevisions] = useState<SeatLayoutRevision[]>([]);
  const [draft, setDraft] = useState<SeatLayoutConfig | null>(null);
  const [reason, setReason] = useState("");
  const [effectiveAt, setEffectiveAt] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    const [detail, availableTemplates, history] = await Promise.all([
      getFleetDetail(fleetId), listSeatTemplates(), listSeatLayoutRevisions(fleetId),
    ]);
    setFleet(detail); setTemplates(availableTemplates); setRevisions(history);
    if (detail.seatLayout.seatConfig) setDraft(cloneLayout(detail.seatLayout.seatConfig));
  }

  useEffect(() => {
    let active = true;
    Promise.all([getFleetDetail(fleetId), listSeatTemplates(), listSeatLayoutRevisions(fleetId)])
      .then(([detail, availableTemplates, history]) => {
        if (!active) return;
        setFleet(detail); setTemplates(availableTemplates); setRevisions(history);
        if (detail.seatLayout.seatConfig) setDraft(cloneLayout(detail.seatLayout.seatConfig));
      })
      .catch((error) => { if (active) setFeedback(error.message); });
    return () => { active = false; };
  }, [fleetId]);
  const proposedSeats = draft ? countSeats(draft) : 0;
  const currentLayout = fleet?.seatLayout.seatConfig;
  const changed = Boolean(draft && currentLayout && JSON.stringify(draft) !== JSON.stringify(currentLayout));
  const requiresReview = Boolean(changed && draft && currentLayout && !isAdditionOnly(currentLayout, draft));
  const minEffective = useMemo(() => { const date = new Date(); date.setDate(date.getDate() + 7); return date.toISOString().slice(0, 10); }, []);

  async function assignTemplate(template: SeatTemplateRecord) {
    setBusy(true); setFeedback(null);
    try {
      let selected = template;
      if (template.scope === "GLOBAL") selected = await deriveSeatTemplate(template._id, `${template.templateName} · ${fleet?.vehicle.busNumber || "My fleet"}`);
      if (!selected.currentVersionId) throw new Error("This template has no published version yet.");
      await assignSeatLayoutVersion(fleetId, selected.currentVersionId);
      await reload(); setFeedback("Seat template assigned to this fleet.");
    } catch (error) { setFeedback(error instanceof Error ? error.message : "Could not assign template."); }
    finally { setBusy(false); }
  }

  async function saveLayout() {
    if (!draft) return;
    if (!changed) { setFeedback("Change at least one seat before saving."); return; }
    if (!reason.trim()) { setFeedback("Explain why this layout is changing."); return; }
    if (requiresReview && !effectiveAt) { setFeedback("Choose an effective date at least seven days ahead."); return; }
    setBusy(true); setFeedback(null);
    try {
      const revision = await requestSeatLayoutRevision(fleetId, draft, reason.trim(), requiresReview ? effectiveAt : undefined);
      await reload();
      setReason(""); setEffectiveAt("");
      setFeedback(revision.status === "APPLIED" ? "Added seats are live on eligible future trips." : "Layout change submitted for admin review.");
    } catch (error) { setFeedback(error instanceof Error ? error.message : "Could not save layout change."); }
    finally { setBusy(false); }
  }

  if (!fleet) return <div className="min-h-64 animate-pulse rounded-3xl border border-[#E8E1DB] bg-white" />;
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-[#E8E1DB] bg-white p-6 shadow-sm sm:p-8">
        <Link href="/dashboard/fleet" className="inline-flex items-center gap-2 text-xs font-bold text-[#7A1D1B]"><ArrowLeft className="h-4 w-4" />Back to fleet</Link>
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#817A74]">Fleet workstation</p><h1 className="mt-2 text-3xl font-black text-[#191512]">{fleet.vehicle.busName}</h1><p className="mt-1 font-mono text-sm text-[#746E69]">{fleet.vehicle.busNumber} · {fleet.vehicle.busType}</p></div>
          <div className="flex gap-2"><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">{fleet.approvalStatus}</span>{fleet.seatLayout.nextVersionId && <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">Change scheduled</span>}</div>
        </div>
      </header>

      {!fleet.seatLayout.seatConfig ? <section className="rounded-3xl border border-[#E8E1DB] bg-white p-6 sm:p-8"><div className="max-w-2xl"><Layers3 className="h-8 w-8 text-[#7A1D1B]" /><h2 className="mt-4 text-2xl font-black">Choose a reusable seat template</h2><p className="mt-2 text-sm leading-6 text-[#746E69]">Global layouts are copied into your private operator library before assignment, so your changes never alter Shuvmarg’s master template.</p></div><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{templates.map((template) => <button disabled={busy} onClick={() => assignTemplate(template)} key={template._id} className="rounded-2xl border border-[#E8E1DB] p-5 text-left transition hover:border-[#7A1D1B] hover:shadow-md"><div className="flex justify-between"><strong>{template.templateName}</strong><span className="text-[10px] font-bold uppercase text-[#817A74]">{template.scope}</span></div><p className="mt-3 text-sm text-[#746E69]">{template.totalSeats} seats · {template.seatConfig.busShape.replaceAll("_", " ")}</p></button>)}</div></section> : draft && <>
        <section className="rounded-3xl border border-[#E8E1DB] bg-white p-5 sm:p-7"><div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-black">Seat layout builder</h2><p className="mt-1 text-sm text-[#746E69]">Build mixed seating across one or two decks. Click a seat to enable or withdraw it.</p></div><div className="text-right"><p className="text-2xl font-black">{proposedSeats}</p><p className="text-xs text-[#817A74]">passenger seats</p></div></div><SeatLayoutEditor value={draft} onChange={setDraft} /></section>
        <section className="grid gap-5 lg:grid-cols-[1fr_360px]"><div className="rounded-3xl border border-[#E8E1DB] bg-white p-6"><h2 className="font-black">Change control</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-[#655E58] sm:col-span-2">Reason<textarea value={reason} onChange={(e) => setReason(e.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-[#DCD4CD] p-3 text-sm font-medium" placeholder="Example: upper deck converted to sleeper berths" /></label>{requiresReview && <label className="text-xs font-bold text-[#655E58]">Effective date<input type="date" min={minEffective} value={effectiveAt} onChange={(e) => setEffectiveAt(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#DCD4CD] px-3" /></label>}</div><div className={`mt-4 rounded-2xl p-4 text-sm ${requiresReview ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-800"}`}>{requiresReview ? "This modifies or withdraws existing seats. Admin review, booking checks, and seven days’ notice are required." : "This only adds capacity. It can be applied immediately without admin review."}</div><button type="button" disabled={busy} onClick={saveLayout} className="mt-5 inline-flex h-12 items-center gap-2 rounded-xl bg-[#7A1D1B] px-5 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" />{busy ? "Saving…" : requiresReview ? "Submit layout revision" : "Apply added seats"}</button></div>
          <div className="rounded-3xl border border-[#E8E1DB] bg-white p-6"><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#7A1D1B]" /><h2 className="font-black">Revision history</h2></div><div className="mt-4 space-y-3">{revisions.length ? revisions.slice(0,5).map((revision) => <div key={revision._id} className="rounded-2xl bg-[#FAF8F5] p-4"><div className="flex items-center justify-between gap-2"><span className="text-xs font-black">{revision.status.replaceAll("_", " ")}</span>{revision.status === "APPLIED" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Clock3 className="h-4 w-4 text-amber-700" />}</div><p className="mt-2 text-xs text-[#746E69]">+{revision.addedSeatLabels?.length || 0} / −{revision.removedSeatLabels?.length || 0} seats</p></div>) : <p className="text-sm text-[#817A74]">No layout changes yet.</p>}</div></div></section>
      </>}
      {feedback && <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl bg-[#191512] px-5 py-4 text-sm font-semibold text-white shadow-xl">{feedback}</div>}
    </div>
  );
}

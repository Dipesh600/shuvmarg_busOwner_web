"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, RefreshCw, Rows3 } from "lucide-react";
import SeatLayoutCanvas from "@/features/seat-layout-v3/SeatLayoutCanvas";
import { cloneLayout, passengerPlaces } from "@/features/seat-layout-v3/layout";
import { getLayoutTemplate, loadSeatLayoutLibrary } from "@/features/seat-layout-v3/api";
import { defaultGuidedLayoutConfig } from "@/features/seat-layout-v3/generator";
import type { SeatLayoutTemplate, SeatLayoutV3 } from "@/features/seat-layout-v3/types";
import FleetSeatLayoutDesigner from "../seat-layout/FleetSeatLayoutDesigner";
import GuidedLayoutBuilder from "../seat-layout/GuidedLayoutBuilder";
import SeatTemplatePicker from "../seat-layout/SeatTemplatePicker";
import type { FleetRegistrationDraft } from "../types";

export default function SeatLayoutStep({ draft, update }: { draft: FleetRegistrationDraft; update: (next: FleetRegistrationDraft) => void }) {
  const [templates, setTemplates] = useState<SeatLayoutTemplate[]>([]);
  const [editorLayout, setEditorLayout] = useState<SeatLayoutV3 | null | undefined>();
  const [editorTitle, setEditorTitle] = useState("Build a seat layout");
  const [sourceTemplateId, setSourceTemplateId] = useState<string | null>(null);
  const [guidedScratch, setGuidedScratch] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => { setBusy(true); setError(null); try { setTemplates(await loadSeatLayoutLibrary()); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load seat layouts."); } finally { setBusy(false); } }, []);
  useEffect(() => { let active = true; loadSeatLayoutLibrary().then((items) => { if (active) setTemplates(items); }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load seat layouts."); }).finally(() => { if (active) setBusy(false); }); return () => { active = false; }; }, []);

  async function choose(template: SeatLayoutTemplate) {
    setBusy(true); setError(null);
    try {
      const detail = await getLayoutTemplate(template.id);
      const revision = detail.revisions.find((item) => item.id === template.currentPublishedRevisionId) || detail.revisions.find((item) => item.status === "PUBLISHED");
      if (!revision?.layout) throw new Error("This seat layout is not ready to use.");
      update({ ...draft, layout: { templateId: template.id, templateName: template.name, revisionId: revision.id, totalPlaces: revision.totalPlaces, layout: revision.layout, customized: false, sourceTemplateId: template.sourceTemplateId || null, templateScope: template.scope } });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to select this seat layout."); } finally { setBusy(false); }
  }

  function customize() { if (!draft.layout) return; setEditorTitle(`Adjust ${draft.layout.templateName}`); setSourceTemplateId(draft.layout.templateScope === "PLATFORM" ? draft.layout.templateId : draft.layout.sourceTemplateId || draft.layout.templateId); setEditorLayout(cloneLayout(draft.layout.layout)); }
  function startScratch() { setGuidedScratch(true); setSourceTemplateId(null); }
  function useCustom(layout: SeatLayoutV3) { const totalPlaces = passengerPlaces(layout).length; update({ ...draft, layout: { templateId: null, revisionId: null, templateName: `${draft.vehicle.busName.trim() || "New bus"} layout`, totalPlaces, layout, customized: true, sourceTemplateId } }); setEditorLayout(undefined); setGuidedScratch(false); }

  if (guidedScratch) return <GuidedLayoutBuilder initialConfig={defaultGuidedLayoutConfig(draft.vehicle.vehicleType === "MINIBUS" ? "MINIBUS" : draft.vehicle.vehicleType === "HIACE" ? "HIACE" : "BUS")} onContinue={(layout) => { setEditorTitle("Make final adjustments"); setEditorLayout(layout); setGuidedScratch(false); }} onCancel={() => setGuidedScratch(false)} />;
  if (editorLayout !== undefined) return <FleetSeatLayoutDesigner title={editorTitle} layout={editorLayout} busy={busy} onChange={setEditorLayout} onUse={useCustom} onCancel={() => setEditorLayout(undefined)} />;
  if (busy && !templates.length) return <div className="flex h-full min-h-52 items-center justify-center text-sm text-[#746E69]"><Loader2 className="mr-2 size-4 animate-spin" />Loading seat layouts…</div>;
  if (error && !templates.length) return <LoadError error={error} reload={load} />;

  return <div className="space-y-5">{error && <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</div>}<SeatTemplatePicker templates={templates} selectedId={draft.layout?.templateId} busy={busy} onChoose={(item) => void choose(item)} onScratch={startScratch} />{draft.layout && <div className="rounded-[24px] border border-[#E8E1DB] bg-[#FAF8F5] p-4"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="font-black">{draft.layout.templateName}</p><p className="mt-1 text-xs text-[#746E69]">{draft.layout.totalPlaces} places{draft.layout.customized ? " · custom for this bus" : ""}</p></div><button type="button" onClick={customize} className="inline-flex h-9 items-center rounded-xl border border-[#7A1D1B] px-3 text-xs font-black text-[#7A1D1B]"><Pencil className="mr-2 size-3.5" />Customize layout</button></div><SeatLayoutCanvas layout={draft.layout.layout} tool="SELECT" selectedId={null} onSelect={() => undefined} onChange={() => undefined} /></div>}</div>;
}

function LoadError({ error, reload }: { error: string; reload: () => Promise<void> }) { return <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[#DCCFC8] bg-[#FFFCFA] p-8 text-center"><Rows3 className="size-7 text-[#7A1D1B]" /><p className="mt-3 text-sm font-black text-[#211D1A]">Seat layouts couldn’t load</p><p className="mt-1 max-w-sm text-xs leading-5 text-[#746E69]">{error}</p><button type="button" onClick={() => void reload()} className="mt-4 inline-flex h-10 items-center rounded-xl border border-[#DCCFC8] px-4 text-xs font-black text-[#7A1D1B]"><RefreshCw className="mr-2 size-3.5" />Try again</button></div>; }

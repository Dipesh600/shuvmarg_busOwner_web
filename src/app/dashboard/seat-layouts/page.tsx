"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  LayoutTemplate,
  RefreshCw,
  Send,
  ShieldCheck,
} from "lucide-react";
import SeatLayoutBuilder from "@/features/seat-layout-v3/SeatLayoutBuilder";
import {
  adoptTemplate,
  assignFleetLayout,
  createRevision,
  getFleetAssignment,
  getLayoutTemplate,
  listCatalog,
  listFleets,
  listMyLayouts,
  requestFleetLayoutChange,
  submitRevision,
} from "@/features/seat-layout-v3/api";
import type {
  SeatLayoutTemplate,
  SeatLayoutV3,
  TemplateDetail,
} from "@/features/seat-layout-v3/types";

/* ─── Input style token ──────────────────────────────────────── */
const INPUT =
  "mt-2 h-11 w-full rounded-xl border border-[#DCD4CD] bg-white px-3.5 text-sm font-semibold text-[#191512] outline-none focus:border-[#7A1D1B] transition";

/* ─── Library list sidebar block ─────────────────────────────── */
function LibraryList({
  title,
  items,
  active,
  onChoose,
}: {
  title: string;
  items: SeatLayoutTemplate[];
  active?: string;
  onChoose: (id: string) => Promise<void>;
}) {
  return (
    <section className="rounded-2xl border border-[#E8E1DB] bg-white overflow-hidden shadow-xs">
      <p className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#938A82] border-b border-[#F0EBE5]">
        {title}
      </p>
      {items.length ? (
        <div className="divide-y divide-[#F5F0EC]">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => void onChoose(item.id)}
              className={`w-full px-4 py-3.5 text-left transition flex items-start gap-3 ${
                active === item.id
                  ? "bg-[#FFF1EE]"
                  : "hover:bg-[#FAF8F5]"
              }`}
            >
              <div
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                  active === item.id
                    ? "bg-[#7A1D1B] border-[#7A1D1B] text-white"
                    : "bg-[#FAF8F5] border-[#E8E1DB] text-[#938A82]"
                }`}
              >
                <LayoutTemplate className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p
                  className={`text-sm font-bold truncate ${
                    active === item.id ? "text-[#7A1D1B]" : "text-[#191512]"
                  }`}
                >
                  {item.name}
                </p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[#938A82] truncate">
                  {item.templateCode} · {item.vehicleCategory}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="px-4 py-5 text-xs text-[#938A82]">Nothing here yet.</p>
      )}
    </section>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function SeatLayoutsPage() {
  const [catalog, setCatalog] = useState<SeatLayoutTemplate[]>([]);
  const [mine, setMine] = useState<SeatLayoutTemplate[]>([]);
  const [selected, setSelected] = useState<TemplateDetail | null>(null);
  const [layout, setLayout] = useState<SeatLayoutV3 | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [summary, setSummary] = useState("Updated physical seat arrangement");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fleets, setFleets] = useState<
    Array<{ fleetId: string; busName: string; busNumber: string }>
  >([]);
  const [fleetId, setFleetId] = useState("");

  /* load */
  useEffect(() => {
    let active = true;
    void Promise.all([
      listCatalog(),
      listMyLayouts(),
      listFleets().catch(() => []),
    ])
      .then(async ([platform, owned, fleetItems]) => {
        if (!active) return;
        setCatalog(platform);
        setMine(owned);
        setFleets(fleetItems);
        const id = owned[0]?.id || platform[0]?.id;
        if (!id) return;
        const detail = await getLayoutTemplate(id);
        if (!active) return;
        setSelected(detail);
        setName(detail.template.name);
        setCode(detail.template.templateCode);
        setLayout(
          detail.revisions.find((r) => r.layout)?.layout || null
        );
      })
      .catch((err) => {
        if (active)
          setMessage(
            err instanceof Error ? err.message : "Unable to load layouts."
          );
      });
    return () => {
      active = false;
    };
  }, []);

  async function choose(id: string) {
    const detail = await getLayoutTemplate(id);
    setSelected(detail);
    setName(detail.template.name);
    setCode(detail.template.templateCode);
    setLayout(detail.revisions.find((r) => r.layout)?.layout || null);
  }

  async function reload(selectId?: string) {
    const [platform, owned, fleetItems] = await Promise.all([
      listCatalog(),
      listMyLayouts(),
      listFleets().catch(() => []),
    ]);
    setCatalog(platform);
    setMine(owned);
    setFleets(fleetItems);
    const id = selectId || owned[0]?.id || platform[0]?.id;
    if (id) await choose(id);
  }

  async function adopt() {
    if (!selected || selected.template.scope !== "PLATFORM") return;
    setBusy(true);
    try {
      const result = await adoptTemplate(
        selected.template.id,
        name.trim(),
        code.trim()
      );
      await reload(result.template.id);
      setMessage("Template copied into your private operator library.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to adopt template.");
    } finally {
      setBusy(false);
    }
  }

  async function save(value: SeatLayoutV3) {
    if (!selected || selected.template.scope !== "OPERATOR") return;
    setBusy(true);
    try {
      await createRevision(selected.template.id, value, summary.trim());
      await choose(selected.template.id);
      setMessage("New immutable draft created. Existing fleet layouts are unchanged.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to save revision.");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    const draft = selected?.revisions.find((r) => r.status === "DRAFT");
    if (!selected || !draft) return;
    setBusy(true);
    try {
      await submitRevision(selected.template.id, draft.id);
      await choose(selected.template.id);
      setMessage("Revision submitted for Shuvmarg review.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to submit.");
    } finally {
      setBusy(false);
    }
  }

  async function assign() {
    const revision = selected?.revisions.find((r) => r.status === "PUBLISHED");
    if (!selected || !revision || !fleetId) return;
    setBusy(true);
    try {
      const current = await getFleetAssignment(fleetId);
      if (current.assignment) await requestFleetLayoutChange(fleetId, revision.id);
      else await assignFleetLayout(fleetId, revision.id);
      setMessage(
        current.assignment
          ? "Fleet layout change sent for review. Current trips remain unchanged."
          : "Published layout assigned to the fleet."
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to assign fleet layout.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-full bg-[#FAF8F5]">
      {/* ── Hero header with illustration ──────────────────── */}
      <div className="relative overflow-hidden border-b border-[#EDE7E0] bg-white">
        {/* Illustration — right-aligned, fades to white */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-[55%] sm:w-[45%]"
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/my_buses.webp"
            alt=""
            className="h-full w-full object-cover object-left opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/60 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-[1500px] px-5 py-8 lg:px-8 lg:py-10">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7A1D1B]">
            Seat Layouts
          </p>
          <h1 className="mt-1.5 text-3xl font-black tracking-tight text-[#191512] sm:text-4xl">
            Seat layout studio
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-6 text-[#746E69]">
            Start from a Shuvmarg template, keep your own private copy, and submit only physical changes for review.
          </p>

          {/* Running trips notice */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#FFF1EE] px-3.5 py-2 text-xs font-bold text-[#7A1D1B]">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Running trips keep their captured layout
          </div>
        </div>
      </div>

      {/* ── Main workspace ─────────────────────────────────── */}
      <div className="mx-auto max-w-[1500px] px-5 py-6 lg:px-8 lg:py-8">
        <div className="flex gap-6 items-start xl:flex-row flex-col">

          {/* ── Left sidebar: template library ─────────────── */}
          <aside className="w-full xl:w-[280px] xl:shrink-0 xl:sticky xl:top-6 space-y-3">
            <LibraryList
              title="Shuvmarg templates"
              items={catalog}
              active={selected?.template.id}
              onChoose={choose}
            />
            <LibraryList
              title="My layouts"
              items={mine}
              active={selected?.template.id}
              onChoose={choose}
            />
          </aside>

          {/* ── Right main area ─────────────────────────────── */}
          <main className="min-w-0 flex-1 space-y-5">
            {selected ? (
              <>
                {/* Layout metadata card */}
                <section className="rounded-2xl border border-[#E8E1DB] bg-white p-5 shadow-xs">
                  <div className="grid gap-4 sm:grid-cols-[1fr_200px_auto]">
                    {/* Name */}
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#938A82]">
                      Layout name
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={selected.template.scope === "OPERATOR"}
                        className={INPUT}
                        placeholder="e.g. Himalayan Travels layout"
                      />
                    </label>

                    {/* Code */}
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#938A82]">
                      Private code
                      <input
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        disabled={selected.template.scope === "OPERATOR"}
                        className={`${INPUT} font-mono`}
                        placeholder="FLT-XXXX"
                      />
                    </label>

                    {/* Action */}
                    <div className="flex items-end">
                      {selected.template.scope === "PLATFORM" ? (
                        <button
                          onClick={adopt}
                          disabled={busy}
                          className="flex h-11 items-center gap-2 rounded-xl bg-[#7A1D1B] px-5 text-sm font-black text-white transition hover:bg-[#641715] disabled:opacity-50 whitespace-nowrap"
                        >
                          <Copy className="h-4 w-4 shrink-0" />
                          Copy to my library
                        </button>
                      ) : (
                        <span className="flex h-11 items-center gap-2 rounded-xl bg-emerald-50 px-4 text-xs font-bold text-emerald-700 whitespace-nowrap">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          Private operator layout
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Summary — only for operator-owned layouts */}
                  {selected.template.scope === "OPERATOR" && (
                    <label className="mt-4 block text-[10px] font-black uppercase tracking-widest text-[#938A82]">
                      What changed?
                      <input
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        className={INPUT}
                        placeholder="Describe the physical change"
                      />
                    </label>
                  )}
                </section>

                {/* Canvas + sidebar builder */}
                <SeatLayoutBuilder
                  layout={layout}
                  onChange={setLayout}
                  onSave={save}
                  busy={busy}
                />

                {/* Revision history + Fleet assignment — operator only */}
                {selected.template.scope === "OPERATOR" && (
                  <section className="grid gap-5 lg:grid-cols-2">
                    {/* Revision history */}
                    <div className="rounded-2xl border border-[#E8E1DB] bg-white p-5 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF1EE]">
                          <RefreshCw className="h-4 w-4 text-[#7A1D1B]" />
                        </div>
                        <h2 className="font-black text-[#191512]">Revision history</h2>
                      </div>

                      <div className="mt-4 space-y-2">
                        {selected.revisions.length === 0 && (
                          <p className="text-xs text-[#938A82]">No revisions yet.</p>
                        )}
                        {selected.revisions.map((revision) => (
                          <div
                            key={revision.id}
                            className="flex items-center justify-between rounded-xl bg-[#FAF8F5] px-4 py-3 border border-[#F0EBE5]"
                          >
                            <div>
                              <p className="text-sm font-black text-[#191512]">
                                Revision {revision.revisionNumber}
                              </p>
                              <p className="mt-0.5 text-xs text-[#746E69]">
                                {revision.totalPlaces} places ·{" "}
                                {revision.status.replaceAll("_", " ")}
                              </p>
                            </div>
                            {revision.status === "DRAFT" && (
                              <button
                                onClick={submit}
                                disabled={busy}
                                className="flex items-center gap-1.5 rounded-xl bg-[#191512] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#2A2520] disabled:opacity-50"
                              >
                                <Send className="h-3.5 w-3.5" />
                                Submit
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Use on a fleet */}
                    <div className="rounded-2xl border border-[#E8E1DB] bg-white p-5 shadow-xs">
                      <h2 className="font-black text-[#191512]">Use on a fleet</h2>
                      <p className="mt-1 text-xs leading-5 text-[#746E69]">
                        Only published revisions can be assigned. Changing an existing fleet
                        creates a review request.
                      </p>

                      <label className="mt-4 block text-[10px] font-black uppercase tracking-widest text-[#938A82]">
                        Choose fleet
                        <select
                          value={fleetId}
                          onChange={(e) => setFleetId(e.target.value)}
                          className={INPUT}
                        >
                          <option value="">Select a fleet…</option>
                          {fleets.map((fleet) => (
                            <option key={fleet.fleetId} value={fleet.fleetId}>
                              {fleet.busName} · {fleet.busNumber}
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        onClick={assign}
                        disabled={
                          busy ||
                          !fleetId ||
                          !selected.revisions.some((r) => r.status === "PUBLISHED")
                        }
                        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] text-sm font-black text-white transition hover:bg-[#641715] disabled:opacity-40"
                      >
                        Assign published revision
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </section>
                )}
              </>
            ) : (
              /* Empty state — no layout selected */
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#DCD4CD] bg-white py-16 px-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF1EE]">
                  <LayoutTemplate className="h-6 w-6 text-[#7A1D1B]" />
                </div>
                <p className="mt-4 font-bold text-[#191512]">Choose a layout to begin</p>
                <p className="mt-1 max-w-xs text-xs text-[#938A82] leading-5">
                  Pick a Shuvmarg template from the left panel or start from one of your saved layouts.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── Toast message ──────────────────────────────────── */}
      {message && (
        <button
          onClick={() => setMessage(null)}
          className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl bg-[#191512] px-5 py-4 text-left text-sm font-semibold text-white shadow-2xl transition hover:bg-[#2A2520]"
        >
          {message}
          <span className="mt-1 block text-[10px] font-normal text-white/60">
            Click to dismiss
          </span>
        </button>
      )}
    </div>
  );
}

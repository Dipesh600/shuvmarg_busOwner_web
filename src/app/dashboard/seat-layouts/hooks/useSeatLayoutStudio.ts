"use client";

import { useEffect, useState } from "react";
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

export function useSeatLayoutStudio() {
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
        setLayout(detail.revisions.find((r) => r.layout)?.layout || null);
      })
      .catch((err) => {
        if (active) {
          setMessage(
            err instanceof Error ? err.message : "Unable to load layouts."
          );
        }
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
      setMessage(
        err instanceof Error ? err.message : "Unable to adopt template."
      );
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
      setMessage(
        "New immutable draft created. Existing fleet layouts are unchanged."
      );
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Unable to save revision."
      );
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
      if (current.assignment) {
        await requestFleetLayoutChange(fleetId, revision.id);
      } else {
        await assignFleetLayout(fleetId, revision.id);
      }
      setMessage(
        current.assignment
          ? "Fleet layout change sent for review. Current trips remain unchanged."
          : "Published layout assigned to the fleet."
      );
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Unable to assign fleet layout."
      );
    } finally {
      setBusy(false);
    }
  }

  return {
    catalog,
    mine,
    selected,
    layout,
    name,
    code,
    summary,
    busy,
    message,
    fleets,
    fleetId,
    setName,
    setCode,
    setSummary,
    setLayout,
    setMessage,
    setFleetId,
    choose,
    adopt,
    save,
    submit,
    assign,
  };
}

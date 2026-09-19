"use client";
import { useRef, useState } from "react";
import { PHOTO_VIEWS, validatePhotoFile, type PhotoFiles, type PhotoView } from "./photo-policy";
export type ReplacePhotos = (files: PhotoFiles) => Promise<void>;
const labels = { FRONT: "Front", SIDE: "Side", BACK: "Rear", INSIDE: "Interior" };
export function PhotoReplacement({ view, replace }: { view?: PhotoView; replace: ReplacePhotos }) {
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<PhotoFiles>({});
  const [busy, setBusy] = useState(false), [error, setError] = useState<string>();
  const [opened, setOpened] = useState(false);
  const ready = view ? Boolean(files[view]) : PHOTO_VIEWS.every(key => files[key]);
  function choose(next: File | undefined, key: PhotoView) {
    if (!next) return;
    const issue = validatePhotoFile(next); setError(issue || undefined);
    if (!issue) setFiles(previous => ({ ...previous, [key]: next }));
  }
  async function save() {
    if (!ready || busy) return;
    setBusy(true); setError(undefined);
    try { await replace(files); setFiles({}); setOpened(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to replace photos. Please retry."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-2 text-xs">
    <button type="button" disabled={busy} className="border rounded-lg px-3 py-2 font-bold cursor-pointer disabled:opacity-50" onClick={() => { if (view) input.current?.click(); else setOpened(!opened); }}>{busy ? "Saving photo…" : view ? "Replace image" : "Replace all photos"}</button>
    {view ? <input ref={input} type="file" className="hidden" aria-label={`Choose ${labels[view]} replacement photo`} accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" disabled={busy} onChange={event => { choose(event.target.files?.[0], view); event.target.value = ""; }} /> : opened && <div className="grid gap-3 sm:grid-cols-2 border rounded-lg p-3">{PHOTO_VIEWS.map(key => <label key={key} className="font-semibold">{labels[key]} photo<input type="file" className="block mt-1 w-full" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" disabled={busy} onChange={event => { choose(event.target.files?.[0], key); event.target.value = ""; }} />{files[key] && <span className="block mt-1 font-normal">{files[key]?.name}</span>}</label>)}</div>}
    {view && files[view] && <p>{files[view]?.name}</p>}
    {(view ? ready : opened) && <p>JPG, PNG, or WebP · Maximum 5 MB per photo. Replacements are scanned before saving.</p>}
    {ready && <div className="flex gap-3"><button type="button" disabled={busy} className="border rounded-lg px-3 py-2 font-bold cursor-pointer disabled:opacity-50" onClick={() => void save()}>Save {view ? "image" : "photos"}</button><button type="button" disabled={busy} className="underline cursor-pointer" onClick={() => { setFiles({}); setOpened(false); setError(undefined); }}>Cancel</button></div>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </div>;
}

"use client";
import { useRef, useState } from "react";
import { validateVideoFile } from "../../vehicle-documents/video-policy";
import SelectedVideoPreview from "../../vehicle-documents/SelectedVideoPreview";
export default function VideoUploadField({ file, disabled, onChange }: { file: File | null; disabled?: boolean; onChange: (file: File | null) => void }) {
  const [error, setError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  return <section className="rounded-xl border border-[#E8E1DB] bg-white p-4 space-y-3 lg:col-span-2">
    <h3 className="text-sm font-bold">Vehicle video (optional)</h3>
      <input ref={picker} type="file" aria-label="Choose registration video" className="hidden" accept="video/mp4,video/quicktime,.mp4,.mov" disabled={disabled} onChange={event => {
        const next = event.target.files?.[0]; event.target.value = ""; if (!next) return;
        const issue = validateVideoFile(next); setError(issue); if (!issue) onChange(next);
      }} />
    {file && <SelectedVideoPreview file={file} caption="Review before continuing" />}
    <p className="text-xs text-neutral-600">MP4 or MOV · Up to 20 MB · Maximum two minutes. Your video will be uploaded when you finish registration.</p>
    <div className="flex gap-3 items-center text-xs">
      <button type="button" disabled={disabled} className="border rounded-lg px-4 py-2 font-bold cursor-pointer disabled:opacity-50" onClick={() => picker.current?.click()}>{file ? "Change video" : "Add video"}</button>
      {file && !disabled && <button type="button" className="underline cursor-pointer" onClick={() => { onChange(null); setError(null); }}>Remove video</button>}
    </div>
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
  </section>;
}

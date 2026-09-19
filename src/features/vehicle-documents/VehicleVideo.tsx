/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useRef, useState } from "react";
import { documentBlobCache } from "./blob-cache";
import SelectedVideoPreview from "./SelectedVideoPreview";
import { validateVideoFile } from "./video-policy";
export interface VideoDescriptor {
  present?: boolean; fileVersion?: string | null; uploadedAt?: string | null;
  processingStatus?: string; processingError?: string | null;
  size?: number | null; duration?: number | null; width?: number | null; height?: number | null;
}
interface Props {
  descriptor: VideoDescriptor; scope: string; path: string;
  loadFile: (path: string) => Promise<Blob>; loadStatus: () => Promise<VideoDescriptor>;
  uploadVideo: (file: File) => Promise<VideoDescriptor>; onRefresh: () => void;
}
function PlayableVideo({ descriptor, scope, path, loadFile }: Pick<Props, "descriptor" | "scope" | "path" | "loadFile">) {
  const [poster, setPoster] = useState<string>();
  const [video, setVideo] = useState<string>();
  const [loading, setLoading] = useState(false), [error, setError] = useState<string>();
  const [requested, request] = useState(0);
  const version = descriptor.fileVersion || null;
  useEffect(() => {
    let active = true; const urls: string[] = [];
    const clear = () => { active = false; urls.forEach(url => URL.revokeObjectURL(url)); setPoster(undefined); setVideo(undefined); setError("Session changed. Reopen this vehicle."); };
    window.addEventListener("vehicle-documents-cleared", clear);
    const fetchFile = (kind: string) => {
      const url = `${path}/${kind}?version=${encodeURIComponent(version || "")}`;
      return documentBlobCache.get(scope, url, version, () => loadFile(url));
    };
    if (version) void fetchFile("poster").then(blob => {
      if (active) { const url = URL.createObjectURL(blob); urls.push(url); setPoster(url); }
    }).catch(() => { /* Poster failure must not prevent playback or upload. */ });
    if (version && requested) void fetchFile("view").then(blob => {
      if (active) { const url = URL.createObjectURL(blob); urls.push(url); setVideo(url); setLoading(false); setError(undefined); }
    }).catch(cause => { if (active) { setError(cause instanceof Error ? cause.message : "Unable to load video."); setLoading(false); } });
    return () => { active = false; urls.forEach(url => URL.revokeObjectURL(url)); window.removeEventListener("vehicle-documents-cleared", clear); };
  }, [scope, path, version, loadFile, requested]);
  return <div className="space-y-3">
    {video ? <video controls autoPlay playsInline preload="none" poster={poster} src={video} className="w-full max-h-96 rounded-lg bg-black" onError={() => setError("Your browser could not play this video. Download it to view.")} /> : <div className="relative rounded-lg overflow-hidden bg-neutral-100">
      {poster && <img src={poster} alt="Vehicle video poster" className="w-full h-52 object-contain" />}
      <button type="button" disabled={loading} className="m-4 border rounded-lg px-4 py-2 text-sm font-bold" onClick={() => { setLoading(true); request(requested + 1); }}>{loading ? "Loading video…" : error ? "Retry video" : "Play video"}</button>
    </div>}
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    {video && <a href={video} download="vehicle.mp4" className="text-xs underline">Download video</a>}
    <p className="text-xs">{descriptor.duration ? `${Math.round(descriptor.duration)} seconds` : "Processed video"}{descriptor.size ? ` · ${(descriptor.size / 1_000_000).toFixed(1)} MB` : ""}</p>
  </div>;
}
export default function VehicleVideo({ descriptor, scope, path, loadFile, loadStatus, uploadVideo, onRefresh }: Props) {
  const [submitted, setSubmitted] = useState<{ value: VideoDescriptor; baseKey: string } | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false), [error, setError] = useState<string>();
  const [statusError, setStatusError] = useState<string>();
  const descriptorKey = JSON.stringify(descriptor);
  const current = submitted?.baseKey === descriptorKey ? submitted.value : descriptor;
  const processing = ["UPLOADING", "QUEUED", "PROCESSING"].includes(current.processingStatus || "");
  useEffect(() => {
    if (!processing) return;
    let active = true, timer: ReturnType<typeof setTimeout>, attempts = 0;
    async function check() {
      try {
        const next = await loadStatus();
        if (!active) return;
        setSubmitted({ value: next, baseKey: descriptorKey }); setStatusError(undefined);
        if (!["UPLOADING", "QUEUED", "PROCESSING"].includes(next.processingStatus || "")) { onRefresh(); return; }
      } catch { if (active) setStatusError("Unable to check processing. Refresh details to check again."); }
      if (active && ++attempts < 12) timer = setTimeout(check, Math.min(60000, 15000 * Math.pow(2, Math.floor(attempts / 3))));
    }
    timer = setTimeout(check, 15000);
    return () => { active = false; clearTimeout(timer); };
  }, [processing, loadStatus, onRefresh, descriptorKey]);
  async function upload() {
    if (!file || uploading || processing) return;
    setUploading(true); setError(undefined);
    try { setSubmitted({ value: await uploadVideo(file), baseKey: descriptorKey }); setFile(null); onRefresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Upload failed. Please retry."); }
    finally { setUploading(false); }
  }
  return <section className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3 text-neutral-900">
    <h3 className="font-bold text-sm">Vehicle video</h3>
    {!file && (current.present ? <PlayableVideo key={`${scope}:${current.fileVersion}`} descriptor={current} scope={scope} path={path} loadFile={loadFile} /> : <p className="text-xs">No vehicle video uploaded.</p>)}
    {processing && <p role="status" className="text-xs">Video security scanning and processing are pending. {current.present ? "Your current video remains available." : "It will appear when processing succeeds."}</p>}
    {current.processingError && <p className="text-xs text-red-700">{current.processingError}</p>}
    {statusError && <p className="text-xs text-red-700">{statusError}</p>}
    <input ref={picker} type="file" aria-label="Choose vehicle video" accept="video/mp4,video/quicktime,.mp4,.mov" disabled={processing || uploading} className="hidden" onChange={event => {
      const next = event.target.files?.[0]; event.target.value = "";
      if (!next) return;
      const invalid = validateVideoFile(next); setError(invalid || undefined);
      if (!invalid) setFile(next);
    }} />
    {file && <>
      <SelectedVideoPreview file={file} />
      {current.present && <p className="text-xs">Your current video stays available until the replacement is ready.</p>}
    </>}
    <p className="text-xs opacity-75">Optional · MP4 or MOV · Up to 20 MB · Maximum two minutes.</p>
    <div className="flex flex-wrap items-center gap-3">
      {file ? <>
        <button type="button" disabled={processing || uploading} onClick={() => { void upload(); }} className="bg-[#7A1D1B] text-white hover:bg-[#5C1414] rounded-lg px-4 py-2 text-xs font-bold cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-50">{uploading ? "Saving video…" : "Save video"}</button>
        <button type="button" disabled={processing || uploading} onClick={() => picker.current?.click()} className="border rounded-lg px-4 py-2 text-xs font-bold cursor-pointer disabled:opacity-50">Change video</button>
        <button type="button" disabled={uploading} onClick={() => { setFile(null); setError(undefined); }} className="text-xs underline cursor-pointer disabled:opacity-50">Cancel</button>
      </> : <button type="button" disabled={processing || uploading} onClick={() => picker.current?.click()} className="bg-[#7A1D1B] text-white hover:bg-[#5C1414] rounded-lg px-4 py-2 text-xs font-bold cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-50">{current.present ? "Replace video" : "Upload video"}</button>}
    </div>
    {uploading && <p role="status" className="text-xs">Saving your video. Please keep this page open.</p>}
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
  </section>;
}

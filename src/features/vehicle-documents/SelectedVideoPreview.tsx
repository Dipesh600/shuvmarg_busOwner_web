"use client";

import { useEffect, useRef, useState } from "react";

export default function SelectedVideoPreview({ file, caption = "Preview before saving" }: { file: File; caption?: string }) {
  const player = useRef<HTMLVideoElement>(null);
  const [unsupportedFile, setUnsupportedFile] = useState<File | null>(null);

  useEffect(() => {
    const element = player.current;
    if (!element) return;
    const url = URL.createObjectURL(file);
    element.src = url;
    return () => {
      element.pause();
      element.removeAttribute("src");
      element.load();
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return <div className="space-y-3 rounded-xl border p-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h4 className="text-sm font-bold">Video preview</h4>
      <span className="rounded-full border px-2 py-1 text-xs">Not saved yet</span>
    </div>
    <video ref={player} controls playsInline preload="metadata" aria-label="Selected vehicle video preview" className="w-full max-h-96 rounded-lg bg-black" onError={() => setUnsupportedFile(file)} onLoadedMetadata={() => setUnsupportedFile(null)} />
    <div className="text-xs space-y-1">
      <p className="font-semibold break-all">{file.name}</p>
      <p className="opacity-75">{(file.size / 1_000_000).toFixed(1)} MB · {caption}</p>
    </div>
    {unsupportedFile === file && <p role="status" className="text-xs">Your browser cannot preview this format. You can still save the video, or choose another file.</p>}
  </div>;
}

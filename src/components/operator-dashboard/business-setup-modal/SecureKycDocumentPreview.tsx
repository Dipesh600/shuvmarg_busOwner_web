"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ExternalLink, FileWarning, LoaderCircle, X } from "lucide-react";
import { authFetch } from "@/lib/auth";

const PREVIEWABLE_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const pendingPreviewRequests = new Map<string, Promise<Blob>>();

function fetchProtectedDocument(path: string): Promise<Blob> {
  const existing = pendingPreviewRequests.get(path);
  if (existing) return existing;

  const request = authFetch(path)
    .then(async (response) => {
      if (!response.ok) throw new Error("preview request failed");
      const blob = await response.blob();
      if (!PREVIEWABLE_TYPES.has(blob.type)) throw new Error("unsafe preview type");
      return blob;
    })
    .finally(() => pendingPreviewRequests.delete(path));

  pendingPreviewRequests.set(path, request);
  return request;
}

interface SecureKycDocumentPreviewProps {
  ownerId: string;
  documentType: string;
  label: string;
  fileCount: number;
  onClose: () => void;
}

function buildPreviewPath(ownerId: string, documentType: string, index: number) {
  const params = new URLSearchParams({ busOwnerId: ownerId, documentType });
  if (documentType === "insuranceCertificates") {
    params.set("certificateIndex", String(index));
    params.set("fileIndex", "0");
  } else {
    params.set("fileIndex", String(index));
  }
  return `/busowner/kycDocumentView?${params.toString()}`;
}

export default function SecureKycDocumentPreview({ ownerId, documentType, label, fileCount, onClose }: SecureKycDocumentPreviewProps) {
  const [index, setIndex] = useState(0);
  const [preview, setPreview] = useState<{ path: string; blobUrl: string | null; mediaType: string | null; error: string }>({ path: "", blobUrl: null, mediaType: null, error: "" });
  const safeFileCount = Math.max(1, fileCount);
  const previewPath = useMemo(() => buildPreviewPath(ownerId, documentType, index), [ownerId, documentType, index]);
  const activePreview = preview.path === previewPath ? preview : null;
  const blobUrl = activePreview?.blobUrl || null;
  const mediaType = activePreview?.mediaType || null;
  const error = activePreview?.error || "";

  useEffect(() => {
    let cancelled = false;
    let currentUrl: string | null = null;
    void (async () => {
      try {
        const blob = await fetchProtectedDocument(previewPath);
        currentUrl = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(currentUrl);
          return;
        }
        setPreview({ path: previewPath, blobUrl: currentUrl, mediaType: blob.type, error: "" });
      } catch {
        if (!cancelled) setPreview({ path: previewPath, blobUrl: null, mediaType: null, error: "This document could not be previewed securely. Please try again." });
      }
    })();

    return () => {
      cancelled = true;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [previewPath]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-[#1A1210]/65 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-labelledby="secure-document-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="flex h-[88svh] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-[#E5DDD7] bg-[#F7F3F0] shadow-2xl">
        <header className="flex items-center justify-between gap-4 border-b border-[#E7DED8] bg-white px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#7A1D1B]">Secure document preview</div>
            <h3 id="secure-document-title" className="truncate text-sm font-bold text-[#241E1A]">{label}</h3>
          </div>
          <div className="flex items-center gap-2">
            {safeFileCount > 1 && <span className="rounded-lg bg-[#F4EFEB] px-2.5 py-1.5 text-[10px] font-bold text-[#6E655F]">{index + 1} of {safeFileCount}</span>}
            <button type="button" onClick={() => blobUrl && window.open(blobUrl, "_blank", "noopener,noreferrer")} disabled={!blobUrl} className="inline-flex items-center gap-1.5 rounded-xl border border-[#DDD4CE] bg-white px-3 py-2 text-[10px] font-bold text-[#7A1D1B] transition hover:bg-[#FFF3F0] disabled:cursor-not-allowed disabled:opacity-40"><ExternalLink className="h-3.5 w-3.5" />Open in tab</button>
            <button type="button" onClick={onClose} className="rounded-xl border border-[#DDD4CE] bg-white p-2 text-[#655D57] transition hover:bg-[#F7F2EF]" aria-label="Close document preview"><X className="h-4 w-4" /></button>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 overflow-hidden p-3 sm:p-4">
          <div className="flex h-full items-center justify-center overflow-hidden rounded-2xl border border-[#E2D9D3] bg-white shadow-sm">
            {!blobUrl && !error && <div className="flex flex-col items-center gap-3 text-[#7A1D1B]"><LoaderCircle className="h-7 w-7 animate-spin" /><span className="text-[11px] font-semibold text-[#766D67]">Preparing protected preview…</span></div>}
            {error && <div className="mx-6 flex max-w-sm flex-col items-center text-center"><div className="rounded-full bg-red-50 p-3 text-red-700"><FileWarning className="h-6 w-6" /></div><p className="mt-3 text-xs font-bold text-[#342B27]">Preview unavailable</p><p className="mt-1 text-[11px] leading-relaxed text-[#7A716B]">{error}</p></div>}
            {blobUrl && mediaType === "application/pdf" && <iframe src={blobUrl} title={`${label} preview`} referrerPolicy="no-referrer" className="h-full w-full border-0" />}
            {blobUrl && mediaType !== "application/pdf" && <Image src={blobUrl} alt={`${label} preview`} width={1600} height={1200} unoptimized className="h-full w-full object-contain p-2" />}
          </div>

          {safeFileCount > 1 && <div className="pointer-events-none absolute inset-x-6 top-1/2 flex -translate-y-1/2 justify-between"><button type="button" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0} className="pointer-events-auto rounded-full border border-[#D8CEC7] bg-white/95 p-2.5 text-[#7A1D1B] shadow-lg transition hover:bg-[#FFF3F0] disabled:invisible" aria-label="Previous document"><ChevronLeft className="h-5 w-5" /></button><button type="button" onClick={() => setIndex((value) => Math.min(safeFileCount - 1, value + 1))} disabled={index >= safeFileCount - 1} className="pointer-events-auto rounded-full border border-[#D8CEC7] bg-white/95 p-2.5 text-[#7A1D1B] shadow-lg transition hover:bg-[#FFF3F0] disabled:invisible" aria-label="Next document"><ChevronRight className="h-5 w-5" /></button></div>}
        </div>

        <footer className="border-t border-[#E7DED8] bg-white px-4 py-2.5 text-[9px] font-medium text-[#817872] sm:px-5">Protected preview · the storage address is never shared with this browser.</footer>
      </div>
    </div>
  );
}

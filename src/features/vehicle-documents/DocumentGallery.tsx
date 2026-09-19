// Authenticated blob URLs are already local and must bypass the remote image optimizer.
/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useRef, useState } from "react";
import { PhotoReplacement } from "./PhotoReplacement";
import { PHOTO_VIEWS, type PhotoFiles, type PhotoView } from "./photo-policy";
import VehicleVideo, { type VideoDescriptor } from "./VehicleVideo";
import { documentBlobCache } from "./blob-cache";

export interface FileDescriptor {
  present?: boolean;
  status?: string;
  reason?: string | null;
  validTill?: string | null;
  policyNumber?: string | null;
  uploadedAt?: string | null;
  fileVersion?: string | null;
  images?: Array<{
    imageId?: string | null;
    index?: number;
    view?: string | null;
    uploadedAt?: string | null;
    fileVersion?: string | null;
  }>;
}
export type DocumentManifest = Partial<Record<"fleetImages" | "fitnessCert" | "insurance" | "bluebook" | "routePermit" | "vehicleVideo", FileDescriptor & VideoDescriptor>>;
interface FileItem { title: string; path: string; version: string | null; descriptor: FileDescriptor; view?: PhotoView }

function PreviewDialog({ title, url, pdf, onClose }: { title: string; url: string; pdf: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => previous?.focus();
  }, []);
  return (
    <div className="fixed inset-0 z-[100] bg-black/70 p-4 sm:p-8 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div ref={dialog} className="bg-white rounded-xl p-4 w-full max-w-5xl h-[85vh] flex flex-col" onClick={event => event.stopPropagation()} onKeyDown={event => {
        if (event.key === "Escape") onClose();
        if (event.key === "Tab") {
          const controls = dialog.current?.querySelectorAll<HTMLElement>("button, iframe");
          if (!controls?.length) return;
          const first = controls[0], last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      }}>
        <div className="flex justify-between items-center pb-3">
          <h2 className="font-bold">{title}</h2>
          <button className="border rounded-lg px-4 py-2 text-sm" onClick={onClose}>Close preview</button>
        </div>
        {pdf ? <iframe title={title} src={url} className="w-full flex-1 border rounded-lg" /> : <img src={url} alt={title} className="w-full min-h-0 flex-1 object-contain" />}
      </div>
    </div>
  );
}

function FilePreview({ item, scope, loadFile, replacePhotos }: { item: FileItem; scope: string; loadFile: (path: string) => Promise<Blob>; replacePhotos?: (files: PhotoFiles) => Promise<void> }) {
  const [state, setState] = useState<{ url?: string; type?: string; error?: string }>({});
  const [expanded, setExpanded] = useState(false);
  const [retry, setRetry] = useState(0);
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const [openedAt] = useState(() => Date.now());
  useEffect(() => {
    let active = true, url: string | null = null;
    const clear = () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
      setState({ error: "Session changed. Reopen this vehicle." });
    };
    window.addEventListener("vehicle-documents-cleared", clear);
    void documentBlobCache.get(scope, item.path, item.version, () => loadFile(item.path)).then(blob => {
      if (!active) return;
      url = URL.createObjectURL(blob);
      setState({ url, type: blob.type });
    }).catch(cause => {
      if (active) setState({ error: cause instanceof Error ? cause.message : "Unable to load this file." });
    });
    return () => {
      active = false;
      window.removeEventListener("vehicle-documents-cleared", clear);
      if (url) URL.revokeObjectURL(url);
    };
  }, [scope, item.path, item.version, loadFile, retry]);
  const pdf = state.type === "application/pdf";
  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3 text-neutral-900">
      <div>
        <h3 className="font-bold text-sm">{item.title}</h3>
        <p className="text-xs mt-1">{item.descriptor.status?.replaceAll("_", " ") || "Review status unavailable"}</p>
        {item.descriptor.reason && <p className="text-xs text-red-700 mt-1">{item.descriptor.reason}</p>}
        {item.descriptor.validTill && <p className="text-xs mt-1">Expiry: {item.descriptor.validTill.slice(0, 10)}{Date.parse(item.descriptor.validTill) < openedAt ? " · Expired" : ""}</p>}
        {item.descriptor.policyNumber && <p className="text-xs mt-1">Policy: {item.descriptor.policyNumber}</p>}
      </div>
      {state.error ? (
        <div role="alert">
          <p className="text-xs text-red-700">{state.error}</p>
          <button className="text-xs underline mt-2" onClick={() => setRetry(retry + 1)}>Retry file</button>
        </div>
      ) : !state.url ? <p role="status" className="text-xs">Loading file…</p> : (
        <>
          {imageUnavailable ? <p className="text-xs">Your browser cannot preview this image format. Download it to view.</p> : (
            <button className="w-full rounded-lg overflow-hidden border border-neutral-200" onClick={() => setExpanded(true)} aria-label={`Preview ${item.title}`}>
              {pdf ? <span className="block p-10 text-sm font-bold">PDF · Open preview</span> : <img src={state.url} alt={item.title} onError={() => setImageUnavailable(true)} className="h-44 w-full object-contain bg-neutral-50" />}
            </button>
          )}
          <div className="flex gap-4 text-xs">
            {!imageUnavailable && <button className="underline" onClick={() => setExpanded(true)}>View</button>}
            <a href={state.url} download={`${item.title}.${pdf ? "pdf" : state.type?.split("/")[1] || "bin"}`} className="underline">Download</a>
          </div>
        </>
      )}
      {item.view && replacePhotos && <PhotoReplacement view={item.view} replace={replacePhotos} />}
      {expanded && state.url && <PreviewDialog title={item.title} url={state.url} pdf={pdf} onClose={() => setExpanded(false)} />}
    </article>
  );
}

const legal = [["fitnessCert", "Fitness certificate"], ["insurance", "Vehicle insurance"], ["bluebook", "Bluebook"], ["routePermit", "Route permit"]] as const;
export default function DocumentGallery({ manifest, fleetId, scope, basePath, loadFile, onRefresh, loadVideoStatus, uploadVideo, uploadPhotos }: {
  manifest: DocumentManifest; fleetId: string; scope: string | null; basePath: string;
  loadFile: (path: string) => Promise<Blob>; onRefresh: () => void;
  loadVideoStatus: () => Promise<VideoDescriptor>; uploadVideo: (file: File) => Promise<VideoDescriptor>;
  uploadPhotos: (files: PhotoFiles) => Promise<FileDescriptor>;
}) {
  const [replacement, setReplacement] = useState<{ descriptor: FileDescriptor; baseKey: string } | null>(null);
  const photoKey = JSON.stringify(manifest.fleetImages);
  const photo = replacement?.baseKey === photoKey ? replacement.descriptor : manifest.fleetImages;
  const replacePhotos = async (files: PhotoFiles) => {
    setReplacement({ descriptor: await uploadPhotos(files), baseKey: photoKey });
    onRefresh();
  };
  const canReplaceOne = photo?.images?.length === 4 && PHOTO_VIEWS.every(view => photo.images?.some(image => image.view === view && image.imageId));
  const photos: FileItem[] = (photo?.images || []).map((image, index) => {
    const version = image.fileVersion || image.uploadedAt || null;
    const query = new URLSearchParams(image.imageId ? { imageId: image.imageId } : { imageIndex: String(image.index ?? index) });
    if (version) query.set("version", version);
    const label = ({ FRONT: "Front", BACK: "Rear", SIDE: "Side", INSIDE: "Interior" } as Record<string, string>)[image.view?.toUpperCase() || ""] || `Photo ${index + 1}`;
    return { title: `${label} vehicle photo`, path: `${basePath}/${encodeURIComponent(fleetId)}/documents/fleetImages/view?${query}`, version, descriptor: photo || {}, view: canReplaceOne ? image.view as PhotoView : undefined };
  });
  if (!scope) return <p className="text-sm">Sign in to view vehicle documents.</p>;
  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-lg">Vehicle documents & media</h2>
          <p className="text-xs mt-1">Registration uploads and their recorded review status.</p>
        </div>
        <button className="border rounded-lg px-3 py-2 text-xs font-bold" onClick={onRefresh}>Refresh details</button>
      </header>
      <VehicleVideo key={`${scope}:${fleetId}`} descriptor={manifest.vehicleVideo || {}} scope={scope} path={`${basePath}/${encodeURIComponent(fleetId)}/video`} loadFile={loadFile} loadStatus={loadVideoStatus} uploadVideo={uploadVideo} onRefresh={onRefresh} />
      <div>
        <h3 className="font-bold text-sm mb-3">Vehicle photos</h3>
        {photos.length ? <div className="grid gap-4 sm:grid-cols-2">{photos.map(item => <FilePreview key={`${scope}:${item.path}`} item={item} scope={scope} loadFile={loadFile} replacePhotos={replacePhotos} />)}</div> : <p className="text-sm">Vehicle photos: Not uploaded.</p>}
        <div className="mt-3"><PhotoReplacement replace={replacePhotos} /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {legal.map(([slot, title]) => {
          const descriptor = manifest[slot];
          if (!descriptor?.present) return (
            <article key={slot} className="border border-neutral-200 rounded-xl p-4">
              <h3 className="text-sm font-bold">{title}</h3><p className="text-xs mt-2">Not uploaded.</p>
            </article>
          );
          const version = descriptor.fileVersion || descriptor.uploadedAt || null;
          const path = `${basePath}/${encodeURIComponent(fleetId)}/documents/${slot}/view${version ? `?version=${encodeURIComponent(version)}` : ""}`;
          return <FilePreview key={`${scope}:${path}`} item={{ title, path, version, descriptor }} scope={scope} loadFile={loadFile} />;
        })}
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, FileText, Trash2, Upload } from "lucide-react";
import type { KycDocumentField } from "@/features/operator-dashboard/business-verification-draft-storage";
import type { KycDocumentDescriptor } from "@/features/operator-dashboard/operator-dashboard-contract";

export function DocumentPicker({
  field, label, hint, required, multiple, files, existingDocument, onSelect, onRemove,
}: {
  field: KycDocumentField;
  label: string;
  hint: string;
  required: boolean;
  multiple?: boolean;
  files: File[];
  existingDocument?: KycDocumentDescriptor;
  onSelect: (field: KycDocumentField, files: File[]) => void;
  onRemove: (field: KycDocumentField, index: number) => void;
}) {
  const retained = Boolean(existingDocument?.uploaded && !existingDocument.rejectionReason && files.length === 0);
  const complete = files.length > 0 || retained;
  return (
    <section className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#E8E1DB] bg-white">
      <div className="flex items-center gap-2.5 border-b border-[#EEE7E2] px-3.5 py-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${complete ? "bg-emerald-50 text-[#2E7D32]" : existingDocument?.rejectionReason ? "bg-red-50 text-red-700" : "bg-[#FFF1EE] text-[#7A1D1B]"}`}>
          {complete ? <Check className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#211D1A]">{label}{required && <span className="text-[#D96861]">*</span>}</div>
          <p className="mt-0.5 text-[9px] font-medium text-[#8A837D]">{hint}</p>
        </div>
        <label className="cursor-pointer whitespace-nowrap rounded-lg border border-[#DED7D1] bg-white px-2.5 py-1.5 text-[9px] font-bold text-[#6E6761] transition hover:border-[#C9AAA4] hover:text-[#7A1D1B]">
          {files.length > 0 || retained ? "Replace" : existingDocument?.rejectionReason ? "Add update" : "Choose file"}
          <input className="sr-only" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" multiple={multiple} onChange={(event) => { onSelect(field, Array.from(event.target.files || [])); event.target.value = ""; }} />
        </label>
      </div>
      {files.length > 0 ? (
        <div className="grid flex-1 gap-2.5 bg-[#FCFAF8] p-3">
          {files.map((file, index) => <DocumentFilePreview key={`${file.name}-${file.size}-${file.lastModified}-${index}`} file={file} onRemove={() => onRemove(field, index)} />)}
        </div>
      ) : retained ? (
        <div className="flex flex-1 items-center gap-2 bg-emerald-50/40 px-3.5 py-4 text-[9px] font-bold text-emerald-800"><Check className="h-3.5 w-3.5" />Previously submitted file will be retained.</div>
      ) : existingDocument?.rejectionReason ? (
        <div className="flex flex-1 flex-col justify-center bg-red-50/50 px-3.5 py-4"><div className="text-[9px] font-bold text-red-700">Replacement required</div><p className="mt-1 text-[9px] font-medium leading-relaxed text-red-700">{existingDocument.rejectionReason}</p></div>
      ) : <div className="flex flex-1 items-center px-3.5 py-4 text-[9px] font-semibold text-[#9A928C]">No file selected. This requirement is not complete.</div>}
    </section>
  );
}

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentImagePreview({ file, large = false }: { file: File; large?: boolean }) {
  const [source, setSource] = useState("");
  useEffect(() => {
    let active = true;
    const reader = new FileReader();
    reader.onload = () => { if (active && typeof reader.result === "string") setSource(reader.result); };
    reader.readAsDataURL(file);
    return () => { active = false; reader.abort(); };
  }, [file]);
  return source ? <Image src={source} alt={`Local preview of ${file.name}`} width={120} height={96} unoptimized className={large ? "h-32 w-full rounded-xl border border-[#E4DDD7] bg-white object-cover" : "h-20 w-24 rounded-xl border border-[#E4DDD7] bg-white object-cover"} /> : <div className={large ? "h-32 w-full animate-pulse rounded-xl bg-[#EEE8E3]" : "h-20 w-24 animate-pulse rounded-xl bg-[#EEE8E3]"} />;
}

function DocumentFilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImage = file.type === "image/jpeg" || file.type === "image/png";
  return (
    <article className="flex min-w-0 items-center gap-3 rounded-xl border border-[#E7DFD9] bg-white p-2.5">
      {isImage ? <DocumentImagePreview file={file} /> : <div className="flex h-20 w-24 shrink-0 flex-col items-center justify-center rounded-xl border border-[#E4DDD7] bg-[#FFF5F2] text-[#7A1D1B]"><FileText className="h-6 w-6" /><span className="mt-1 text-[8px] font-extrabold">PDF</span></div>}
      <div className="min-w-0 flex-1"><p className="truncate text-[10px] font-bold text-[#2D2723]" title={file.name}>{file.name}</p><p className="mt-1 text-[8px] font-semibold text-[#8A837D]">{formatFileSize(file.size)} · Device draft</p></div>
      <button type="button" onClick={onRemove} className="rounded-lg p-2 text-[#9A928C] transition hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${file.name}`}><Trash2 className="h-3.5 w-3.5" /></button>
    </article>
  );
}

export function ReviewDocumentPreview({ file }: { file: File }) {
  const isImage = file.type === "image/jpeg" || file.type === "image/png";
  return <div className="overflow-hidden rounded-xl border border-[#E4DDD7] bg-[#FCFAF8]" aria-label={`Preview of ${file.name}`} title={file.name}>{isImage ? <DocumentImagePreview file={file} large /> : <div className="flex h-32 items-center justify-center bg-[#FFF5F2] text-[#7A1D1B]"><FileText className="h-9 w-9" /></div>}</div>;
}

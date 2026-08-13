"use client";

import { useEffect, useState } from "react";
import {
  Camera,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Image as ImageIcon,
  Maximize2,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ImageLightboxModal({
  isOpen,
  onClose,
  src,
  title,
  fileName,
  fileSize,
}: {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  title: string;
  fileName: string;
  fileSize: number;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${title}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] max-w-4xl flex-col overflow-hidden rounded-2xl bg-[#191512] text-white shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#7A1D1B] text-white">
              <ImageIcon className="size-4" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-white">{title}</h3>
              <p className="truncate text-[11px] text-stone-300">
                {fileName} • {formatFileSize(fileSize)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={src}
              download={fileName}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
              title="Download original image"
            >
              <Download className="size-3.5" />
              Download
            </a>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-stone-300 transition hover:bg-white/20 hover:text-white"
              title="Close preview (Esc)"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="flex max-h-[75vh] items-center justify-center overflow-auto bg-stone-950 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={title}
            className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain shadow-md"
          />
        </div>
      </div>
    </div>
  );
}

function ImagePreview({
  file,
  label,
  accept,
  multiple,
  onChange,
  onRemove,
}: {
  file: File;
  label: string;
  accept?: string;
  multiple?: boolean;
  onChange: (files: File[]) => void;
  onRemove: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const reader = new FileReader();
    reader.onload = () => {
      if (active && typeof reader.result === "string") {
        setPreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
    return () => {
      active = false;
    };
  }, [file]);

  return (
    <>
      <div className="group relative mt-3 h-48 w-full overflow-hidden rounded-xl border border-[#E8E1DB] bg-[#FAF8F5]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl || undefined}
          alt={label}
          onClick={() => setIsModalOpen(true)}
          className="h-full w-full cursor-pointer object-cover transition duration-300 group-hover:scale-105"
        />

        {/* Top file info badge */}
        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-lg bg-black/65 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-xs">
          <ImageIcon className="size-3" />
          <span className="max-w-[120px] truncate">{file.name}</span>
          <span className="opacity-70">({formatFileSize(file.size)})</span>
        </div>

        {/* Center Hover Overlay: View Full Photo */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 backdrop-blur-[2px] transition duration-200 group-hover:opacity-100"
        >
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-[#191512] shadow-lg transition hover:scale-105">
            <Maximize2 className="size-3.5 text-[#7A1D1B]" />
            View Photo
          </span>
        </button>

        {/* Bottom Actions Overlay */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[#211D1A] shadow-xs backdrop-blur-xs transition hover:bg-white"
            >
              <Eye className="size-3 text-[#7A1D1B]" />
              View
            </button>

            <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[#211D1A] shadow-xs backdrop-blur-xs transition hover:bg-white">
              <RefreshCw className="size-3 text-[#7A1D1B]" />
              Change
              <input
                className="sr-only"
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={(e) => onChange(Array.from(e.target.files || []))}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={onRemove}
            title="Remove photo"
            className="flex size-7 items-center justify-center rounded-lg bg-red-600/90 text-white transition hover:bg-red-700 shadow-xs"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {previewUrl && (
        <ImageLightboxModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          src={previewUrl}
          title={label}
          fileName={file.name}
          fileSize={file.size}
        />
      )}
    </>
  );
}

export default function UploadCard({
  label,
  description,
  files,
  multiple = false,
  accept = "application/pdf,image/jpeg,image/png,image/webp",
  onChange,
  children,
}: {
  label: string;
  description?: string;
  files: File[];
  multiple?: boolean;
  accept?: string;
  onChange: (files: File[]) => void;
  children?: React.ReactNode;
}) {
  const file = files[0] || null;
  const isImage = file && file.type.startsWith("image/");

  const handleViewDocument = () => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#E8E1DB] bg-[#FFFCFA] p-4 shadow-2xs transition hover:border-[#D6CBC4]">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-black text-[#211D1A]">{label}</p>
            {description && <p className="mt-0.5 text-[11px] text-[#746E69]">{description}</p>}
          </div>
          {files.length > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <FileCheck2 className="size-3" />
              Uploaded
            </span>
          ) : (
            <span className="text-[10px] font-bold text-[#938A82]">Required</span>
          )}
        </div>

        {/* Content: Image Preview or File Info or Upload Area */}
        {file && isImage ? (
          <ImagePreview
            file={file}
            label={label}
            accept={accept}
            multiple={multiple}
            onChange={onChange}
            onRemove={() => onChange([])}
          />
        ) : file ? (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-[#E8E1DB] bg-white p-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#FFF1EE] text-[#7A1D1B]">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-[#191512]">{file.name}</p>
                <p className="text-[10px] text-[#746E69]">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleViewDocument}
                title="View document in new tab"
                className="flex size-7 items-center justify-center rounded-lg text-[#7A1D1B] hover:bg-[#FFF1EE] transition"
              >
                <Eye className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onChange([])}
                title="Remove document"
                className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[#938A82] hover:bg-red-50 hover:text-red-700 transition"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <label
            className={cn(
              "mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#D6CBC4] bg-white px-4 py-8 text-center transition",
              "hover:border-[#7A1D1B] hover:bg-[#FFF8F7]"
            )}
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-[#FFF1EE] text-[#7A1D1B]">
              <Camera className="size-5" />
            </div>
            <p className="mt-2 text-xs font-bold text-[#7A1D1B]">
              <Upload className="mr-1 inline-block size-3.5" />
              Upload {multiple ? "photos" : "photo"}
            </p>
            <p className="mt-1 text-[10px] text-[#938A82]">JPG, PNG or WEBP up to 10MB</p>
            <input
              className="sr-only"
              type="file"
              accept={accept}
              multiple={multiple}
              onChange={(event) => onChange(Array.from(event.target.files || []))}
            />
          </label>
        )}
      </div>

      {children && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}

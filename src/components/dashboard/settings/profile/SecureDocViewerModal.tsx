"use client";

import React, { useState, useEffect } from "react";
import { FileText, X, ExternalLink, Loader2 } from "lucide-react";
import { authFetch } from "@/lib/auth";

export const blobCache = new Map<string, string>();
export const pendingFetches = new Map<string, Promise<string>>();

interface SecureDocMediaProps {
  url: string;
  alt: string;
  className?: string;
  type?: "img" | "iframe";
}

export function SecureDocMedia({
  url,
  alt,
  className,
  type = "img",
}: SecureDocMediaProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let revoked = false;

    if (blobCache.has(url)) {
      setBlobUrl(blobCache.get(url)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    setBlobUrl(null);

    let fetchPromise = pendingFetches.get(url);
    if (!fetchPromise) {
      fetchPromise = authFetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`${res.status}`);
          return res.blob();
        })
        .then((blob) => {
          const objectUrl = URL.createObjectURL(blob);
          blobCache.set(url, objectUrl);
          return objectUrl;
        });
      pendingFetches.set(url, fetchPromise);

      fetchPromise.finally(() => {
        pendingFetches.delete(url);
      });
    }

    fetchPromise
      .then((objectUrl) => {
        if (revoked) return;
        setBlobUrl(objectUrl);
        setLoading(false);
      })
      .catch((err) => {
        if (!revoked) {
          console.error("Failed to fetch secure doc:", err);
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      revoked = true;
    };
  }, [url]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-neutral-100 ${className}`}>
        <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className={`flex items-center justify-center bg-neutral-100 ${className}`}>
        <FileText className="w-6 h-6 text-neutral-400" />
      </div>
    );
  }

  if (type === "iframe") {
    return <iframe src={blobUrl} title={alt} className={className} style={{ border: 0 }} />;
  }

  return <img src={blobUrl} alt={alt} className={className} />;
}

interface SecureDocViewerModalProps {
  selectedDoc: {
    url: string;
    label: string;
    documentType: string;
  } | null;
  onClose: () => void;
}

export default function SecureDocViewerModal({
  selectedDoc,
  onClose,
}: SecureDocViewerModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!selectedDoc) return null;

  const handleOpenInNewTab = async () => {
    try {
      let objectUrl = blobCache.get(selectedDoc.url);
      if (!objectUrl) {
        const res = await authFetch(selectedDoc.url);
        if (!res.ok) return;
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        blobCache.set(selectedDoc.url, objectUrl);
      }
      const tab = window.open(objectUrl, "_blank");
      if (!tab) alert("Please allow pop-ups to open the document in a new tab.");
    } catch {
      /* silent */
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col border border-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-white">
          <div>
            <h3 className="text-[16px] font-bold text-neutral-900">{selectedDoc.label}</h3>
            <p className="text-[12px] text-neutral-500 mt-0.5">Press Esc or click outside to close</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="px-3 h-9 rounded-xl border border-neutral-200 hover:bg-neutral-50 flex items-center gap-1.5 text-[13px] font-medium text-neutral-600 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Tab</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-neutral-200 hover:bg-neutral-50 flex items-center justify-center text-neutral-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document Body */}
        <div className="flex-1 overflow-auto bg-neutral-50 flex items-center justify-center p-4">
          <SecureDocMedia
            url={selectedDoc.url}
            alt={selectedDoc.label}
            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
          />
        </div>
      </div>
    </div>
  );
}

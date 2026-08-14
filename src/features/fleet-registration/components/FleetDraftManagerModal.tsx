"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BusFront,
  Calendar,
  FileCheck2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  deleteFleetRegistrationDraft,
  listFleetDrafts,
  setActiveDraftId,
  subscribeToFleetDraftChanges,
  type DraftMetadata,
} from "../fleet-registration-draft-storage";

function formatRelativeTime(isoString: string) {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return "Recently";
  }
}

const STEP_LABELS: Record<string, string> = {
  vehicle: "Step 1 · Vehicle Details",
  layout: "Step 2 · Seat Layout",
  photos: "Step 3 · Vehicle Photos",
  documents: "Step 4 · Documents",
  route: "Step 5 · Route Assignment",
  review: "Step 6 · Final Review",
};

export default function FleetDraftManagerModal({
  isOpen,
  activeDraftId,
  onClose,
  onSelectDraft,
  onStartNew,
}: {
  isOpen: boolean;
  activeDraftId: string | null;
  onClose: () => void;
  onSelectDraft: (draftId: string) => void;
  onStartNew: () => void;
}) {
  const [drafts, setDrafts] = useState<DraftMetadata[]>(() => listFleetDrafts());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onStorage = () => setDrafts(listFleetDrafts());
    return subscribeToFleetDraftChanges(onStorage);
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleDelete(draftId: string) {
    await deleteFleetRegistrationDraft(draftId);
    const remaining = listFleetDrafts();
    setDrafts(remaining);
    setDeletingId(null);
    if (remaining.length === 0) {
      onStartNew();
    }
  }

  function handleSelect(draftId: string) {
    setActiveDraftId(draftId);
    onSelectDraft(draftId);
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Manage bus drafts"
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[26px] border border-[#E8E1DB] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#EEE8E2] px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#7A1D1B]">
              <BusFront className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#191512]">Saved Bus Drafts</h3>
              <p className="text-[11px] text-[#746E69]">
                {drafts.length} unfinished bus setup{drafts.length === 1 ? "" : "s"} on this device
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl border border-[#E8E1DB] text-[#746E69] hover:bg-[#FAF8F5]"
          >
            <X className="size-4" />
          </button>
        </header>

        {/* Action Top bar: Start Fresh */}
        <div className="flex items-center justify-between border-b border-[#EEE8E2] bg-[#FAF8F5] px-6 py-3">
          <p className="text-xs font-bold text-[#655E58]">Want to register another vehicle?</p>
          <button
            type="button"
            onClick={() => {
              onStartNew();
              onClose();
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-[#7A1D1B] px-3 text-xs font-bold text-white shadow-2xs transition hover:bg-[#641715]"
          >
            <Plus className="size-3.5" />
            Start fresh bus
          </button>
        </div>

        {/* Draft List */}
        <main className="min-h-0 flex-1 overflow-y-auto p-6 space-y-3">
          {drafts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#DCD4CD] p-8 text-center bg-[#FAF8F5]">
              <BusFront className="mx-auto size-8 text-[#938A82]" />
              <p className="mt-2 text-sm font-bold text-[#191512]">No saved drafts</p>
              <p className="mt-1 text-xs text-[#746E69]">All previous bus registrations have been completed.</p>
              <button
                type="button"
                onClick={() => {
                  onStartNew();
                  onClose();
                }}
                className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#7A1D1B] px-4 text-xs font-bold text-white"
              >
                <Plus className="size-3.5" />
                Register a bus
              </button>
            </div>
          ) : (
            drafts.map((d) => {
              const isCurrent = d.id === activeDraftId;
              const isConfirmingDelete = deletingId === d.id;

              return (
                <div
                  key={d.id}
                  className={`flex flex-col gap-3 rounded-2xl border p-4 transition ${
                    isCurrent
                      ? "border-[#7A1D1B] bg-[#FFF8F7]"
                      : "border-[#E8E1DB] bg-white hover:border-[#D6CBC4]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="truncate text-sm font-black text-[#191512]">{d.name}</h4>
                        {isCurrent && (
                          <span className="rounded-full bg-[#7A1D1B] px-2 py-0.5 text-[9px] font-black text-white">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#746E69]">
                        <span className="font-bold text-[#7A1D1B]">{STEP_LABELS[d.step] || d.step}</span>
                        {d.totalPlaces > 0 && <span>• {d.totalPlaces} seats</span>}
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {formatRelativeTime(d.updatedAt)}
                        </span>
                        {d.hasFiles && (
                          <span className="flex items-center gap-1 text-emerald-700 font-medium">
                            <FileCheck2 className="size-3" />
                            Photos/docs saved
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1.5 animate-in fade-in duration-100">
                          <button
                            type="button"
                            onClick={() => void handleDelete(d.id)}
                            className="inline-flex h-8 items-center gap-1 rounded-xl bg-red-600 px-2.5 text-xs font-bold text-white hover:bg-red-700"
                          >
                            <AlertTriangle className="size-3" />
                            Confirm Discard
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(null)}
                            className="inline-flex h-8 items-center rounded-xl border border-[#DCD4CD] px-2.5 text-xs font-bold text-[#655E58] hover:bg-stone-100"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setDeletingId(d.id)}
                            title="Discard this draft"
                            className="flex size-8 items-center justify-center rounded-xl text-[#938A82] hover:bg-red-50 hover:text-red-700 transition"
                          >
                            <Trash2 className="size-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelect(d.id)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-[#7A1D1B] px-3 text-xs font-bold text-white shadow-2xs transition hover:bg-[#641715]"
                          >
                            Resume
                            <ArrowRight className="size-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
}

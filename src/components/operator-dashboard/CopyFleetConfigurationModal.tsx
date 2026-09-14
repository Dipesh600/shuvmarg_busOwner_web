"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bus,
  Check,
  Clock,
  Copy,
  Loader2,
  Route,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  fetchConfigurationPreview,
  applyFleetConfigurationCopy,
  fetchCopyablePeers,
  persistentConfigurationCopyRequestId,
  type CopyablePeerBus,
  type FleetConfigurationPreview,
} from "@/features/operator-dashboard/fleet-copy-api";

interface CopyFleetConfigurationModalProps {
  targetFleetId: string;
  targetBusName: string;
  targetBusNumber: string;
  initialPeers?: CopyablePeerBus[];
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
  onClose: () => void;
  onCopied: (message: string) => void;
}

export default function CopyFleetConfigurationModal({
  targetFleetId,
  targetBusName,
  targetBusNumber,
  initialPeers = [],
  title,
  subtitle,
  confirmLabel,
  onClose,
  onCopied,
}: CopyFleetConfigurationModalProps) {
  const [fetchedPeers, setFetchedPeers] = useState<CopyablePeerBus[]>([]);
  const peers = initialPeers.length > 0 ? initialPeers : fetchedPeers;
  const [selectedSourceId, setSelectedSourceId] = useState<string>(
    initialPeers[0]?.fleetId || "",
  );

  useEffect(() => {
    if (initialPeers.length > 0) return;
    let active = true;
    fetchCopyablePeers(targetFleetId).then((data) => {
      if (active) setFetchedPeers(data);
    });
    return () => {
      active = false;
    };
  }, [initialPeers.length, targetFleetId]);

  const activeSourceId = peers.some((peer) => peer.fleetId === selectedSourceId)
    ? selectedSourceId
    : peers[0]?.fleetId || "";

  const [preview, setPreview] = useState<FleetConfigurationPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [activeJourneyTab, setActiveJourneyTab] = useState<"outbound" | "return">("outbound");

  useEffect(() => {
    if (!activeSourceId) return;
    let active = true;
    const loadPreview = async () => {
      await Promise.resolve();
      if (!active) return;
      setLoadingPreview(true);
      setPreviewError(null);
      setApplyError(null);

      const selected = peers.find((peer) => peer.fleetId === activeSourceId);
      if (!selected?.configurationId) {
        setLoadingPreview(false);
        setPreview(null);
        setPreviewError("This vehicle has no compatible two-way stops and timings setup.");
        return;
      }
      try {
        const data = await fetchConfigurationPreview(
          targetFleetId,
          activeSourceId,
          selected.configurationId,
        );
        if (active) setPreview(data);
      } catch (err) {
        if (active) {
          setPreviewError(err instanceof Error ? err.message : "Failed to load configuration preview.");
          setPreview(null);
        }
      } finally {
        if (active) setLoadingPreview(false);
      }
    };
    void loadPreview();

    return () => {
      active = false;
    };
  }, [targetFleetId, activeSourceId, peers]);

  const handleApply = async () => {
    const sourceId = activeSourceId;
    if (!sourceId || applying || !preview) return;
    setApplying(true);
    setApplyError(null);
    try {
      const requestId = persistentConfigurationCopyRequestId(
        targetFleetId,
        preview.source.configurationId,
        preview.fingerprint,
      );
      const res = await applyFleetConfigurationCopy(targetFleetId, {
        sourceFleetId: sourceId,
        sourceConfigurationId: preview.source.configurationId,
        previewFingerprint: preview.fingerprint,
        requestId,
      });
      onCopied(res.message || "Stops and timings were applied.");
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "Failed to copy stops and timings.");
    } finally {
      setApplying(false);
    }
  };

  const selectedPeer = peers.find((p) => p.fleetId === selectedSourceId) || peers[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="copy-config-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-3xl border border-[#E8E1DB] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EEE8E2] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#F5E8E6] text-[#7A1D1B]">
              <Copy className="size-4" />
            </div>
            <div>
              <h2 id="copy-config-title" className="text-base font-black text-[#211D1A]">
                {title || "Copy Stops & Timings"}
              </h2>
              <p className="text-xs text-[#746E69]">
                {subtitle || `Apply verified route, intermediate stops, and journey timings to ${targetBusName} ${targetBusNumber ? `(${targetBusNumber})` : ""}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={applying}
            className="flex size-8 items-center justify-center rounded-xl text-[#746E69] transition hover:bg-[#FAF4F1] hover:text-[#211D1A]"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Source Bus Selector (if multiple exist) */}
          {peers.length > 1 && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#817A74]">
                Choose Source Vehicle to Copy From
              </label>
              <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {peers.map((peer) => {
                  const isSelected = peer.fleetId === selectedSourceId;
                  return (
                    <button
                      key={peer.fleetId}
                      type="button"
                      onClick={() => setSelectedSourceId(peer.fleetId)}
                      disabled={applying}
                      className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition ${
                        isSelected
                          ? "border-[#7A1D1B] bg-[#FFF8F6] ring-2 ring-[#7A1D1B]/20 shadow-xs"
                          : "border-[#E8E1DB] bg-white hover:border-[#DCD4CD] hover:bg-[#FAF8F5]"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="text-xs font-black text-[#211D1A]">{peer.busName}</span>
                        {isSelected && (
                          <span className="flex size-4 items-center justify-center rounded-full bg-[#7A1D1B] text-white">
                            <Check className="size-2.5" />
                          </span>
                        )}
                      </div>
                      <span className="mt-0.5 font-mono text-[10px] font-bold text-[#817A74]">
                        {peer.busNumber}
                      </span>
                      <div className="mt-2 flex w-full items-center justify-between gap-2 text-[11px] text-[#655E58]">
                        <span className="truncate font-medium">{peer.routeLabel}</span>
                        <span className="shrink-0 font-bold text-[#7A1D1B]">
                          {peer.outboundStopCount} + {peer.returnStopCount} stops
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Single peer banner if only 1 peer */}
          {peers.length === 1 && selectedPeer && (
            <div className="flex items-center justify-between rounded-2xl border border-[#E8E1DB] bg-[#FAF8F5] p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-white border border-[#E8E1DB] text-[#7A1D1B]">
                  <Bus className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-[#211D1A]">
                    Source: {selectedPeer.busName} <span className="font-mono text-[11px] font-normal text-[#817A74]">({selectedPeer.busNumber})</span>
                  </p>
                  <p className="text-[11px] font-medium text-[#655E58]">{selectedPeer.routeLabel}</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-emerald-700">
                Active setup
              </span>
            </div>
          )}

          {/* Error Banner */}
          {(previewError || applyError) && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{previewError || applyError}</span>
            </div>
          )}

          {/* Preview Loading State */}
          {loadingPreview && (
            <div className="flex flex-col items-center justify-center py-12 text-[#817A74]">
              <Loader2 className="size-6 animate-spin text-[#7A1D1B]" />
              <p className="mt-2 text-xs font-medium">Loading configuration preview...</p>
            </div>
          )}

          {/* Configuration Preview Details */}
          {!loadingPreview && preview && (
            <div className="space-y-4">
              {/* Corridor & Route Header Card */}
              <div className="rounded-2xl border border-[#E8E1DB] bg-[#FFFCFA] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EEE8E2] pb-3">
                  <div className="flex items-center gap-2">
                    <Route className="size-4 text-[#7A1D1B]" />
                    <span className="text-xs font-black text-[#211D1A]">
                      {preview.corridor.label}
                    </span>
                  </div>
                  <span className="rounded-full bg-[#FAF4F1] px-2.5 py-0.5 text-[9px] font-bold text-[#7A1D1B]">
                    Pattern: {preview.patternName}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#817A74]">Outbound Departure</span>
                    <p className="font-bold text-[#211D1A] mt-0.5">{preview.outbound.departureTime || "Not set"}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#817A74]">Outbound Arrival</span>
                    <p className="font-bold text-[#211D1A] mt-0.5">{preview.outbound.arrivalTime || "Not set"}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#817A74]">Return Departure</span>
                    <p className="font-bold text-[#211D1A] mt-0.5">{preview.returnTrip.departureTime || "Not set"}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#817A74]">Journey Pattern</span>
                    <p className="font-bold text-[#7A1D1B] mt-0.5">
                      {preview.outbound.stopCount} Out · {preview.returnTrip.stopCount} Ret
                    </p>
                  </div>
                </div>
              </div>

              {/* Journey Stops & Timings Preview */}
              <div className="rounded-2xl border border-[#E8E1DB] bg-white p-4">
                <div className="flex items-center justify-between border-b border-[#EEE8E2] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-[#7A1D1B]" />
                    <span className="text-xs font-black text-[#211D1A]">Journey Stops & Timings</span>
                  </div>
                  <div className="flex rounded-xl bg-[#FAF4F1] p-0.5">
                    <button
                      type="button"
                      onClick={() => setActiveJourneyTab("outbound")}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                        activeJourneyTab === "outbound"
                          ? "bg-white text-[#7A1D1B] shadow-2xs"
                          : "text-[#817A74] hover:text-[#211D1A]"
                      }`}
                    >
                      Outbound ({preview.outbound.stopCount} stops)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveJourneyTab("return")}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                        activeJourneyTab === "return"
                          ? "bg-white text-[#7A1D1B] shadow-2xs"
                          : "text-[#817A74] hover:text-[#211D1A]"
                      }`}
                    >
                      Return ({preview.returnTrip.stopCount} stops)
                    </button>
                  </div>
                </div>

                {/* Stops Timeline / List */}
                <div className="mt-3 max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {(activeJourneyTab === "outbound" ? preview.outbound.stops : preview.returnTrip.stops).map((stop, idx) => (
                    <div
                      key={stop.stopId || idx}
                      className="flex items-center justify-between rounded-xl bg-[#FAF8F5] px-3 py-2 text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex size-4.5 items-center justify-center rounded-full bg-[#E8E1DB] font-mono text-[9px] font-bold text-[#655E58]">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-[#211D1A]">{stop.name}</span>
                        {stop.stopBehavior === "REST_STOP" && (
                          <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[8px] font-black text-amber-700">
                            Meal break
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[#655E58]">
                        {stop.estimatedArrival && (
                          <span>Arr: <strong className="text-[#211D1A]">{stop.estimatedArrival}</strong></span>
                        )}
                        {stop.estimatedDeparture && (
                          <span>Dep: <strong className="text-[#211D1A]">{stop.estimatedDeparture}</strong></span>
                        )}
                        {stop.haltDuration > 0 && (
                          <span className="text-[10px] text-[#817A74]">({stop.haltDuration}m halt)</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {(activeJourneyTab === "outbound" ? preview.outbound.stops : preview.returnTrip.stops).length === 0 && (
                    <p className="py-4 text-center text-xs text-[#817A74]">
                      No individual stops configured for this journey.
                    </p>
                  )}
                </div>
              </div>

              {/* Vehicle-Specific Disclaimer Notice */}
              <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-800">
                <ShieldCheck className="size-4 shrink-0 mt-0.5 text-amber-700" />
                <div>
                  <p className="font-bold">Only route, stops and timings will be copied</p>
                  <p className="mt-0.5 text-[11px] text-amber-700">
                    Schedule dates, operating days, driver, conductor, fare, available seats and booking state on {targetBusName} will remain unchanged.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-[#EEE8E2] px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={applying}
              className="rounded-xl border border-[#DCD4CD] bg-white px-4 py-2.5 text-xs font-bold text-[#655E58] transition hover:bg-[#FAF8F5] disabled:opacity-50"
            >
              Cancel
            </button>
            {applyError && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{applyError}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleApply}
            disabled={applying || loadingPreview || !preview}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7A1D1B] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#5C1414] disabled:opacity-50"
          >
            {applying ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Applying configuration...</span>
              </>
            ) : (
              <>
                <span>{confirmLabel || `Apply stops & timings to ${targetBusName}`}</span>
                <ArrowRight className="size-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

import { authFetch } from "@/lib/auth";
import { ApiResponseError } from "@/lib/api-error";

export interface CopyablePeerBus {
  fleetId: string;
  busName: string;
  busNumber: string;
  routeLabel: string;
  corridorId: string;
  configurationId: string;
  patternName: string;
  outboundStopCount: number;
  returnStopCount: number;
}

export interface PreviewStop {
  stopId: string;
  name: string;
  code: string;
  estimatedArrival?: string | null;
  estimatedDeparture?: string | null;
  haltDuration: number;
  stopBehavior: string;
}

export interface FleetConfigurationPreview {
  target: {
    fleetId: string;
    busName: string;
    busNumber: string;
  };
  source: {
    fleetId: string;
    busName: string;
    busNumber: string;
    configurationId: string;
  };
  corridor: {
    id: string;
    label: string;
  };
  patternName: string;
  fingerprint: string;
  outbound: {
    departureTime?: string | null;
    arrivalTime?: string | null;
    arrivalDayOffset: number;
    stopCount: number;
    stops: PreviewStop[];
  };
  returnTrip: {
    departureTime?: string | null;
    arrivalTime?: string | null;
    arrivalDayOffset: number;
    stopCount: number;
    stops: PreviewStop[];
  };
}

type ApiEnvelope<T> = { success: boolean; message?: string; data?: T };

async function read<T>(res: Response): Promise<T> {
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new ApiResponseError(res, payload);
  return (payload?.data || payload) as T;
}

export async function fetchCopyablePeers(fleetId: string): Promise<CopyablePeerBus[]> {
  try {
    const res = await authFetch(`/busowner/fleets/${encodeURIComponent(fleetId)}/copyable-peers`);
    if (!res.ok) return [];
    const envelope = (await res.json()) as ApiEnvelope<CopyablePeerBus[]>;
    return Array.isArray(envelope.data) ? envelope.data : [];
  } catch {
    return [];
  }
}

export async function fetchConfigurationPreview(
  targetFleetId: string,
  sourceFleetId: string,
  sourceConfigurationId: string,
): Promise<FleetConfigurationPreview> {
  const params = new URLSearchParams({ sourceFleetId, sourceConfigurationId });
  const res = await authFetch(
    `/busowner/fleets/${encodeURIComponent(targetFleetId)}/configuration-preview?${params.toString()}`,
  );
  return read<FleetConfigurationPreview>(res);
}

export async function applyFleetConfigurationCopy(
  targetFleetId: string,
  input: {
    sourceFleetId: string;
    sourceConfigurationId: string;
    previewFingerprint: string;
    requestId: string;
  },
): Promise<{ success: boolean; message?: string }> {
  const res = await authFetch(
    `/busowner/fleets/${encodeURIComponent(targetFleetId)}/copy-configuration`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  const payload = (await res.json().catch(() => null)) as { success?: boolean; message?: string } | null;
  if (!res.ok) throw new ApiResponseError(res, payload);
  return { success: payload?.success ?? true, message: payload?.message };
}

export function persistentConfigurationCopyRequestId(
  targetFleetId: string,
  sourceConfigurationId: string,
  fingerprint: string,
) {
  const storageKey = `shuvmarg:configuration-copy:${targetFleetId}:${sourceConfigurationId}:${fingerprint}`;
  if (typeof window !== "undefined") {
    const saved = window.sessionStorage.getItem(storageKey);
    if (saved) return saved;
  }
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const requestId = `copy:${random}`;
  if (typeof window !== "undefined") window.sessionStorage.setItem(storageKey, requestId);
  return requestId;
}

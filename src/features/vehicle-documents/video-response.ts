import type { VideoDescriptor } from "./VehicleVideo";

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function videoResponseData(status: number, payload: unknown): VideoDescriptor {
  if (status < 200 || status >= 300 || (record(payload) && payload.success === false)) {
    if (record(payload) && typeof payload.message === "string" && payload.message.trim()) {
      throw new Error(payload.message);
    }
    const messages: Record<number, string> = {
      401: "Your session has expired. Please sign in again.",
      403: "You do not have permission to update this vehicle video.",
      404: "Vehicle video service is unavailable. Please refresh vehicle details or contact support.",
      408: "Video upload timed out. Please retry.",
      413: "The server rejected the video's size. Choose a smaller video or contact support if it is within the displayed limit.",
      429: "Too many video upload attempts. Please wait before trying again.",
      502: "Video upload service is temporarily unavailable. Please retry shortly.",
      503: "Vehicle video uploads are temporarily unavailable. Please retry later.",
      504: "Video upload timed out. Please retry shortly.",
    };
    throw new Error(messages[status] || `Unable to complete the video request (HTTP ${status}). Please retry.`);
  }
  if (!record(payload) || !record(payload.data) || typeof payload.data.present !== "boolean" ||
      !["NONE", "UPLOADING", "QUEUED", "PROCESSING", "READY", "FAILED"].includes(String(payload.data.processingStatus))) {
    throw new Error("The server returned an unexpected video response. Refresh vehicle details to check whether it was saved before trying again.");
  }
  return payload.data as VideoDescriptor;
}

export async function readVideoResponse(response: Response): Promise<VideoDescriptor> {
  const payload: unknown = await response.json().catch(() => null);
  return videoResponseData(response.status, payload);
}

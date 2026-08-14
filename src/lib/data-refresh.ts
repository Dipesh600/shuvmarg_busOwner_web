export const DATA_REFRESH_EVENT = "shuvmarg:data-refresh";

export function requestDataRefresh() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(DATA_REFRESH_EVENT));
}

export function subscribeToDataRefresh(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(DATA_REFRESH_EVENT, listener);
  return () => window.removeEventListener(DATA_REFRESH_EVENT, listener);
}

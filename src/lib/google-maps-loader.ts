/// <reference types="google.maps" />
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let loadPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();
  if (loadPromise) return loadPromise;

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key || key === "your_google_maps_api_key_here") {
    return Promise.reject(new Error("Google Maps API key is not configured."));
  }

  setOptions({
    key,
    v: "weekly",
    language: "en",
    region: "NP",
    authReferrerPolicy: "origin",
  });

  loadPromise = Promise.all([
    importLibrary("maps"),
    importLibrary("places"),
    importLibrary("geocoding"),
  ]).then(() => undefined);

  return loadPromise;
}

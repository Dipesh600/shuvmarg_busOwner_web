/// <reference types="google.maps" />
"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { loadGoogleMaps } from "@/lib/google-maps-loader";

export interface MapsPoint {
  lat: number;
  lng: number;
}

export default function RoutePlaceMapPicker({ center, value, onChange }: {
  center: MapsPoint; value: MapsPoint | null;
  onChange: (point: MapsPoint, address: string) => void;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reverse(point: MapsPoint) {
    if (!window.google?.maps?.Geocoder) return onChange(point, "");
    const geocoder = new google.maps.Geocoder();
    const response = await geocoder.geocode({ location: point });
    onChange(point, response.results?.[0]?.formatted_address || "");
  }

  function placeMarker(map: google.maps.Map, point: MapsPoint) {
    if (!markerRef.current) {
      markerRef.current = new google.maps.Marker({
        map,
        position: point,
        draggable: true,
        title: "Selected route place",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#7A1D1B",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
        },
      });
      markerRef.current.addListener("dragend", () => {
        const position = markerRef.current?.getPosition();
        if (position) {
          const lat = position.lat();
          const lng = position.lng();
          if (Number.isFinite(lat) && Number.isFinite(lng)) void reverse({ lat, lng });
        }
      });
    } else {
      markerRef.current.setPosition(point);
    }
  }

  useEffect(() => {
    let active = true;
    void loadGoogleMaps().then(() => {
      if (!active || !elementRef.current) return;
      const map = new google.maps.Map(elementRef.current, {
        center,
        zoom: 12,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
      });
      mapRef.current = map;
      map.addListener("click", (event: google.maps.MapMouseEvent) => {
        if (!event.latLng) return;
        const point = { lat: event.latLng.lat(), lng: event.latLng.lng() };
        placeMarker(map, point);
        void reverse(point);
      });
      if (value) placeMarker(map, value);
    }).catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : "Map unavailable.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
    // The map owns its event listeners for this mount; live selections flow through those listeners.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search() {
    const map = mapRef.current;
    if (!map || !query.trim() || !window.google?.maps?.Geocoder) return;
    setLoading(true);
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ address: `${query.trim()}, Nepal` });
      const result = response.results?.[0];
      const location = result?.geometry?.location;
      if (!location) throw new Error("Place not found.");
      const point = { lat: location.lat(), lng: location.lng() };
      map.setCenter(point);
      map.setZoom(15);
      placeMarker(map, point);
      onChange(point, result.formatted_address || "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Place not found.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="space-y-2"><div className="flex gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void search(); } }} placeholder="Search this place on the map" className="h-10 min-w-0 flex-1 rounded-xl border border-[#DCD4CD] px-3 text-xs font-semibold outline-none focus:border-[#7A1D1B]" /><button type="button" onClick={() => void search()} className="flex h-10 items-center gap-1.5 rounded-xl bg-[#211D1A] px-3 text-xs font-black text-white"><Search className="size-3.5" />Search</button></div><div className="relative h-56 overflow-hidden rounded-2xl border border-[#DCD4CD] bg-[#EEE9E5]"><div ref={elementRef} className="h-full w-full" />{loading && <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs font-bold text-[#756D66]"><Loader2 className="mr-2 size-4 animate-spin" />Loading map…</div>}{error && <div className="absolute inset-x-3 bottom-3 rounded-xl bg-white p-2 text-xs font-bold text-red-700 shadow">{error}</div>}</div><p className="text-[11px] text-[#7D756E]">Search, click the map or drag the marker to the exact place.</p></div>;
}

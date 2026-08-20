/// <reference types="google.maps" />
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Crosshair,
  Loader2,
  MapPin,
  Maximize2,
  Minimize2,
  Navigation,
  Route as RouteIcon,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import type {
  FleetRouteAddedPlace,
  FleetRouteEndpoint,
  FleetRouteStop,
  FleetServedStop,
} from "../route-types";

interface RouteOverviewMapProps {
  origin: FleetRouteEndpoint | null;
  destination: FleetRouteEndpoint | null;
  variantStops: FleetRouteStop[];
  servedStops: FleetServedStop[];
  addedPlaces: FleetRouteAddedPlace[];
  onToggleStop?: (stop: FleetRouteStop) => void;
  onMapClickAdd?: (point: { lat: number; lng: number }) => void;
}

interface MappedPoint {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  isServed: boolean;
  isOrigin: boolean;
  isDestination: boolean;
  isCustom: boolean;
  stop?: FleetRouteStop;
  sequence: number;
}

const MAP_PIN_PATH =
  "M 12 0 C 5.37 0 0 5.37 0 12 C 0 20.5 12 34 12 34 C 12 34 24 20.5 24 12 C 24 5.37 18.63 0 12 0 Z";

// Known default coordinates for Nepal stops if DB coordinates are pending
const KNOWN_COORDINATES: Record<string, { lat: number; lng: number }> = {
  kathmandu: { lat: 27.7172, lng: 85.324 },
  pokhara: { lat: 28.2096, lng: 83.9856 },
  hetauda: { lat: 27.4284, lng: 85.0326 },
  malangwa: { lat: 26.8575, lng: 85.5583 },
  lalbandi: { lat: 27.0544, lng: 85.6377 },
  nawalpur: { lat: 27.0425, lng: 85.6186 },
  haripur: { lat: 26.9632, lng: 85.5786 },
  haraiya: { lat: 26.9214, lng: 85.5689 },
  farhadwa: { lat: 26.8923, lng: 85.5612 },
  birgunj: { lat: 27.0149, lng: 84.8773 },
  butwal: { lat: 27.7006, lng: 83.4483 },
  dharan: { lat: 26.8065, lng: 87.2846 },
  itahari: { lat: 26.6644, lng: 87.2718 },
  janakpur: { lat: 26.7288, lng: 85.9244 },
  narayangarh: { lat: 27.6983, lng: 84.4262 },
  chitwan: { lat: 27.5291, lng: 84.3542 },
  mugling: { lat: 27.8617, lng: 84.5558 },
  damauli: { lat: 27.9739, lng: 84.2825 },
  dumre: { lat: 27.9833, lng: 84.4167 },
  malekhu: { lat: 27.8083, lng: 84.825 },
};

function resolveCoordinate(
  name: string,
  coords: { lat: number; lng: number } | null | undefined,
  index: number,
  total: number
): { lat: number; lng: number } {
  if (coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
    return coords;
  }
  const key = name.trim().toLowerCase();
  if (KNOWN_COORDINATES[key]) {
    return KNOWN_COORDINATES[key];
  }
  const fraction = total > 1 ? index / (total - 1) : 0.5;
  return {
    lat: 27.7172 - fraction * 0.8 + (index % 2 === 0 ? 0.02 : -0.02),
    lng: 85.324 + fraction * 0.4 + (index % 3 === 0 ? 0.03 : -0.03),
  };
}

export default function RouteOverviewMap({
  origin,
  destination,
  variantStops,
  servedStops,
  addedPlaces,
  onToggleStop,
  onMapClickAdd,
}: RouteOverviewMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlaysRef = useRef<Array<google.maps.Marker | google.maps.Polyline | google.maps.InfoWindow>>([]);
  const listenersRef = useRef<google.maps.MapsEventListener[]>([]);
  const activeInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const hasFittedBoundsRef = useRef<boolean>(false);
  const prevRouteKeyRef = useRef<string>("");
  const cachedRoadPathRef = useRef<{ routeKey: string; path: google.maps.LatLng[] } | null>(null);

  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentRouteKey = `${origin?.id || origin?.name || ""}->${destination?.id || destination?.name || ""}`;

  // Reset bounds fit and road path cache only when the corridor endpoints genuinely change.
  useEffect(() => {
    prevRouteKeyRef.current = currentRouteKey;
    hasFittedBoundsRef.current = false;
    cachedRoadPathRef.current = null;
  }, [currentRouteKey]);

  const servedIds = useMemo(
    () => new Set(servedStops.map((s) => s.stopId)),
    [servedStops]
  );

  // Compile all route points in sequence order
  const mappedPoints = useMemo(() => {
    const points: MappedPoint[] = [];
    const totalCount = 2 + variantStops.length + addedPlaces.length;
    let idx = 0;

    // 1. Origin
    if (origin) {
      points.push({
        id: origin.id || "origin",
        name: origin.name || "Origin",
        coordinates: resolveCoordinate(origin.name || "Kathmandu", origin.coordinates, idx++, totalCount),
        isServed: true,
        isOrigin: true,
        isDestination: false,
        isCustom: !!origin.isCustom,
        sequence: 1,
      });
    }

    // 2. Intermediate Variant Stops
    variantStops.forEach((stop) => {
      if (stop.id !== origin?.id && stop.id !== destination?.id) {
        points.push({
          id: stop.id,
          name: stop.name,
          coordinates: resolveCoordinate(stop.name, stop.coordinates, idx++, totalCount),
          isServed: servedIds.has(stop.id),
          isOrigin: false,
          isDestination: false,
          isCustom: false,
          stop,
          sequence: stop.sequence || idx,
        });
      }
    });

    // 3. Added Custom Places
    addedPlaces.forEach((place) => {
      points.push({
        id: place.clientKey,
        name: place.name,
        coordinates: resolveCoordinate(place.name, place.coordinates, idx++, totalCount),
        isServed: true,
        isOrigin: false,
        isDestination: false,
        isCustom: true,
        sequence: idx,
      });
    });

    // 4. Destination
    if (destination && destination.id !== origin?.id) {
      points.push({
        id: destination.id || "destination",
        name: destination.name || "Destination",
        coordinates: resolveCoordinate(
          destination.name || "Destination",
          destination.coordinates,
          totalCount - 1,
          totalCount
        ),
        isServed: true,
        isOrigin: false,
        isDestination: true,
        isCustom: !!destination.isCustom,
        sequence: totalCount,
      });
    }

    return points;
  }, [origin, destination, variantStops, servedIds, addedPlaces]);

  const markersMapRef = useRef<
    Map<
      string,
      {
        marker: google.maps.Marker;
        infoWindow: google.maps.InfoWindow;
        listener: google.maps.MapsEventListener;
      }
    >
  >(new Map());
  // Main Google Map & Highway Route Render Effect
  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      try {
        await loadGoogleMaps();
        if (cancelled || !containerRef.current) return;

        const container = containerRef.current;
        const map =
          mapRef.current ||
          new google.maps.Map(container, {
            center: { lat: 28.0, lng: 84.8 },
            zoom: 8,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: false,
            gestureHandling: "cooperative",
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }],
              },
              {
                featureType: "transit",
                elementType: "labels",
                stylers: [{ visibility: "off" }],
              },
            ],
          });

        mapRef.current = map;

        // Click map to drop a custom pin
        listenersRef.current.forEach((l) => l.remove());
        listenersRef.current = [];

        if (onMapClickAdd) {
          const mapClickListener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
            if (!e.latLng) return;
            if (activeInfoWindowRef.current) {
              activeInfoWindowRef.current.close();
              activeInfoWindowRef.current = null;
            }
            onMapClickAdd({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          });
          listenersRef.current.push(mapClickListener);
        }

        const bounds = new google.maps.LatLngBounds();
        const activeIds = new Set(mappedPoints.map((p) => p.id));

        // ── 1. Create or Update Markers (Pooled / Diffed for 60fps responsiveness) ──
        mappedPoints.forEach((p) => {
          bounds.extend(p.coordinates);

          let fillColor = "#7A1D1B"; // Temple Maroon
          let strokeColor = "#FFFFFF";
          let scale = 1.05;
          let labelText = String(p.sequence);
          let labelColor = "#FFFFFF";
          let zIndex = 5;

          if (p.isOrigin) {
            fillColor = "#7A1D1B";
            strokeColor = "#C99A4A";
            scale = 1.25;
            labelText = "A";
            labelColor = "#FFFFFF";
            zIndex = 25;
          } else if (p.isDestination) {
            fillColor = "#7A1D1B";
            strokeColor = "#C99A4A";
            scale = 1.25;
            labelText = "B";
            labelColor = "#FFFFFF";
            zIndex = 25;
          } else if (p.isCustom) {
            fillColor = "#C99A4A";
            strokeColor = "#FFFFFF";
            scale = 1.1;
            labelText = String(p.sequence);
            labelColor = "#211D1A";
            zIndex = 15;
          } else if (p.isServed) {
            fillColor = "#7A1D1B";
            strokeColor = "#FFFFFF";
            scale = 1.05;
            labelText = String(p.sequence);
            labelColor = "#FFFFFF";
            zIndex = 10;
          } else {
            fillColor = "#FFFFFF";
            strokeColor = "#8C837B";
            scale = 0.92;
            labelText = String(p.sequence);
            labelColor = "#554E47";
            zIndex = 3;
          }

          const iconSpec: google.maps.Symbol = {
            path: MAP_PIN_PATH,
            scale,
            fillColor,
            fillOpacity: 1,
            strokeColor,
            strokeWeight: p.isOrigin || p.isDestination ? 2.5 : 1.5,
            anchor: new google.maps.Point(12, 34),
            labelOrigin: new google.maps.Point(12, 12),
          };

          const labelSpec: google.maps.MarkerLabel = {
            text: labelText,
            color: labelColor,
            fontWeight: "800",
            fontSize: labelText.length > 2 ? "9px" : scale > 1.15 ? "12px" : "10.5px",
            fontFamily: "Inter, system-ui, sans-serif",
          };

          const infoContent = document.createElement("div");
          infoContent.className = "p-2 text-left text-xs text-[#211D1A] max-w-[220px]";
          infoContent.innerHTML = `
            <div style="font-weight:800; font-size:13px; color:#211D1A; margin-bottom:2px;">
              ${p.sequence}. ${p.name}
            </div>
            <div style="font-size:10px; font-weight:700; color:${
              p.isOrigin || p.isDestination
                ? "#7A1D1B"
                : p.isServed
                ? "#2E7D32"
                : "#8C837B"
            }; margin-bottom:6px;">
              ${
                p.isOrigin
                  ? "Departure Bus Park / Endpoint"
                  : p.isDestination
                  ? "Arrival Bus Park / Endpoint"
                  : p.isCustom
                  ? "Custom Added Place"
                  : p.isServed
                  ? "✓ Served Passenger Stop"
                  : "Highway Waypoint (Unserved)"
              }
            </div>
            ${
              p.stop?.distanceFromOriginKm
                ? `<div style="font-size:10px; color:#666; margin-bottom:4px;">${p.stop.distanceFromOriginKm} km · ~${p.stop.durationFromOriginMins} min from start</div>`
                : ""
            }
            ${
              p.stop && onToggleStop
                ? `<button id="toggle-stop-${p.id}" style="width:100%; margin-top:4px; padding:5px 8px; font-size:11px; font-weight:700; border-radius:8px; border:none; cursor:pointer; background:${
                    p.isServed ? "#F3EFEB; color:#7A1D1B" : "#7A1D1B; color:#FFFFFF"
                  };">${p.isServed ? "Remove from served" : "+ Serve this stop"}</button>`
                : ""
            }
          `;

          const existing = markersMapRef.current.get(p.id);
          if (existing) {
            existing.marker.setPosition(p.coordinates);
            existing.marker.setIcon(iconSpec);
            existing.marker.setLabel(labelSpec);
            existing.marker.setZIndex(zIndex);
            existing.infoWindow.setContent(infoContent);
          } else {
            const marker = new google.maps.Marker({
              map,
              position: p.coordinates,
              title: `${p.sequence}. ${p.name}`,
              label: labelSpec,
              icon: iconSpec,
              zIndex,
            });

            const infoWindow = new google.maps.InfoWindow({
              content: infoContent,
              disableAutoPan: false,
            });

            const clickListener = marker.addListener("click", () => {
              if (activeInfoWindowRef.current) {
                activeInfoWindowRef.current.close();
              }
              infoWindow.open(map, marker);
              activeInfoWindowRef.current = infoWindow;

              setTimeout(() => {
                const btn = document.getElementById(`toggle-stop-${p.id}`);
                if (btn && p.stop && onToggleStop) {
                  btn.onclick = () => {
                    onToggleStop(p.stop!);
                    infoWindow.close();
                  };
                }
              }, 50);
            });

            markersMapRef.current.set(p.id, {
              marker,
              infoWindow,
              listener: clickListener,
            });
          }
        });

        // Clean up removed markers
        for (const [id, item] of markersMapRef.current.entries()) {
          if (!activeIds.has(id)) {
            item.marker.setMap(null);
            item.listener.remove();
            item.infoWindow.close();
            markersMapRef.current.delete(id);
          }
        }

        const drawRoadPolylines = (roadPath: google.maps.LatLng[] | google.maps.LatLngLiteral[]) => {
          // 2a. Base Casing / Soft Glow Line
          const casingPolyline = new google.maps.Polyline({
            map,
            path: roadPath,
            strokeColor: "#F8F1E3",
            strokeOpacity: 0.9,
            strokeWeight: 8,
            zIndex: 1,
          });

          // 2b. Core Highway Road Line with Directional Pointers
          const corePolyline = new google.maps.Polyline({
            map,
            path: roadPath,
            strokeColor: "#7A1D1B",
            strokeOpacity: 0.95,
            strokeWeight: 4.5,
            icons: [
              {
                icon: {
                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 2.5,
                  fillColor: "#C99A4A",
                  fillOpacity: 1,
                  strokeColor: "#FFFFFF",
                  strokeWeight: 1,
                },
                offset: "40px",
                repeat: "120px",
              },
            ],
            zIndex: 2,
          });

          overlaysRef.current.push(casingPolyline);
          overlaysRef.current.push(corePolyline);
        };

        // ── 2. Request & Render Real Road Path (Google Directions) ────────────
        if (mappedPoints.length >= 2) {
          if (cachedRoadPathRef.current?.routeKey === currentRouteKey && cachedRoadPathRef.current.path.length > 0) {
            // Instant render from cache (preserves 0-latency when toggling stops)
            drawRoadPolylines(cachedRoadPathRef.current.path);
          } else {
            const originPoint = mappedPoints[0].coordinates;
            const destPoint = mappedPoints[mappedPoints.length - 1].coordinates;
            const intermediatePoints = mappedPoints.slice(1, -1);

            const waypoints: google.maps.DirectionsWaypoint[] = intermediatePoints
              .slice(0, 23)
              .map((wp) => ({
                location: new google.maps.LatLng(wp.coordinates.lat, wp.coordinates.lng),
                stopover: false,
              }));

            const directionsService = new google.maps.DirectionsService();

            try {
              directionsService.route(
                {
                  origin: new google.maps.LatLng(originPoint.lat, originPoint.lng),
                  destination: new google.maps.LatLng(destPoint.lat, destPoint.lng),
                  waypoints,
                  travelMode: google.maps.TravelMode.DRIVING,
                  optimizeWaypoints: false,
                },
                (result, status) => {
                  if (cancelled) return;

                  if (status === google.maps.DirectionsStatus.OK && result?.routes?.[0]?.overview_path) {
                    const roadPath = result.routes[0].overview_path;
                    cachedRoadPathRef.current = { routeKey: currentRouteKey, path: roadPath };
                    drawRoadPolylines(roadPath);
                  } else {
                    const fallbackPath = mappedPoints.map((p) => p.coordinates);
                    drawRoadPolylines(fallbackPath);
                  }
                }
              );
            } catch {
              const fallbackPath = mappedPoints.map((p) => p.coordinates);
              drawRoadPolylines(fallbackPath);
            }
          }
        }

        // Fit bounds only ONCE when route first loads; never auto-zoom out or displace the user on subsequent actions
        if (!bounds.isEmpty() && !hasFittedBoundsRef.current) {
          map.fitBounds(bounds, { top: 60, bottom: 50, left: 40, right: 40 });
          hasFittedBoundsRef.current = true;
        }

        setState("ready");
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : "Unable to load Google Maps");
          setState("error");
        }
      }
    };

    void render();

    return () => {
      cancelled = true;
    };
  }, [mappedPoints, currentRouteKey, onMapClickAdd, onToggleStop]);

  function handleZoom(delta: number) {
    if (!mapRef.current) return;
    const current = mapRef.current.getZoom() || 8;
    mapRef.current.setZoom(current + delta);
  }

  function handleFitRoute() {
    if (!mapRef.current || mappedPoints.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    mappedPoints.forEach((p) => bounds.extend(p.coordinates));
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, { top: 60, bottom: 50, left: 40, right: 40 });
    }
  }

  return (
    <div
      className={`relative flex w-full flex-col overflow-hidden rounded-[24px] border border-[#E2DAD3] bg-[#F7F4F0] shadow-sm transition-all ${
        isFullscreen
          ? "fixed inset-4 z-[9999] h-[calc(100vh-32px)] shadow-2xl"
          : "h-full min-h-[420px]"
      }`}
    >
      {/* Top Map Header */}
      <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-2 rounded-2xl border border-[#E8E1DB]/80 bg-white/95 px-3.5 py-2 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#7A1D1B] text-white shadow-xs">
            <Navigation className="size-3" />
          </span>
          <p className="truncate text-xs font-bold text-[#211D1A]">
            {origin?.name || "Start"} → {destination?.name || "Destination"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#F8F1E3] px-2 py-0.5 text-[10px] font-extrabold text-[#7A1D1B]">
            <CheckCircle2 className="size-3 text-[#7A1D1B]" />
            {mappedPoints.filter((p) => p.isServed).length} Served Stops
          </span>
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="flex size-6 items-center justify-center rounded-lg text-[#554E47] transition hover:bg-[#F3EFEB]"
            aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </button>
        </div>
      </div>

      {/* Map Canvas Container */}
      <div ref={containerRef} className="h-full w-full flex-1" style={{ minHeight: "420px" }} />

      {/* Loading Overlay */}
      {state === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FAF7F4]/90 z-20 backdrop-blur-xs">
          <Loader2 className="size-6 animate-spin text-[#7A1D1B]" />
          <p className="mt-2 text-xs font-bold text-[#746C65]">Loading Google Maps journey…</p>
        </div>
      )}

      {/* Error Fallback */}
      {state === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-white/95">
          <MapPin className="size-8 text-[#7A1D1B]" />
          <p className="mt-2 text-sm font-bold text-[#211D1A]">Map view unavailable</p>
          <p className="mt-1 max-w-xs text-xs text-[#7C746D]">{errorMessage}</p>
        </div>
      )}

      {/* Floating Zoom & Fit Controls */}
      <div className="absolute bottom-12 right-3 z-10 flex flex-col gap-1 rounded-xl border border-[#E3DBD4] bg-white p-1 shadow-md">
        <button
          type="button"
          onClick={handleFitRoute}
          className="flex size-8 items-center justify-center rounded-lg text-[#554E47] transition hover:bg-[#F3EFEB] active:scale-95"
          title="Fit full route in view"
          aria-label="Fit full route in view"
        >
          <Crosshair className="size-4 text-[#7A1D1B]" />
        </button>
        <div className="h-px w-full bg-[#EAE3DC]" />
        <button
          type="button"
          onClick={() => handleZoom(1)}
          className="flex size-8 items-center justify-center rounded-lg text-[#554E47] transition hover:bg-[#F3EFEB] active:scale-95"
          aria-label="Zoom in"
        >
          <ZoomIn className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(-1)}
          className="flex size-8 items-center justify-center rounded-lg text-[#554E47] transition hover:bg-[#F3EFEB] active:scale-95"
          aria-label="Zoom out"
        >
          <ZoomOut className="size-4" />
        </button>
      </div>

      {/* Bottom Map Legend with Highway Path & Map Pins */}
      <div className="absolute inset-x-3 bottom-3 z-10 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E8E1DB] bg-white/95 px-3 py-1.5 text-[10px] font-bold text-[#6D655E] shadow-sm backdrop-blur-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="flex size-4 items-center justify-center rounded-sm bg-[#7A1D1B] text-[8px] font-extrabold text-[#C99A4A] border border-[#C99A4A]">A</span>
            Terminals (A/B)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="flex size-4 items-center justify-center rounded-sm bg-[#7A1D1B] text-[8px] font-extrabold text-white">1</span>
            Served Stop Pin
          </span>
          <span className="flex items-center gap-1.5">
            <span className="flex size-4 items-center justify-center rounded-sm border border-[#8C837B] bg-white text-[8px] font-extrabold text-[#554E47]">2</span>
            Highway Waypoint Pin (Tap to add)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="flex size-4 items-center justify-center rounded-sm bg-[#C99A4A] text-[8px] font-extrabold text-[#211D1A]">3</span>
            Custom Place Pin
          </span>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 text-[#968E86]">
          <RouteIcon className="size-3 text-[#7A1D1B]" />
          Driving Highway Path
        </span>
      </div>
    </div>
  );
}

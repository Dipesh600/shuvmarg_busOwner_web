"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Plus, Search, X } from "lucide-react";
import { searchRouteEndpoints } from "../api-route-setup";
import type { FleetRouteEndpoint } from "../route-types";

export default function RouteEndpointPicker({
  label, value, onChange, excludeId, purpose = "ENDPOINT",
}: {
  label: string;
  value: FleetRouteEndpoint | null;
  onChange: (value: FleetRouteEndpoint | null) => void;
  excludeId?: string;
  purpose?: "ENDPOINT" | "ROUTE_STOP";
}) {
  const [query, setQuery] = useState(value?.name || "");
  const [options, setOptions] = useState<FleetRouteEndpoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open || value) return;
    const requestId = ++requestRef.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const items = await searchRouteEndpoints(query, purpose);
        if (requestId === requestRef.current) {
          setOptions(items.filter((item) => item.id !== excludeId));
        }
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [excludeId, open, purpose, query, value]);

  const cleanQuery = query.trim();
  const hasExactMatch = options.some(
    (item) => item.name.toLowerCase() === cleanQuery.toLowerCase()
  );

  function handleSelectCustom() {
    if (!cleanQuery) return;
    const customEndpoint: FleetRouteEndpoint = {
      id: `custom-${Date.now()}`,
      code: null,
      name: cleanQuery,
      parentStop: null,
      district: null,
      municipality: null,
      province: null,
      isRouteStop: true,
      coordinates: null,
      isCustom: true,
    };
    onChange(customEndpoint);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase tracking-[0.14em] text-[#736B64]">{label}</label>
        {value?.isCustom && (
          <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
            Custom location
          </span>
        )}
      </div>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#9B928A]" />
        <input
          value={value?.name ?? query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange(null);
            setOpen(true);
          }}
          placeholder="Search a city, town or stop"
          className="h-12 w-full rounded-2xl border border-[#DDD5CE] bg-white pl-10 pr-10 text-sm font-bold text-[#211D1A] outline-none transition focus:border-[#7A1D1B] focus:ring-2 focus:ring-[#7A1D1B]/10"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setQuery("");
              setOpen(true);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#958C85] hover:text-[#211D1A]"
            aria-label={`Clear ${label}`}
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      {open && !value && (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-2xl border border-[#DED6CF] bg-white p-1.5 shadow-xl">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-4 text-xs font-bold text-[#77706A]">
              <Loader2 className="size-4 animate-spin" />
              Searching Shuvmarg stops…
            </div>
          ) : (
            <>
              {options.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                  className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#FFF4F1]"
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-[#7A1D1B]" />
                  <span>
                    <span className="block text-sm font-black text-[#211D1A]">{item.name}</span>
                    <span className="block text-[11px] text-[#827A73]">
                      {[item.parentStop?.name, item.district, item.province].filter(Boolean).join(" · ") || item.code}
                    </span>
                  </span>
                </button>
              ))}

              {cleanQuery && !hasExactMatch && (
                <button
                  type="button"
                  onClick={handleSelectCustom}
                  className="mt-1 flex w-full items-center gap-2.5 rounded-xl border border-dashed border-[#C99A4A] bg-[#FFFBF2] px-3 py-2.5 text-left transition hover:bg-[#FFF5DD]"
                >
                  <Plus className="size-4 shrink-0 text-[#8C621E]" />
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-black text-[#6B4B13]">
                      Use &ldquo;{cleanQuery}&rdquo; as location
                    </span>
                    <span className="block text-[10px] text-[#8C6C35]">
                      We&rsquo;ll review and map this custom place with your fleet
                    </span>
                  </div>
                </button>
              )}

              {!options.length && !cleanQuery && (
                <p className="px-3 py-4 text-xs text-[#827A73]">Type a city, bazaar or highway point.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { ArrowRight, ChevronDown, LayoutTemplate } from "lucide-react";
import type { SeatLayoutTemplate } from "@/features/seat-layout-v3/types";

interface SeatLayoutTemplateSidebarProps {
  catalog: SeatLayoutTemplate[];
  mine: SeatLayoutTemplate[];
  activeId?: string;
  onChoose: (id: string) => Promise<void>;
}

export function SeatLayoutTemplateSidebar({
  catalog,
  mine,
  activeId,
  onChoose,
}: SeatLayoutTemplateSidebarProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const activeTemplate =
    [...catalog, ...mine].find((t) => t.id === activeId) || catalog[0] || mine[0];

  return (
    <aside className="w-full lg:w-[280px] xl:w-[300px] shrink-0 space-y-4 sm:space-y-6">
      {/* ── Mobile/Tablet Quick Bar (< lg) ── */}
      <div className="lg:hidden rounded-2xl border border-[#EDE7E0] bg-white p-3 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between gap-2.5">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-[#191512] truncate">
              {activeTemplate ? activeTemplate.name : "Select layout"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMobileExpanded((prev) => !prev)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#EDE7E0] bg-[#FAF8F5] px-3 text-xs font-bold text-[#191512] transition hover:bg-white shrink-0 cursor-pointer"
          >
            <LayoutTemplate className="size-3.5 text-[#7A1D1B]" />
            <span>All layouts</span>
            <ChevronDown
              className={`size-3.5 text-[#938A82] transition-transform ${
                mobileExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Horizontal quick pills for mobile */}
        <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-0.5 px-0.5">
          {[...mine, ...catalog].slice(0, 5).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void onChoose(item.id)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeId === item.id
                  ? "bg-[#7A1D1B] text-white shadow-2xs"
                  : "bg-[#FAF8F5] text-[#655E58] border border-[#EDE7E0] hover:bg-white"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Template Lists (Always visible on desktop, toggleable on mobile) ── */}
      <div className={`space-y-6 ${mobileExpanded ? "block" : "hidden lg:block"}`}>
        {/* Shuvmarg Templates Section */}
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#938A82] mb-3 px-1">
            Shuvmarg templates
          </h2>
          <div className="space-y-2.5">
            {catalog.length > 0 ? (
              catalog.map((item) => {
                const isSelected = activeId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      void onChoose(item.id);
                      setMobileExpanded(false);
                    }}
                    className={`w-full text-left rounded-2xl p-4 transition cursor-pointer border ${
                      isSelected
                        ? "bg-[#FFF1EE] border-[#7A1D1B] shadow-xs"
                        : "bg-[#FAF8F5] border-[#EDE7E0] hover:border-[#DCD4CD] hover:bg-white"
                    }`}
                  >
                    <p
                      className={`text-sm font-bold ${
                        isSelected ? "text-[#7A1D1B]" : "text-[#191512]"
                      }`}
                    >
                      {item.name}
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#938A82]">
                      {item.templateCode} · {item.vehicleCategory}
                    </p>
                  </button>
                );
              })
            ) : (
              <p className="text-xs text-[#938A82] p-2">Loading templates…</p>
            )}
          </div>
        </div>

        {/* My Layouts Section */}
        <div>
          <div
            className={`rounded-2xl border p-4 transition ${
              mine.some((item) => item.id === activeId)
                ? "border-[#7A1D1B] bg-white shadow-xs"
                : "border-[#EDE7E0] bg-[#FAF8F5]"
            }`}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A1D1B] mb-3">
              My layouts
            </p>

            {mine.length > 0 ? (
              <div className="space-y-3">
                {mine.map((item) => {
                  const isSelected = activeId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        void onChoose(item.id);
                        setMobileExpanded(false);
                      }}
                      className="w-full flex items-center justify-between text-left group cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <p
                          className={`text-sm font-bold truncate ${
                            isSelected ? "text-[#7A1D1B]" : "text-[#191512]"
                          }`}
                        >
                          {item.name}
                        </p>
                        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[#938A82] truncate">
                          {item.templateCode} · {item.vehicleCategory}
                        </p>
                      </div>
                      <ArrowRight className="size-4 text-[#7A1D1B] shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#938A82]">No layouts yet.</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

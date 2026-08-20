import React from "react";
import { Plus } from "lucide-react";

interface FleetPageHeaderProps {
  hasLocalDraft: boolean;
  onStartFresh: () => void;
  onAddBus: () => void;
}

export function FleetPageHeader({
  hasLocalDraft,
  onStartFresh,
  onAddBus,
}: FleetPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A1D1B]">
          Fleet
        </p>
        <h1 className="mt-1 text-3xl font-black text-[#191512]">Your buses</h1>
      </div>
      <div className="flex items-center gap-2">
        {hasLocalDraft && (
          <button
            onClick={onStartFresh}
            className="flex h-11 items-center justify-center rounded-xl border border-[#DCD4CD] bg-white px-4 text-xs font-black text-[#191512] hover:border-[#7A1D1B] transition shadow-2xs"
          >
            <Plus className="mr-1.5 size-4 text-[#7A1D1B]" />
            Start another bus
          </button>
        )}
        <button
          onClick={onAddBus}
          className="flex h-11 items-center justify-center rounded-xl bg-[#7A1D1B] px-5 text-xs font-black text-white shadow-sm transition hover:bg-[#641715]"
        >
          <Plus className="mr-2 size-4" />
          {hasLocalDraft ? "Continue bus setup" : "Add bus"}
        </button>
      </div>
    </header>
  );
}

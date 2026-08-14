import { CheckCircle2, Plus } from "lucide-react";
import type { SeatLayoutTemplate } from "@/features/seat-layout-v3/types";

export default function SeatTemplatePicker({
  templates,
  selectedId,
  busy,
  onChoose,
  onScratch,
}: {
  templates: SeatLayoutTemplate[];
  selectedId?: string | null;
  busy: boolean;
  onChoose: (item: SeatLayoutTemplate) => void;
  onScratch: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="font-black text-[#211D1A]">Start with a common layout</h4>
          <p className="mt-1 text-xs text-[#746E69]">
            Selecting one previews it below. Nothing is copied until this bus is saved.
          </p>
        </div>
        <button
          type="button"
          onClick={onScratch}
          className="inline-flex h-9 items-center justify-center rounded-xl border border-[#7A1D1B] px-3.5 text-xs font-bold text-[#7A1D1B] transition hover:bg-[#FFF1EE]"
        >
          <Plus className="mr-1.5 size-3.5" />
          Create my own
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((item) => {
          const isSelected = selectedId === item.id;
          return (
            <button
              type="button"
              key={item.id}
              disabled={busy}
              onClick={() => onChoose(item)}
              className={`rounded-2xl border p-4 text-left transition disabled:opacity-60 ${
                isSelected
                  ? "border-[#7A1D1B] bg-[#FFF1EE] shadow-sm"
                  : "border-[#E8E1DB] bg-white hover:border-[#CDBDB5]"
              }`}
            >
              <div className="flex justify-between gap-2">
                <p className="text-sm font-black text-[#191512]">{item.name}</p>
                {isSelected && <CheckCircle2 className="size-4 text-[#7A1D1B]" />}
              </div>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#938A82]">
                {item.vehicleCategory.replaceAll("_", " ")}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

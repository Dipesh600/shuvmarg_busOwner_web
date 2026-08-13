import { cn } from "@/lib/utils";
import type { Comfort, LayoutElement } from "./types";

interface Props {
  element: LayoutElement;
  labelValue: string;
  labelError: string | null;
  onLabelInput: (label: string) => void;
  onLabelCommit: () => void;
  onChange: (update: Partial<LayoutElement>) => void;
}

const field = "mt-1 h-10 w-full rounded-lg border border-[#DCD4CD] bg-white px-3 text-xs text-[#191512]";

export default function SeatLayoutElementEditor({ element, labelValue, labelError, onLabelInput, onLabelCommit, onChange }: Props) {
  return <div className="space-y-3 border-t border-[#EEE8E2] pt-4">
    <p className="text-xs font-black text-[#191512]">Selected {element.kind.toLowerCase()}</p>
    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#938A82]">Passenger label
      <input value={labelValue} onChange={(event) => onLabelInput(event.target.value)} onBlur={onLabelCommit} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} className={cn(field, labelError && "border-red-400")} />
      {labelError && <span className="mt-1 block text-[10px] font-bold normal-case tracking-normal text-red-600">{labelError}</span>}
    </label>
    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#938A82]">Seat type
      <select value={element.attributes?.comfort} onChange={(event) => onChange({ attributes: { ...element.attributes!, comfort: event.target.value as Comfort } })} className={field}><option>STANDARD</option><option>RECLINING</option><option>SEMI_SLEEPER</option></select>
    </label>
    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#938A82]">Passenger class
      <select value={element.attributes?.commercialClass} onChange={(event) => onChange({ attributes: { ...element.attributes!, commercialClass: event.target.value as "STANDARD" | "PREMIUM" | "PRIORITY" } })} className={field}><option>STANDARD</option><option>PREMIUM</option><option>PRIORITY</option></select>
    </label>
    <label className="flex items-center gap-2 text-xs text-[#655E58]"><input type="checkbox" checked={element.attributes?.accessible === true} onChange={(event) => onChange({ attributes: { ...element.attributes!, accessible: event.target.checked } })} />Accessible place</label>
  </div>;
}

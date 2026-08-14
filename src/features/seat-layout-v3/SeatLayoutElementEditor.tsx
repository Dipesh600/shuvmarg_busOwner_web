import { cn } from "@/lib/utils";
import type { LayoutElement } from "./types";

interface Props {
  element: LayoutElement;
  labelValue: string;
  labelError: string | null;
  onLabelInput: (label: string) => void;
  onLabelCommit: () => void;
}

const field = "mt-1 h-10 w-full rounded-lg border border-[#DCD4CD] bg-white px-3 text-xs text-[#191512]";

export default function SeatLayoutElementEditor({ element, labelValue, labelError, onLabelInput, onLabelCommit }: Props) {
  return <div className="space-y-3 border-t border-[#EEE8E2] pt-4">
    <p className="text-xs font-black text-[#191512]">Selected {element.kind.toLowerCase()}</p>
    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#938A82]">Passenger label
      <input value={labelValue} onChange={(event) => onLabelInput(event.target.value)} onBlur={onLabelCommit} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} className={cn(field, labelError && "border-red-400")} />
      {labelError && <span className="mt-1 block text-[10px] font-bold normal-case tracking-normal text-red-600">{labelError}</span>}
    </label>
  </div>;
}

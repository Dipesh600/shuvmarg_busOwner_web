import { Trash2 } from "lucide-react";
import type { Comfort, LayoutElement } from "./types";

interface Props {
  count: number;
  onAttributes: (attributes: Partial<NonNullable<LayoutElement["attributes"]>>) => void;
  onRemove: () => void;
}

const field = "mt-1 h-10 w-full rounded-lg border border-[#DCD4CD] bg-white px-3 text-xs text-[#191512]";

export default function SeatLayoutBulkEditor({ count, onAttributes, onRemove }: Props) {
  return <div className="space-y-3 border-t border-[#EEE8E2] pt-4">
    <div><p className="text-sm font-black text-[#191512]">{count} places selected</p><p className="mt-1 text-[10px] leading-4 text-[#817A74]">Changes below apply to every selected place.</p></div>
    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#938A82]">Seat type
      <select defaultValue="" onChange={(event) => { if (event.target.value) onAttributes({ comfort: event.target.value as Comfort }); }} className={field}><option value="" disabled>Choose type</option><option>STANDARD</option><option>RECLINING</option><option>SEMI_SLEEPER</option></select>
    </label>
    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#938A82]">Passenger class
      <select defaultValue="" onChange={(event) => { if (event.target.value) onAttributes({ commercialClass: event.target.value as "STANDARD" | "PREMIUM" | "PRIORITY" }); }} className={field}><option value="" disabled>Choose class</option><option>STANDARD</option><option>PREMIUM</option><option>PRIORITY</option></select>
    </label>
    <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => onAttributes({ accessible: true })} className="rounded-xl border border-[#DCD4CD] py-2 text-[10px] font-black">Mark accessible</button><button type="button" onClick={() => onAttributes({ accessible: false })} className="rounded-xl border border-[#DCD4CD] py-2 text-[10px] font-black">Clear accessible</button></div>
    <button type="button" onClick={onRemove} className="flex w-full items-center justify-center rounded-xl border border-red-200 py-2.5 text-xs font-black text-red-700"><Trash2 className="mr-2 size-4" />Remove selected</button>
  </div>;
}

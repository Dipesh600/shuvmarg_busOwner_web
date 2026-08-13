import { BusFront, Camera, Check, CheckCircle2, FileText, MapPin, Rows3 } from "lucide-react";
import type { FleetStep } from "./types";

export const STEPS: Array<{ id: FleetStep; label: string; icon: typeof BusFront }> = [
  { id: "vehicle", label: "Bus details", icon: BusFront },
  { id: "layout", label: "Seats", icon: Rows3 },
  { id: "photos", label: "Photos", icon: Camera },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "route", label: "Route", icon: MapPin },
  { id: "review", label: "Review", icon: Check },
];

interface Props {
  active: FleetStep;
  completed: FleetStep[];
  busName: string;
  busNumber: string;
  onSelect: (step: FleetStep) => void;
}

export default function FleetRegistrationStepper({ active, completed, busName, busNumber, onSelect }: Props) {
  const activeIndex = STEPS.findIndex((step) => step.id === active);
  return (
    <aside className="border-b border-[#E8E1DB] bg-[#FAF8F5] md:w-60 md:shrink-0 md:border-b-0 md:border-r">
      <div className="hidden border-b border-[#E8E1DB] p-5 md:block">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#7A1D1B] text-white"><BusFront className="size-4" /></div>
        <p className="mt-3 truncate text-sm font-black text-[#211D1A]">{busName.trim() || "New bus"}</p>
        <p className="mt-1 truncate font-mono text-[10px] font-bold uppercase text-[#817A74]">{busNumber.trim() || "Plate not added"}</p>
      </div>

      <nav aria-label="Bus setup progress" className="hidden space-y-1 p-3 md:block">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const done = completed.includes(step.id);
          const selected = step.id === active;
          const enabled = done || selected;
          return <button key={step.id} type="button" disabled={!enabled} onClick={() => onSelect(step.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition ${selected ? "bg-white text-[#7A1D1B] shadow-sm" : enabled ? "text-[#4E4742] hover:bg-white/70" : "text-[#AAA19A]"}`}><span className={`flex size-7 items-center justify-center rounded-lg ${selected ? "bg-[#FFF1EE]" : done ? "bg-emerald-50 text-emerald-700" : "bg-[#EEE8E2]"}`}>{done && !selected ? <CheckCircle2 className="size-4" /> : <Icon className="size-3.5" />}</span><span className="flex-1">{step.label}</span></button>;
        })}
      </nav>

      <div className="p-4 md:hidden">
        <div className="flex items-center justify-between text-[10px] font-bold"><span className="text-[#211D1A]">{STEPS[activeIndex].label}</span><span className="text-[#817A74]">{activeIndex + 1} of {STEPS.length}</span></div>
        <div className="mt-2 flex gap-1.5">{STEPS.map((step, index) => <span key={step.id} className={`h-1.5 flex-1 rounded-full ${index <= activeIndex ? "bg-[#7A1D1B]" : "bg-[#E4DDD7]"}`} />)}</div>
      </div>
    </aside>
  );
}

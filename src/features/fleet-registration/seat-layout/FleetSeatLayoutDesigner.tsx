import { ArrowLeft } from "lucide-react";
import SeatLayoutBuilder from "@/features/seat-layout-v3/SeatLayoutBuilder";
import type { SeatLayoutV3 } from "@/features/seat-layout-v3/types";

export default function FleetSeatLayoutDesigner({ title, layout, busy, onChange, onUse, onCancel }: { title: string; layout: SeatLayoutV3 | null; busy: boolean; onChange: (layout: SeatLayoutV3) => void; onUse: (layout: SeatLayoutV3) => void; onCancel: () => void }) {
  return <div className="space-y-4"><div className="flex items-center gap-3"><button type="button" onClick={onCancel} className="flex size-9 items-center justify-center rounded-xl border border-[#DCD4CD]" aria-label="Back to templates"><ArrowLeft className="size-4" /></button><div><h4 className="font-black text-[#211D1A]">{title}</h4><p className="text-xs text-[#746E69]">Only correct what differs: add, remove, rename or change a passenger place.</p></div></div><SeatLayoutBuilder layout={layout} onChange={onChange} onSave={onUse} busy={busy} saveLabel="Use this layout" simple /></div>;
}

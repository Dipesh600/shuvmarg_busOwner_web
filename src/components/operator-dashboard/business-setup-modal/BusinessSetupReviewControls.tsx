import type { ReactNode } from "react";
import { Building2, Pencil } from "lucide-react";

export function ReviewSection({ title, icon: Icon, onEdit, children }: { title: string; icon: typeof Building2; onEdit?: () => void; children: ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-[#E7DFD9] bg-white"><div className="flex items-center gap-3 border-b border-[#EEE7E2] px-4 py-3.5"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#7A1D1B]"><Icon className="h-4 w-4" /></div><h4 className="flex-1 text-sm font-bold text-[#28221E]">{title}</h4>{onEdit && <button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-[#7A1D1B] transition hover:bg-[#FFF1EE]"><Pencil className="h-3 w-3" /> Edit</button>}</div><div className="p-4">{children}</div></section>;
}

export function ReviewDetail({ label, value, wide = false }: { label: string; value: string | null | undefined; wide?: boolean }) {
  return <div className={wide ? "sm:col-span-2" : ""}><dt className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#9A928C]">{label}</dt><dd className="mt-1 break-words text-xs font-semibold text-[#302A26]">{value || "—"}</dd></div>;
}

import type { ReactNode } from "react";
export const inputClass = "mt-2 h-11 w-full rounded-xl border border-[#DCD4CD] bg-white px-3 text-sm font-semibold text-[#191512] outline-none focus:border-[#7A1D1B]";
export default function FormField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) { return <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-[#817A74]">{label}{children}{hint && <span className="mt-1.5 block normal-case tracking-normal text-[#938A82]">{hint}</span>}</label>; }

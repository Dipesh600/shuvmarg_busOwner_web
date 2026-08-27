"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

export interface AgentSelectOption { value: string; label: string; group?: string; }

interface SelectProps {
  label: string;
  value: string;
  options: AgentSelectOption[];
  placeholder: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  optional?: boolean;
  showRequirement?: boolean;
}

const fieldClass = "mt-1.5 h-11 w-full rounded-xl border border-[#DED7D1] bg-white px-3.5 text-sm font-semibold text-[#211D1A] outline-none transition focus:border-[#7A1D1B] focus:ring-2 focus:ring-[#7A1D1B]/10 disabled:cursor-not-allowed disabled:bg-[#F5F1EE]";

export function AgentTextField({ label, value, onChange, placeholder, inputMode }: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string; inputMode?: "text" | "tel";
}) {
  return <label className="block text-xs font-bold text-[#413B36]">{label}<span className="ml-1 text-[#D96861]">*</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} inputMode={inputMode} className={fieldClass} /></label>;
}

export function AgentSearchableSelect({ label, value, options, placeholder, onChange, disabled = false, optional = false, showRequirement = true }: SelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return search ? options.filter((option) => option.label.toLocaleLowerCase().includes(search)) : options;
  }, [options, query]);
  const close = () => { setOpen(false); setQuery(""); setActiveIndex(0); };
  const choose = (option: AgentSelectOption) => { onChange(option.value); close(); };

  return <div ref={rootRef} className="relative text-xs font-bold text-[#413B36]" onBlur={(event) => { if (!rootRef.current?.contains(event.relatedTarget as Node | null)) close(); }}>
    <label htmlFor={`${listId}-input`}>{label}{showRequirement && (optional ? <span className="ml-1 font-medium text-[#9A938D]">Optional</span> : <span className="ml-1 text-[#D96861]">*</span>)}</label>
    <div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 mt-0.5 h-3.5 w-3.5 -translate-y-1/2 text-[#9B938D]" /><input id={`${listId}-input`} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={listId} disabled={disabled} value={open ? query : selected?.label || ""} placeholder={placeholder} onFocus={() => { setQuery(""); setOpen(true); setActiveIndex(0); }} onChange={(event) => { setQuery(event.target.value); setOpen(true); setActiveIndex(0); }} onKeyDown={(event) => {
      if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActiveIndex((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0))); }
      else if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); }
      else if (event.key === "Enter" && open && filtered[activeIndex]) { event.preventDefault(); choose(filtered[activeIndex]); }
      else if (event.key === "Escape") { event.stopPropagation(); close(); }
    }} className={`${fieldClass} pl-9 pr-9`} /><ChevronDown className={`pointer-events-none absolute right-3.5 top-1/2 mt-0.5 h-4 w-4 -translate-y-1/2 text-[#7A716B] transition ${open ? "rotate-180" : ""}`} /></div>
    {open && !disabled && <div id={listId} role="listbox" className="absolute z-40 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-[#DED7D1] bg-white p-1.5 shadow-[0_16px_40px_rgba(72,44,35,0.16)]">{optional && value && <button type="button" onMouseDown={(event) => { event.preventDefault(); onChange(""); close(); }} className="flex w-full rounded-lg px-3 py-2 text-left text-xs text-[#7A1D1B]">Clear selection</button>}{filtered.length ? filtered.map((option, index) => <button key={option.value} type="button" role="option" aria-selected={option.value === value} onMouseDown={(event) => { event.preventDefault(); choose(option); }} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left ${index === activeIndex || option.value === value ? "bg-[#FFF1EE] text-[#7A1D1B]" : "text-[#39332F] hover:bg-[#FAF6F3]"}`}><span><span className="block text-xs font-semibold">{option.label}</span>{option.group && <span className="text-[9px] text-[#9A928C]">{option.group}</span>}</span>{option.value === value && <Check className="h-3.5 w-3.5" />}</button>) : <p className="px-3 py-4 text-center text-[11px] text-[#8D857F]">No matching option.</p>}</div>}
  </div>;
}

export function AgentBrandMultiSelect({ options, values, onChange }: { options: AgentSelectOption[]; values: string[]; onChange: (values: string[]) => void; }) {
  const remaining = options.filter((option) => !values.includes(option.value));
  return <div className="sm:col-span-2"><AgentSearchableSelect label="Brands this agent works for" value="" options={remaining} placeholder={values.length ? "Add another brand" : "Choose a brand"} optional onChange={(value) => { if (value) onChange([...values, value]); }} />
    {values.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{values.map((value) => { const option = options.find((item) => item.value === value); return <span key={value} className="flex items-center gap-2 rounded-full border border-[#E4C9C3] bg-[#FFF4F1] px-3 py-1.5 text-xs font-bold text-[#7A1D1B]">{option?.label || value}<button type="button" aria-label={`Remove ${option?.label || "brand"}`} onClick={() => onChange(values.filter((item) => item !== value))}><X className="h-3.5 w-3.5" /></button></span>; })}</div>}
  </div>;
}

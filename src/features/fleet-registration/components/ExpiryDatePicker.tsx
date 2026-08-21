"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const toValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const fromValue = (value: string) => {
  if (!value) return null;
  const dateOnly = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  const date = new Date(dateOnly ? `${dateOnly}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export default function ExpiryDatePicker({ label, value, onChange, disabled = false }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const selected = fromValue(value);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    const initial = new Date(selected || new Date());
    return new Date(initial.getFullYear(), initial.getMonth(), 1).getTime();
  });
  const root = useRef<HTMLDivElement>(null);
  const candidateMonth = new Date(month);
  const shownMonth = Number.isNaN(candidateMonth.getTime())
    ? new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    : candidateMonth;

  useEffect(() => {
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const firstDay = new Date(shownMonth.getFullYear(), shownMonth.getMonth(), 1).getDay();
  const count = new Date(shownMonth.getFullYear(), shownMonth.getMonth() + 1, 0).getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const safeFirstDay = Number.isInteger(firstDay) && firstDay >= 0 && firstDay <= 6 ? firstDay : 0;
  const safeCount = Number.isInteger(count) && count >= 28 && count <= 31 ? count : 30;
  const days = [...Array(safeFirstDay).fill(null), ...Array.from({ length: safeCount }, (_, index) => new Date(shownMonth.getFullYear(), shownMonth.getMonth(), index + 1))];

  return (
    <div ref={root} className="relative">
      <button type="button" disabled={disabled} onClick={() => setOpen((current) => !current)} className="flex h-11 w-full items-center justify-between rounded-xl border border-[#DDD5CE] bg-white px-3 text-left text-xs font-bold text-[#312B27] transition hover:border-[#BFA9A2] disabled:bg-[#F6F2EF] disabled:text-[#99918B]">
        <span className={selected ? "text-[#312B27]" : "text-[#928A84]"}>{selected ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(selected) : label}</span>
        <CalendarDays className="size-4 text-[#7A1D1B]" />
      </button>
      {open && !disabled && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[190] w-[292px] rounded-2xl border border-[#E4DCD6] bg-white p-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(shownMonth.getFullYear(), shownMonth.getMonth() - 1, 1).getTime())} className="rounded-lg p-2 hover:bg-[#FAF5F2]"><ChevronLeft className="size-4" /></button>
            <strong className="text-xs text-[#2D2723]">{new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(shownMonth)}</strong>
            <button type="button" aria-label="Next month" onClick={() => setMonth(new Date(shownMonth.getFullYear(), shownMonth.getMonth() + 1, 1).getTime())} className="rounded-lg p-2 hover:bg-[#FAF5F2]"><ChevronRight className="size-4" /></button>
          </div>
          <div className="mt-3 grid grid-cols-7 text-center text-[9px] font-black uppercase text-[#9A928C]">{["Su","Mo","Tu","We","Th","Fr","Sa"].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((date, index) => date ? <button key={date.toISOString()} type="button" disabled={date < today} onClick={() => { onChange(toValue(date)); setOpen(false); }} className={`h-8 rounded-lg text-[11px] font-bold transition disabled:text-[#D3CDC8] ${value === toValue(date) ? "bg-[#7A1D1B] text-white" : "text-[#4B443F] hover:bg-[#FFF1EE] hover:text-[#7A1D1B]"}`}>{date.getDate()}</button> : <span key={`blank-${index}`} />)}
          </div>
          <div className="mt-3 flex gap-2 border-t border-[#EEE8E3] pt-3">
            {[6, 12].map((months) => <button key={months} type="button" onClick={() => { const date = new Date(); date.setMonth(date.getMonth() + months); onChange(toValue(date)); setOpen(false); }} className="flex-1 rounded-lg bg-[#FAF5F2] px-2 py-2 text-[10px] font-bold text-[#7A1D1B] hover:bg-[#FFF0EC]">+{months} months</button>)}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import type { ReactNode } from "react";
import { invalidateReadCache } from "@/lib/auth";
import { requestDataRefresh } from "@/lib/data-refresh";
export const panel = "rounded-2xl border border-[#E8E1DB] bg-white p-5 sm:p-6";
export const input = "rounded-xl border border-[#DCD4CD] bg-white px-3 py-2 text-sm text-[#211D1A]";
export const button = "rounded-xl border border-[#7A1D1B] px-4 py-2 text-sm font-bold text-[#7A1D1B] disabled:opacity-40";
export function money(value: number) { return `NPR ${value.toLocaleString("en-NP", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
export function WorkspaceHeader({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-black text-[#211D1A]">{title}</h1><p className="mt-1 text-sm text-[#746E69]">{description}</p></div><div className="flex flex-wrap gap-2">{children}<button type="button" className={button} onClick={() => { invalidateReadCache(); requestDataRefresh(); }}>Refresh</button></div></header>;
}
export function ReadStatus({ loading, error }: { loading: boolean; error: string | null }) {
  return <>{loading && <p role="status" className={panel}>Loading…</p>}{error && <p role="alert" className={`${panel} text-red-800`}>{error} Use Refresh to try again.</p>}</>;
}
export function Metric({ label, value }: { label: string; value: ReactNode }) {
  return <div className={panel}><p className="text-xs font-bold uppercase tracking-wide text-[#746E69]">{label}</p><p className="mt-2 text-2xl font-black text-[#211D1A]">{value}</p></div>;
}
export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  return <nav aria-label="Results pages" className="flex items-center gap-3"><button className={button} disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button><span className="text-sm">Page {page} of {Math.max(1, totalPages)}</span><button className={button} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next</button></nav>;
}

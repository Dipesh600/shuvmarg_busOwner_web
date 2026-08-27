import { Clock3, PauseCircle, UserCheck } from "lucide-react";

export interface AgentSummary {
  active: number;
  invited: number;
  suspended: number;
}

const cards = [
  { key: "active", label: "Active access", help: "Invitation accepted", icon: UserCheck, tone: "bg-emerald-50 text-emerald-700" },
  { key: "invited", label: "Invites waiting", help: "Not accepted yet", icon: Clock3, tone: "bg-amber-50 text-amber-700" },
  { key: "suspended", label: "Paused access", help: "Selling is stopped", icon: PauseCircle, tone: "bg-neutral-100 text-neutral-600" },
] as const;

export default function AgentSummaryKpis({ summary, loading = false }: { summary: AgentSummary; loading?: boolean }) {
  return <div className="grid gap-3 sm:grid-cols-3">{cards.map(({ key, label, help, icon: Icon, tone }) => (
    <div key={key} className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div><p className="text-xs font-semibold text-neutral-500">{label}</p><p className="mt-1 text-2xl font-bold text-neutral-900">{loading ? "—" : summary[key]}</p><p className="mt-0.5 text-xs text-neutral-400">{help}</p></div>
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span>
    </div>
  ))}</div>;
}

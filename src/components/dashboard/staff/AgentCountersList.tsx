import { Store } from "lucide-react";

interface AgentCountersListProps {
  searchQuery: string;
}

export default function AgentCountersList({ searchQuery }: AgentCountersListProps) {
  return (
    <section className="rounded-[24px] border border-neutral-200 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700">
        <Store className="h-8 w-8" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-neutral-900">
        {searchQuery.trim() ? "No matching agents" : "No partner agents connected"}
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-neutral-500">
        Partner agents will appear here after the agent account, permission, and audit backend is implemented. No sample or fabricated counters are shown.
      </p>
      <button type="button" disabled className="mt-6 rounded-xl bg-neutral-100 px-5 py-3 text-sm font-bold text-neutral-400">
        Agent onboarding unavailable
      </button>
    </section>
  );
}

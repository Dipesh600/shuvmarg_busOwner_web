import React from "react";
import { Search } from "lucide-react";

interface FleetSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  count: number;
}

export function FleetSearch({ query, onQueryChange, count }: FleetSearchProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <p className="shrink-0 text-xs font-bold text-[#746E69]">
        {count} bus{count === 1 ? "" : "es"}
      </p>
      <div className="relative flex-1">
        <Search className="absolute left-4 top-3.5 size-4 text-[#938A82]" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search buses by name, number, or class"
          className="h-11 w-full rounded-xl border border-[#E8E1DB] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#7A1D1B]"
        />
      </div>
    </div>
  );
}

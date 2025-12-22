"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { MatchListItem } from "@/types/matchList";

export function MatchSelector({
  matches,
  selected,
}: {
  matches: MatchListItem[];
  selected: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const matchId = e.target.value;
    const sp = new URLSearchParams(params.toString());
    sp.set("matchId", matchId);
    router.push(`/?${sp.toString()}`);
  }

  return (
    <div className="relative">
      <select
        value={selected}
        onChange={onChange}
        className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 pr-8 text-sm"
      >
        {matches.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50"
      />
    </div>
  );
}

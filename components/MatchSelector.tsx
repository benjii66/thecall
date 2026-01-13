"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";
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
  const [isPending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const matchId = e.target.value;
    if (!matchId || matchId === selected) return;

    startTransition(() => {
      const sp = new URLSearchParams(params.toString());
      sp.set("matchId", matchId);
      router.push(`/match?${sp.toString()}`);
    });
  }

  return (
    <div className="relative">
      <select
        value={selected}
        onChange={onChange}
        disabled={isPending}
        className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 pr-8 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {matches.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>

      {isPending ? (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <LoadingSpinner size={14} />
        </div>
      ) : (
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50"
        />
      )}
    </div>
  );
}

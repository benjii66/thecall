"use client";

import { useRouter, useSearchParams } from "next/navigation";

type MatchType = "all" | "draft" | "ranked";

export function MatchTypeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const type = (searchParams.get("type") ?? "all") as MatchType;
  const matchId = searchParams.get("matchId");

  function onChange(newType: MatchType) {
    const params = new URLSearchParams();

    params.set("type", newType);
    if (matchId) params.set("matchId", matchId);

    router.push(`/?${params.toString()}`);
  }

  return (
    <select
      value={type}
      onChange={(e) => onChange(e.target.value as MatchType)}
      className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
    >
      <option value="all">Toutes les parties</option>
      <option value="draft">Draft</option>
      <option value="ranked">Classées</option>
    </select>
  );
}

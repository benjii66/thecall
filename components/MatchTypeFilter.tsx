"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { useLanguage } from "@/lib/language";

type MatchType = "all" | "draft" | "ranked";

export function MatchTypeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { t } = useLanguage();

  const type = (searchParams.get("type") ?? "all") as MatchType;
  const matchId = searchParams.get("matchId");

  function onChange(newType: MatchType) {
    if (newType === type) return; // Pas de changement

    startTransition(() => {
      const params = new URLSearchParams();

      params.set("type", newType);
      if (matchId) params.set("matchId", matchId);

      router.push(`/match?${params.toString()}`);
    });
  }

  return (
    <div className="relative">
      <select
        value={type}
        onChange={(e) => onChange(e.target.value as MatchType)}
        disabled={isPending}
        className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 pr-8 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <option value="all">{t("matchType.all")}</option>
        <option value="draft">{t("matchType.draft")}</option>
        <option value="ranked">{t("matchType.ranked")}</option>
      </select>
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <LoadingSpinner size={14} />
        </div>
      )}
    </div>
  );
}

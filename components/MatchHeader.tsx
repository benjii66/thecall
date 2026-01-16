"use client";

import { useLanguage } from "@/lib/language";

export function MatchHeader() {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
        {t("match.matchCenter")}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
        {t("match.matchOverview")}
      </h1>
      <p className="text-sm text-white/60">
        {t("match.matchOverviewDesc")}
      </p>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { HoloTypography } from "./HoloTypography";
import { useLanguage } from "@/lib/language";
import type { MatchListItem } from "@/types/matchList";

export function MatchListStats({ matches }: { matches: MatchListItem[] }) {
  const { t } = useLanguage();

  const stats = useMemo(() => {
    if (!matches.length) return { total: 0, winrate: 0 };
    const wins = matches.filter((m) => m.win).length;
    return {
      total: matches.length,
      winrate: Math.round((wins / matches.length) * 100),
    };
  }, [matches]);

  if (!matches.length) return null;

  return (
    <div className="flex items-center gap-6 px-2">
      <div className="flex flex-col items-end">
        <span className="text-xs tracking-wider text-white/40 font-medium">
          {t("matchList.totalGames")}
        </span>
        <HoloTypography variant="subtitle" className="text-lg font-bold text-white/90">
          {stats.total}
        </HoloTypography>
      </div>
      
      <div className="h-8 w-px bg-white/10" />

      <div className="flex flex-col items-end">
        <span className="text-xs tracking-wider text-white/40 font-medium">
          {t("matchList.winrate")}
        </span>
        <div className="flex items-baseline gap-1">
            <HoloTypography variant="title" className={`text-lg font-bold ${stats.winrate >= 50 ? "text-cyan-400" : "text-red-400"}`}>
            {stats.winrate}%
            </HoloTypography>
        </div>
      </div>
    </div>
  );
}

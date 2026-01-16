"use client";

import { useLanguage } from "@/lib/language";

type VictoryDefeatBadgeProps = {
  win: boolean;
  className?: string;
};

export function VictoryDefeatBadge({ win, className = "" }: VictoryDefeatBadgeProps) {
  const { t } = useLanguage();
  
  return (
    <div
      className={`rounded-full border px-4 py-1.5 text-xs font-semibold tracking-wide ${
        win
          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
          : "border-red-400/30 bg-red-500/10 text-red-200"
      } ${className}`}
    >
      {win ? t("matchList.victory") : t("matchList.defeat")}
    </div>
  );
}

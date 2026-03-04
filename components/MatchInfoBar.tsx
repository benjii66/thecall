"use client";

import { InfoPill } from "./InfoPill";
import { useLanguage } from "@/lib/language";

type MatchInfoBarProps = {
  win: boolean;
  role: string;
  champion: string;
};

export function MatchInfoBar({ win, role, champion }: MatchInfoBarProps) {
  const { t } = useLanguage();
  
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
      <InfoPill
        labelKey="match.result"
        value={win ? t("matchList.victory") : t("matchList.defeat")}
        tone={win ? "good" : "bad"}
      />
      <div className="h-4 w-px bg-white/10 hidden sm:block" />
      <InfoPill labelKey="match.yourRole" value={role} />
      <div className="h-4 w-px bg-white/10 hidden sm:block" />
      <InfoPill labelKey="match.yourChampion" value={champion} />
    </div>
  );
}

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
    <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
      <InfoPill
        labelKey="match.result"
        value={win ? t("matchList.victory") : t("matchList.defeat")}
        tone={win ? "good" : "bad"}
      />
      <InfoPill labelKey="match.yourRole" value={role} />
      <InfoPill labelKey="match.yourChampion" value={champion} />
    </div>
  );
}

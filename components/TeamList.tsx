"use client";

import Image from "next/image";
import { useLanguage } from "@/lib/language";
import type { TeamPlayer } from "@/types/match";

const DD_VERSION = "14.23.1";
const champIcon = (name: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${DD_VERSION}/img/champion/${name}.png`;

type TeamListProps = {
  titleKey?: string;
  title?: string;
  team: TeamPlayer[];
  tone: "ally" | "enemy";
};

export function TeamList({ titleKey, title, team, tone }: TeamListProps) {
  const { t } = useLanguage();
  const displayTitle = titleKey ? t(titleKey) : title || "";
  const headerTone = tone === "ally" ? "text-cyan-200/90" : "text-red-200/90";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${headerTone}`}>{displayTitle}</h3>
        <div className="h-px w-24 bg-gradient-to-r from-white/0 via-white/15 to-white/0" />
      </div>

      <ul className="space-y-2">
        {team.map((p) => (
          <li
            key={`${displayTitle}-${p.champion}`}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2"
          >
            <Image
              src={champIcon(p.champion)}
              alt={p.champion}
              width={28}
              height={28}
              className="rounded-lg"
            />
            <span className="flex-1 text-sm text-white/90">{p.champion}</span>
            <span className="text-sm text-white/55">{p.kda}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { AnimatedItem } from "./AnimatedSection";
import { DuelCard } from "./DuelCard";
import { VictoryDefeatBadge } from "./VictoryDefeatBadge";
import { MatchNoOpponentMessage } from "./MatchMessages";
import { useLanguage } from "@/lib/language";
import type { PlayerSummary } from "@/types/match";

type DuelSectionProps = {
  me: PlayerSummary;
  opponent: PlayerSummary | null;
};

export function DuelSection({ me, opponent }: DuelSectionProps) {
  const { t } = useLanguage();
  
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3 lg:items-stretch">
      <AnimatedItem>
        <DuelCard
          color="cyan"
          title={t("match.you")}
          champion={me.champion}
          role={me.role}
          kda={me.kda}
          kp={me.kp}
          gold={me.gold}
          win={me.win}
        />
      </AnimatedItem>
      <div className="flex lg:hidden flex-col items-center justify-center gap-2 py-2">
        <div className="text-white/20 font-semibold text-3xl">{t("matchList.vs")}</div>
        <VictoryDefeatBadge win={me.win} />
      </div>
      <div className="hidden lg:flex flex-col items-center justify-center gap-3">
        <div className="text-white/20 font-semibold text-5xl">{t("matchList.vs")}</div>
        <VictoryDefeatBadge win={me.win} className="px-5 py-2 text-sm" />
      </div>
      {opponent ? (
        <AnimatedItem>
          <DuelCard
            color="red"
            title={t("match.opponent")}
            champion={opponent.champion}
            role={opponent.role}
            kda={opponent.kda}
            kp={opponent.kp}
            gold={opponent.gold}
            win={!me.win}
          />
        </AnimatedItem>
      ) : (
        <MatchNoOpponentMessage />
      )}
    </div>
  );
}

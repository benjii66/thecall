"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState } from "react";
import { motion } from "framer-motion";
import { LoadingSpinner } from "./LoadingSpinner";
import { GlowOverlay } from "./GlowOverlay";
import type { MatchListItem } from "@/types/matchList";
import { useLanguage } from "@/lib/language";

const DD_VERSION = "14.18.1";
const champIcon = (name: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${DD_VERSION}/img/champion/${name}.png`;

function getQueueLabel(queueId: number, t: (key: string) => string): string {
  // Queue IDs Riot
  if (queueId === 420) return t("matchList.queueRankedSolo");
  if (queueId === 440) return t("matchList.queueRankedFlex");
  if (queueId === 450) return t("matchList.queueAram");
  if (queueId === 400) return t("matchList.queueNormalDraft");
  if (queueId === 700) return t("matchList.queueClash");
  return t("matchList.queueNormal");
}

export function MatchList({ matches }: { matches: MatchListItem[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showGlow, setShowGlow] = useState(false);
  const { t } = useLanguage();

  const handleMatchClick = (matchId: string) => {
    setShowGlow(true);
    
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("matchId", matchId);
      params.delete("tab");
      router.push(`/match?${params.toString()}`);
      
      // Hide glow après transition
      setTimeout(() => setShowGlow(false), 800);
    });
  };

  return (
    <>
      <GlowOverlay show={showGlow} />
      <div className="space-y-2">
        {isPending && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4"
          >
            <LoadingSpinner size={16} />
            <span className="text-sm text-cyan-300">{t("matchList.loading")}</span>
          </motion.div>
        )}
        {matches.map((match, i) => {
          const durationMin = Math.floor(match.duration / 60);
          const durationSec = String(match.duration % 60).padStart(2, "0");

        return (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <motion.button
              onClick={() => handleMatchClick(match.id)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.06] relative overflow-hidden group"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {/* Glow effect on hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100"
                initial={false}
                transition={{ duration: 0.3 }}
              />
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Champion joueur */}
                <div className="relative flex-shrink-0">
                  <Image
                    src={champIcon(match.champion)}
                    alt={match.champion}
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                  {match.win && (
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-1">
                      <div className="h-2 w-2 rounded-full bg-emerald-200" />
                    </div>
                  )}
                </div>

                {/* VS */}
                <div className="hidden sm:block text-white/30 text-sm">{t("matchList.vs")}</div>

                {/* Champion opponent */}
                <div className="relative flex-shrink-0">
                  <Image
                    src={champIcon(match.opponent)}
                    alt={match.opponent}
                    width={48}
                    height={48}
                    className="rounded-lg opacity-80"
                  />
                  {!match.win && (
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-red-500 p-1">
                      <div className="h-2 w-2 rounded-full bg-red-200" />
                    </div>
                  )}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className="text-sm font-semibold text-white/90 truncate">
                      {match.champion}
                    </span>
                    <span className="text-white/40 hidden sm:inline">{t("matchList.vsShort")}</span>
                    <span className="text-sm text-white/70 truncate">{match.opponent}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 sm:gap-3 text-xs text-white/50 flex-wrap">
                    <span className="truncate">{getQueueLabel(match.queueId, t)}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{durationMin}:{durationSec}</span>
                  </div>
                </div>

                {/* Résultat */}
                <div
                  className={`rounded-full border px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold flex-shrink-0 ${
                    match.win
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                      : "border-red-400/30 bg-red-500/10 text-red-200"
                  }`}
                >
                  <span className="hidden sm:inline">{match.win ? t("matchList.victory") : t("matchList.defeat")}</span>
                  <span className="sm:hidden">{match.win ? t("matchList.victoryShort") : t("matchList.defeatShort")}</span>
                </div>
              </div>
            </motion.button>
          </motion.div>
        );
      })}
      </div>
    </>
  );
}

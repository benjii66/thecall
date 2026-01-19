"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { RoleStats } from "@/types/profile";
import { useLanguage } from "@/lib/language";

const DD_VERSION = "14.23.1";
const champIcon = (name: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${DD_VERSION}/img/champion/${name}.png`;

export function ProfileStats({ roleStats }: { roleStats: RoleStats[] }) {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-4">
      {roleStats.map((role, i) => (
        <motion.div
          key={role.role}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{role.role}</h3>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-white/50">{t("profile.stats.games")}: </span>
                <span className="font-semibold text-white/90">{role.games}</span>
              </div>
              <div>
                <span className="text-white/50">{t("profile.stats.winRate")}: </span>
                <span
                  className={`font-semibold ${
                    role.winRate >= 50
                      ? "text-emerald-400"
                      : role.winRate >= 45
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {role.winRate}%
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-white/50 mb-1">{t("profile.stats.avgKDA")}</p>
              <p className="text-sm font-semibold text-white/90">{role.avgKDA}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-white/50 mb-1">{t("profile.stats.avgKP")}</p>
              <p className="text-sm font-semibold text-white/90">{role.avgKP}%</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-white/50 mb-1">{t("profile.stats.avgGold")}</p>
              <p className="text-sm font-semibold text-white/90">
                {role.avgGold.toLocaleString()}
              </p>
            </div>
          </div>

          {role.mostPlayedChampions.length > 0 && (
            <div>
              <p className="text-xs text-white/50 mb-2">{t("profile.stats.mostPlayedChampions")}</p>
              <div className="flex gap-2">
                {role.mostPlayedChampions.map((champ) => (
                  <div
                    key={champ.champion}
                    className="relative rounded-lg border border-white/10 bg-black/20 p-2"
                  >
                    <Image
                      src={champIcon(champ.champion)}
                      alt={champ.champion}
                      width={40}
                      height={40}
                      className="rounded"
                    />
                    <div className="absolute -bottom-1 -right-1 rounded-full border border-white/10 bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold">
                      {champ.games}
                    </div>
                    <div className="mt-1 text-center text-[10px] text-white/60">
                      {champ.winRate}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

"use client";

import Image from "next/image";
import { useLanguage } from "@/lib/language";
import { GlassCard } from "@/components/GlassCard";

const DD_VERSION = "14.23.1";
const champIcon = (name: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${DD_VERSION}/img/champion/${name}.png`;
const champSplash = (name: string) =>
  `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${name}_0.jpg`;

type DuelCardProps = {
  title: string;
  champion: string;
  role: string;
  kda: string;
  kp: number;
  gold: number;
  color: "cyan" | "red";
  win: boolean;
};

export function DuelCard({
  title,
  champion,
  role,
  kda,
  kp,
  gold,
  color,
  win,
}: DuelCardProps) {
  const { t } = useLanguage();
  
  const borderGlow =
    color === "cyan"
      ? "shadow-[0_0_0_1px_rgba(34,211,238,0.15),0_30px_100px_rgba(0,0,0,0.65)]"
      : "shadow-[0_0_0_1px_rgba(248,113,113,0.14),0_30px_100px_rgba(0,0,0,0.65)]";

  const ring = color === "cyan" ? "ring-cyan-400/20" : "ring-red-400/20";

  const badge = win
    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
    : "border-red-400/30 bg-red-500/10 text-red-200";

  return (
    <GlassCard
      className={`relative p-6 ${borderGlow} ring-1 ${ring}`}
      hoverEffect
    >
      <Image
        src={champSplash(champion)}
        alt=""
        fill
        className="object-cover opacity-[0.12]"
        priority
      />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,0,0,0.75),rgba(0,0,0,0.35),rgba(0,0,0,0.75))]" />
      <div className="absolute inset-0 bg-[radial-gradient(800px_260px_at_15%_15%,rgba(255,255,255,0.10),transparent_60%)]" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Image
                src={champIcon(champion)}
                alt={champion}
                width={54}
                height={54}
                className="rounded-xl"
              />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/50 px-2 py-0.5 text-[10px] tracking-wide text-white/80">
                {role}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                {title}
              </p>
              <h3 className="text-lg font-semibold leading-tight">
                {champion}
              </h3>
            </div>
          </div>

          <div
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${badge}`}
          >
            {win ? t("matchList.victoryShort") : t("matchList.defeatShort")}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat label="KDA" value={kda} />
          <Stat label="KP" value={`${kp}%`} />
          <Stat label="Gold" value={`${gold}`} />
        </div>
      </div>
    </GlassCard>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white/90">{value}</p>
    </div>
  );
}

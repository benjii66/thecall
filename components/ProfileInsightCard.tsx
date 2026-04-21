"use client";


import { Target, AlertCircle, CheckCircle } from "lucide-react";
import type { PlayerProfile } from "@/types/profile";
import { useLanguage } from "@/lib/language";

type Insight = PlayerProfile["insights"][number];

export function ProfileInsightCard({ insight }: { insight: Insight }) {
  const { t } = useLanguage();
  
  const icons = {
    strength: CheckCircle,
    weakness: AlertCircle,
    recommendation: Target,
  };

  const colors = {
    strength: "border-emerald-500/30 bg-emerald-500/10",
    weakness: "border-red-500/30 bg-red-500/10",
    recommendation: "border-cyan-500/30 bg-cyan-500/10",
  };

  const textColors = {
    strength: "text-emerald-300",
    weakness: "text-red-300",
    recommendation: "text-cyan-300",
  };

  const Icon = icons[insight.type];
  const colorClass = colors[insight.type];
  const textColor = textColors[insight.type];
  
  const typeLabels = {
    strength: t("profile.insight.strength"),
    weakness: t("profile.insight.weakness"),
    recommendation: t("profile.insight.recommendation"),
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-5 backdrop-blur transition-all hover:bg-white/5 ${colorClass}`}
    >
      {/* Glow effect */}
      <div className={`absolute -inset-1 bg-gradient-to-r ${insight.type === "strength" ? "from-emerald-500/20" : insight.type === "weakness" ? "from-red-500/20" : "from-cyan-500/20"} to-transparent opacity-0 blur-xl transition-opacity group-hover:opacity-100`} />

      <div className="relative">
        <div className="mb-3 flex items-start justify-between">
          <div className={`flex items-center gap-2 ${textColor}`}>
            <Icon size={18} />
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">
              {typeLabels[insight.type]}
            </span>
          </div>
          {insight.priority === "high" && (
            <span className="rounded-full border border-red-400/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-300">
              {t("profile.insight.priority")}
            </span>
          )}
        </div>

        <h3 className="mb-2 text-base font-semibold text-white/90">
          {insight.title}
        </h3>

        <p className="text-sm leading-relaxed text-white/70">
          {insight.description}
        </p>

        {insight.data && insight.data.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {insight.data.map((d, i) => (
              <div
                key={i}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs"
              >
                {!(String(d.value).includes("%")) && <span className="text-white/50">{d.label}:</span>}{" "}
                <span className="font-semibold text-white/90">{d.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

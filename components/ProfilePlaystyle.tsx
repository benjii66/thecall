"use client";

import { motion } from "framer-motion";
import { Zap, Target, Users } from "lucide-react";
import type { PlayerProfile } from "@/types/profile";

export function ProfilePlaystyle({
  playstyle,
}: {
  playstyle: PlayerProfile["playstyle"];
}) {
  const indicators = [
    {
      label: "Agression",
      value: playstyle.aggression,
      icon: Zap,
      color: playstyle.aggression === "high" ? "red" : playstyle.aggression === "medium" ? "yellow" : "green",
    },
    {
      label: "Focus objectifs",
      value: playstyle.objectiveFocus,
      icon: Target,
      color: playstyle.objectiveFocus === "high" ? "green" : playstyle.objectiveFocus === "medium" ? "yellow" : "red",
    },
    {
      label: "Présence team fights",
      value: playstyle.teamFightPresence,
      icon: Users,
      color: playstyle.teamFightPresence === "high" ? "green" : playstyle.teamFightPresence === "medium" ? "yellow" : "red",
    },
  ];

  const getLevel = (v: string) => {
    if (v === "high") return 3;
    if (v === "medium") return 2;
    return 1;
  };

  const getColorClass = (color: string) => {
    if (color === "red") return "bg-red-500/20 border-red-500/30 text-red-300";
    if (color === "yellow") return "bg-yellow-500/20 border-yellow-500/30 text-yellow-300";
    return "bg-emerald-500/20 border-emerald-500/30 text-emerald-300";
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
      <p className="mb-6 text-sm leading-relaxed text-white/80">
        {playstyle.description}
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        {indicators.map((ind, i) => {
          const Icon = ind.icon;
          const level = getLevel(ind.value);
          const colorClass = getColorClass(ind.color);

          return (
            <motion.div
              key={ind.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className={`rounded-2xl border p-5 ${colorClass}`}
            >
              <div className="mb-4 flex items-center gap-3">
                <Icon size={20} />
                <span className="text-sm font-semibold">{ind.label}</span>
              </div>

              <div className="flex gap-1">
                {[1, 2, 3].map((lvl) => (
                  <div
                    key={lvl}
                    className={`h-2 flex-1 rounded-full transition-all ${
                      lvl <= level
                        ? ind.color === "red"
                          ? "bg-red-400"
                          : ind.color === "yellow"
                          ? "bg-yellow-400"
                          : "bg-emerald-400"
                        : "bg-white/10"
                    }`}
                  />
                ))}
              </div>

              <p className="mt-2 text-xs font-medium opacity-80">
                {ind.value === "high" ? "Élevé" : ind.value === "medium" ? "Moyen" : "Faible"}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

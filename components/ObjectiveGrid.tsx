"use client";

import { motion } from "framer-motion";

export type Objective = {
  label: string;
  minute: number;
  team: "ally" | "enemy";
};

type Props = {
  objectives: Objective[];
};

export function ObjectiveGrid({ objectives }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {objectives.map((obj, i) => (
        <motion.div
          key={`${obj.label}-${obj.minute}-${i}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl"
        >
          {/* Glow */}
          <div
            className={`absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full blur-3xl ${
              obj.team === "ally" ? "bg-cyan-400/20" : "bg-red-500/20"
            }`}
          />

          <div className="relative flex items-center justify-between">
            {/* LEFT */}
            <div>
              <div className="text-sm font-semibold tracking-wide">
                {obj.label}
              </div>
              <div className="text-xs text-white/50">{obj.minute}:00</div>
            </div>

            {/* RIGHT */}
            <div
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                obj.team === "ally"
                  ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                  : "border-red-400/30 bg-red-400/10 text-red-300"
              }`}
            >
              {obj.team === "ally" ? "ALLY" : "ENEMY"}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

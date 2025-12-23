"use client";

import {
  Sword,
  Skull,
  Users,
  Flame,
  Eye,
  Crown,
  Landmark,
  Bug,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TimelineEvent } from "@/types/timeline";

/* ----------------------------------
   ICONS
---------------------------------- */

const ICONS: Record<TimelineEvent["kind"], LucideIcon> = {
  kill: Sword,
  death: Skull,
  assist: Users,
  dragon: Flame,
  herald: Eye,
  baron: Crown,
  tower: Landmark,
  grub: Bug,
};

/* ----------------------------------
   COMPONENT
---------------------------------- */

export function TimelineVertical({ events }: { events: TimelineEvent[] }) {
  if (!events.length) return null;

  const sorted = [...events].sort(
    (a, b) => a.minute * 60 + a.second - (b.minute * 60 + b.second)
  );

  return (
    <section className="relative mt-12 rounded-2xl border border-white/10 bg-gradient-to-b from-black/40 to-black/20 p-8">
      {/* TITLE */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">
          Timeline
        </h3>
        <p className="text-xs text-white/40">Objectifs & événements clés</p>
      </div>

      {/* LINE */}
      <div className="absolute left-1/2 top-28 bottom-8 w-px bg-gradient-to-b from-cyan-500/40 via-white/10 to-red-500/40" />

      {/* EVENTS */}
      <div className="space-y-10">
        {sorted.map((e, i) => {
          const Icon = ICONS[e.kind];
          const isAlly = e.team === "ally";

          return (
            <div
              key={i}
              className={`relative flex items-start ${
                isAlly ? "justify-start pr-[52%]" : "justify-end pl-[52%]"
              }`}
            >
              {/* CONTENT CARD */}
              <div
                className={`w-full max-w-md rounded-xl border p-4 backdrop-blur
                ${
                  isAlly
                    ? "border-cyan-500/20 bg-cyan-500/5 text-cyan-100"
                    : "border-red-500/20 bg-red-500/5 text-red-100"
                }`}
              >
                <div className="mb-1 flex items-center justify-between text-xs text-white/50">
                  <span className="uppercase tracking-wide">{e.kind}</span>
                  <span>
                    {e.minute}:{String(e.second).padStart(2, "0")}
                  </span>
                </div>

                <div className="text-sm font-medium">
                  {e.label ?? "Événement"}
                </div>

                {e.meta?.assistingChampions?.length && (
                  <div className="mt-1 text-xs text-white/40">
                    Assists : {e.meta.assistingChampions.join(", ")}
                  </div>
                )}
              </div>

              {/* ICON NODE */}
              <div
                className={`absolute left-1/2 top-3 -translate-x-1/2 flex h-9 w-9 items-center justify-center rounded-full border
                ${
                  isAlly
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                    : "bg-red-500/20 text-red-300 border-red-500/30"
                }`}
              >
                <Icon size={16} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

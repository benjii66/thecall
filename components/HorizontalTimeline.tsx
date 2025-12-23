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
import { TimelineEvent } from "@/types/timeline";

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
   PRIORITY
---------------------------------- */

const PRIORITY: TimelineEvent["kind"][] = [
  "baron",
  "dragon",
  "herald",
  "grub",
  "tower",
  "kill",
  "assist",
  "death",
];

const getMainEvent = (events: TimelineEvent[]) =>
  [...events].sort(
    (a, b) => PRIORITY.indexOf(a.kind) - PRIORITY.indexOf(b.kind)
  )[0];

/* ----------------------------------
   COMPONENT
---------------------------------- */

export function HorizontalTimeline({ events }: { events: TimelineEvent[] }) {
  if (!events.length) return null;

  const maxMinute = Math.max(40, ...events.map((e) => e.minute));

  // ⬅️ AÉRATION ARTIFICIELLE
  const SPACING = 1.25;

  const eventsByMinute = events.reduce<Record<number, TimelineEvent[]>>(
    (acc, e) => {
      if (!acc[e.minute]) acc[e.minute] = [];
      acc[e.minute].push(e);
      return acc;
    },
    {}
  );

  return (
    <section className="relative mt-10 rounded-xl border border-white/10 bg-black/20 px-6 py-5">
      {/* TIME SCALE */}
      <div className="mb-4 flex justify-between text-[11px] text-white/30">
        {[0, 10, 20, 30, 40].map((t) => (
          <span key={t}>{t}:00</span>
        ))}
      </div>

      {/* BASE LINE */}
      <div className="relative h-[2px] w-full rounded-full bg-white/10" />

      {/* EVENTS */}
      {Object.entries(eventsByMinute).map(([min, group]) => {
        const minute = Number(min);
        const main = getMainEvent(group);
        const Icon = ICONS[main.kind];

        const left = `${Math.min(100, (minute / maxMinute) * 100 * SPACING)}%`;

        return (
          <div
            key={minute}
            className="group absolute -top-[6px]"
            style={{ left }}
          >
            {/* DOT */}
            <div
              className={`relative flex h-6 w-6 items-center justify-center rounded-full
              ${
                main.team === "ally"
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "bg-red-500/20 text-red-300"
              }
              border border-white/10`}
            >
              <Icon size={14} />

              {group.length > 1 && (
                <span className="absolute -right-2 -top-2 rounded-full bg-black px-1 text-[10px] text-white/60">
                  +{group.length - 1}
                </span>
              )}
            </div>

            {/* TOOLTIP */}
            <div
              className="pointer-events-none absolute top-full left-1/2 z-20
              mt-3 w-[260px] -translate-x-1/2 rounded-lg
              bg-black/95 p-3 text-xs text-white/90 opacity-0
              shadow-lg backdrop-blur
              transition-all duration-200 group-hover:opacity-100"
            >
              <div className="space-y-2">
                {group.map((e, i) => (
                  <div key={i}>
                    <div className="font-medium">
                      {e.label}
                      <span className="ml-1 text-white/40">
                        — {e.minute}:{String(e.second).padStart(2, "0")}
                      </span>
                    </div>

                    {e.meta?.assistingChampions?.length ? (
                      <div className="text-white/50">
                        Assists: {e.meta.assistingChampions.join(", ")}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
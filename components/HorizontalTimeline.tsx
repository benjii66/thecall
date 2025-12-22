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
  const ticks = [0, 5, 10, 20, 30, 40];

  const eventsByMinute = events.reduce<Record<number, TimelineEvent[]>>(
    (acc, e) => {
      if (!acc[e.minute]) acc[e.minute] = [];
      acc[e.minute].push(e);
      return acc;
    },
    {}
  );

  return (
    <div className="relative mt-12">
      {/* GRADUATION */}
      <div className="mb-3 flex justify-between text-xs text-white/40">
        {ticks.map((t) => (
          <div key={t}>{t}:00</div>
        ))}
      </div>

      {/* BASE LINE */}
      <div className="relative h-1 w-full rounded-full bg-black/10" />

      {/* EVENTS */}
      {Object.entries(eventsByMinute).map(([min, group]) => {
        const minute = Number(min);
        const main = getMainEvent(group);
        const Icon = ICONS[main.kind];

        const left = `${(minute / maxMinute) * 100}%`;
        const vertical =
          main.team === "ally" ? "-translate-y-[140%]" : "translate-y-[20%]";

        return (
          <div
            key={minute}
            className={`group absolute ${vertical}`}
            style={{ left }}
          >
            {/* DOT */}
            <div
              className={`relative flex h-7 w-7 items-center justify-center rounded-full
                ${
                  main.team === "ally"
                    ? "bg-cyan-500/30 text-cyan-300"
                    : "bg-red-500/30 text-red-300"
                }
                border border-white/10`}
            >
              <Icon size={15} />
              {group.length > 1 && (
                <div className="absolute -top-2 -right-2 text-[10px] bg-black px-1 rounded-full">
                  +{group.length - 1}
                </div>
              )}
            </div>

            {/* TOOLTIP */}
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
              rounded-md bg-black/90 px-3 py-2 text-xs opacity-0
              group-hover:opacity-100 transition space-y-1 min-w-[220px]"
            >
              {group.map((e, i) => (
                <div key={i}>
                  <div className="font-medium">
                    {e.label} — {e.minute}:{String(e.second).padStart(2, "0")}
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
        );
      })}
    </div>
  );
}

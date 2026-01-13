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
  Coins,
  CircleDot,
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
  gold: Coins,
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

/* ----------------------------------
   LANE ASSIGNMENT (0 = near baseline, 1 = further)
---------------------------------- */

const KIND_LANE: Record<TimelineEvent["kind"], number> = {
  kill: 0,
  death: 0,
  assist: 0,
  tower: 1,
  dragon: 1,
  herald: 1,
  grub: 1,
  baron: 1,
  gold: 2,
};

/* ----------------------------------
   TYPES
---------------------------------- */

type Cluster = {
  bin: number;
  team: "ally" | "enemy";
  lane: number;
  events: TimelineEvent[];
  mainEvent: TimelineEvent;
  timeSec: number;
};

/* ----------------------------------
   COMPONENT
---------------------------------- */

export function HorizontalTimeline({ events }: { events: TimelineEvent[] }) {
  if (!events.length) return null;

  const DENSE_MODE = false; // true = Key Moments only, false = all events
  const BIN_SIZE_SEC = 30; // Bins plus larges pour moins de clusters et plus d'espace

  // 1) Filter mode
  let filteredEvents = events.filter((e) => e.kind !== "gold");

  if (DENSE_MODE) {
    filteredEvents = filteredEvents.filter((e) => {
      if (
        e.kind === "dragon" ||
        e.kind === "herald" ||
        e.kind === "baron" ||
        e.kind === "grub" ||
        e.kind === "tower"
      ) {
        return true;
      }
      if (e.kind === "kill" || e.kind === "death" || e.kind === "assist") {
        return e.involved === true;
      }
      return false;
    });
  }

  if (!filteredEvents.length) return null;

  // 2) Build clusters (bin + team + lane + death flag pour séparer kills et morts)
  const clusterMap = new Map<string, TimelineEvent[]>();

  for (const event of filteredEvents) {
    const timeSec = event.minute * 60 + event.second;
    const bin = Math.floor(timeSec / BIN_SIZE_SEC);
    const lane = KIND_LANE[event.kind] ?? 0;
    // Pour les alliés, on sépare les deaths des autres événements
    // Pour les ennemis, on garde comme avant
    const deathFlag =
      event.team === "ally" && event.kind === "death" ? "-death" : "";
    const key = `${bin}-${event.team}-${lane}${deathFlag}`;

    if (!clusterMap.has(key)) {
      clusterMap.set(key, []);
    }
    clusterMap.get(key)!.push(event);
  }

  const clusters: Cluster[] = [];

  for (const [key, clusterEvents] of clusterMap.entries()) {
    // Parse key: "bin-team-lane" or "bin-team-lane-death"
    const parts = key.split("-");
    const bin = Number(parts[0]);
    const team = parts[1] as "ally" | "enemy";
    const lane = Number(parts[2]);
    // parts[3] would be "death" if present

    const sorted = [...clusterEvents].sort((a, b) => {
      const prioDiff = PRIORITY.indexOf(a.kind) - PRIORITY.indexOf(b.kind);
      if (prioDiff !== 0) return prioDiff;
      const timeA = a.minute * 60 + a.second;
      const timeB = b.minute * 60 + b.second;
      return timeA - timeB;
    });

    // Si le cluster contient une mort du joueur, force mainEvent à être cette mort
    const playerDeath = sorted.find(
      (e) => e.kind === "death" && e.involved === true
    );
    const mainEvent = playerDeath ?? sorted[0];
    const avgTimeSec =
      sorted.reduce((sum, e) => sum + e.minute * 60 + e.second, 0) /
      sorted.length;

    clusters.push({
      bin,
      team,
      lane,
      events: sorted,
      mainEvent,
      timeSec: avgTimeSec,
    });
  }

  // Sort clusters by time for collision detection
  clusters.sort((a, b) => a.timeSec - b.timeSec);

  // 3) Compute max time for positioning (align with ticks)
  // Trouver la durée réelle de la partie (dernier événement avec secondes)
  const actualMaxTimeSec = Math.max(
    ...filteredEvents.map((e) => e.minute * 60 + e.second),
    60 // Minimum 1 minute
  );
  const actualMaxMinute = actualMaxTimeSec / 60;
  
  // Arrondir intelligemment par paliers de 5 minutes pour mieux zoomer
  // Si < 20 min → 20 min
  // Si 20-25 min → 25 min
  // Si 25-30 min → 30 min
  // Si 30-35 min → 35 min
  // Si > 35 min → arrondir à la dizaine supérieure (40, 50, etc.)
  let roundedMaxMinute: number;
  if (actualMaxMinute < 20) {
    roundedMaxMinute = 20;
  } else if (actualMaxMinute < 25) {
    roundedMaxMinute = 25;
  } else if (actualMaxMinute < 30) {
    roundedMaxMinute = 30;
  } else if (actualMaxMinute < 35) {
    roundedMaxMinute = 35;
  } else {
    // Pour les parties longues, arrondir à la dizaine supérieure
    roundedMaxMinute = Math.ceil(actualMaxMinute / 10) * 10;
  }
  
  // maxMinute est maintenant toujours >= 20 grâce à la logique ci-dessus
  const maxMinute = roundedMaxMinute;
  
  // Générer les ticks de temps adaptés à la durée
  // Si maxMinute = 25, on veut 0, 10, 20, 25
  // Si maxMinute = 30, on veut 0, 10, 20, 30
  // Si maxMinute = 35, on veut 0, 10, 20, 30, 35
  // Si maxMinute = 40, on veut 0, 10, 20, 30, 40
  const timeTicks: number[] = [];
  for (let i = 0; i <= maxMinute; i += 10) {
    timeTicks.push(i);
  }
  // Ajouter le tick final si ce n'est pas une dizaine (ex: 25, 35)
  if (maxMinute % 10 !== 0 && maxMinute > 0) {
    timeTicks.push(maxMinute);
  }
  timeTicks.sort((a, b) => a - b);
  
  // Le dernier tick définit la largeur maximale de la timeline (pour le positionnement)
  const lastTick = maxMinute;

  // 4) Positionnement précis temporel avec gestion des collisions verticales uniquement
  const CONTAINER_H = 208;
  const BASE_Y = CONTAINER_H / 2;
  const DOT_R = 14;
  const LANE_GAP = 45; // Plus d'espace entre les lanes
  const TEAM_GAP = 25; // Plus d'espace entre baseline et dots
  const VERTICAL_COLLISION_THRESHOLD = 35; // Distance verticale minimum entre deux bulles

  const clusterPositions: Array<{
    cluster: Cluster;
    leftPercent: number;
    topPx: number;
    verticalLane: number; // Lane verticale assignée pour éviter collisions
  }> = [];

  // Trier clusters par temps
  const sortedClusters = [...clusters].sort((a, b) => a.timeSec - b.timeSec);

  for (const cluster of sortedClusters) {
    // Position horizontale PRÉCISE basée sur le temps réel
    const clusterMinute = cluster.timeSec / 60;
    // Utiliser lastTick (arrondi) pour le calcul pour que tout reste dans les limites visuelles
    // Mais on s'assure qu'aucun événement ne dépasse 100%
    const leftPercent = Math.min(100, (clusterMinute / lastTick) * 100);
    
    // Calculer la position verticale de base
    const { team, lane, events } = cluster;
    const clusterHasAllyDeath = events.some(
      (e) => e.kind === "death" && e.team === "ally"
    );
    const baseLaneOffset = lane * LANE_GAP;
    const isBelow = team === "enemy" || clusterHasAllyDeath;

    // Trouver une lane verticale libre pour éviter les collisions
    // On cherche parmi les clusters proches temporellement (même minute ± 30 secondes)
    const nearbyClusters = clusterPositions.filter((cp) => {
      const timeDiff = Math.abs(cp.cluster.timeSec - cluster.timeSec);
      return timeDiff < 30; // 30 secondes de tolérance
    });

    // Assigner une lane verticale supplémentaire si nécessaire
    let verticalLane = 0;
    const maxVerticalLanes = 3; // Maximum 3 lanes supplémentaires par côté

    for (let v = 0; v < maxVerticalLanes; v++) {
      const candidateTopPx = isBelow
        ? BASE_Y + TEAM_GAP + baseLaneOffset + (v * VERTICAL_COLLISION_THRESHOLD)
        : BASE_Y - DOT_R - TEAM_GAP - baseLaneOffset - (v * VERTICAL_COLLISION_THRESHOLD);

      // Vérifier si cette position entre en collision avec un cluster proche
      const hasCollision = nearbyClusters.some((cp) => {
        const verticalDist = Math.abs(cp.topPx - candidateTopPx);
        return verticalDist < VERTICAL_COLLISION_THRESHOLD;
      });

      if (!hasCollision) {
        verticalLane = v;
        break;
      }
      verticalLane = v; // Si toutes les lanes sont occupées, on prend la dernière
    }

    // Calculer la position verticale finale
    const topPx = isBelow
      ? BASE_Y + TEAM_GAP + baseLaneOffset + (verticalLane * VERTICAL_COLLISION_THRESHOLD)
      : BASE_Y - DOT_R - TEAM_GAP - baseLaneOffset - (verticalLane * VERTICAL_COLLISION_THRESHOLD);

    clusterPositions.push({
      cluster,
      leftPercent, // Position temporelle PRÉCISE, pas d'offset horizontal
      topPx,
      verticalLane,
    });
  }

  return (
    <section className="relative mt-10 rounded-xl border border-white/10 bg-black/20 py-5">
      {/* STAGE - même padding horizontal que les ticks pour alignement */}
      <div className="relative h-52 w-full px-6">
        {/* Baseline centrée */}
        <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/8" />

        {/* CLUSTERS */}
        {clusterPositions.map(({ cluster, leftPercent, topPx }, idx) => {
          const { mainEvent, events, team } = cluster;
          const Icon = ICONS[mainEvent.kind] ?? CircleDot;

          // Toutes les morts sont en rouge, sinon selon l'équipe
          const colorClass =
            mainEvent.kind === "death"
              ? "bg-red-500/20 text-red-300"
              : team === "ally"
              ? "bg-cyan-500/20 text-cyan-300"
              : "bg-red-500/20 text-red-300";

          // Constantes pour le calcul du stem
          const CONTAINER_H = 208;
          const BASE_Y = CONTAINER_H / 2;
          const DOT_R = 14;

          const clusterHasAllyDeath = events.some(
            (e) => e.kind === "death" && e.team === "ally"
          );
          
          const isBelow = team === "enemy" || clusterHasAllyDeath;
          
          // Calculer la distance du stem jusqu'à la baseline
          const stemHeight = isBelow
            ? topPx - BASE_Y
            : BASE_Y - (topPx + DOT_R);

          const isInvolved = events.some((e) => e.involved);
          const ringClass = isInvolved
            ? "ring-1 ring-white/30 shadow-[0_0_10px_rgba(255,255,255,0.14)]"
            : "";

          return (
            <div
              key={`cluster-${idx}`}
              className="group absolute z-10"
              style={{
                left: `${leftPercent}%`, // Position temporelle PRÉCISE, pas d'offset
                top: `${topPx}px`,
                transform: "translateX(-50%)", // Centrer la bulle sur sa position temporelle
              }}
            >
              {/* STEM - connecte la bulle à la baseline */}
              <div
                className="absolute left-1/2 -translate-x-1/2 bg-white/10"
                style={{
                  width: "1px",
                  top: isBelow ? undefined : "100%",
                  bottom: isBelow ? "100%" : undefined,
                  height: `${Math.max(10, stemHeight)}px`,
                  opacity: 0.35,
                }}
              />

              {/* DOT */}
              <div
                className={`relative flex h-7 w-7 items-center justify-center rounded-full
                ${colorClass}
                border border-white/10 ${ringClass}`}
              >
                <Icon size={16} />

                {/* Badge +N */}
                {events.length > 1 && (
                  <span className="absolute -right-1.5 -top-1.5 rounded-full bg-black/90 px-1 py-0.5 text-[8px] font-semibold text-white/80">
                    +{events.length - 1}
                  </span>
                )}
              </div>

              {/* TOOLTIP - avec z-index élevé et positionnement amélioré */}
              <div
                className={`pointer-events-none absolute left-1/2 z-50
                w-[280px] -translate-x-1/2 rounded-lg border border-white/10
                bg-black/98 p-3 text-xs text-white/90 opacity-0
                shadow-xl backdrop-blur-md
                transition-all duration-200 group-hover:opacity-100 group-hover:z-50
                max-h-[200px] overflow-y-auto
                ${isBelow ? "top-full mt-2" : "bottom-full mb-2"}`}
              >
                <div className="space-y-1.5">
                  {events.slice(0, 8).map((e, i) => (
                    <div key={i} className="border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                      <div className="font-medium">
                        {e.label}
                        <span className="ml-1 text-white/40">
                          — {e.minute}:{String(e.second).padStart(2, "0")}
                        </span>
                      </div>

                      {e.meta?.assistingChampions?.length ? (
                        <div className="mt-0.5 text-white/50">
                          Assists: {e.meta.assistingChampions.join(", ")}
                        </div>
                      ) : null}
                    </div>
                  ))}
                  {events.length > 8 && (
                    <div className="text-white/40 text-center">
                      +{events.length - 8} autres événements
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* TIME SCALE INSIDE - même padding que le conteneur */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex justify-between px-6 text-[11px] text-white/30">
          {timeTicks
            .filter((t) => t <= maxMinute) // S'assurer qu'on n'affiche que les ticks jusqu'à maxMinute
            .map((t) => (
              <span key={t}>{t}:00</span>
            ))}
        </div>
      </div>
    </section>
  );
}

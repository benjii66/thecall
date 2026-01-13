// Win probability calculation - Heuristique basée sur poids configurables
import type { TimelineEvent } from "@/types/timeline";
import weightsJson from "./winProbabilityWeights.json";

const weights = weightsJson as typeof import("./winProbabilityWeights.json");

export type WinProbPoint = {
  minute: number;
  score: number;
  probability: number;
};

export function computeWinProbability(
  events: TimelineEvent[],
  duration?: number
): WinProbPoint[] {
  if (!events.length) return [];

  const maxMinute = events.reduce((m, e) => Math.max(m, e.minute), 0);
  const finalDuration = duration ?? maxMinute;

  let score = 0;
  const dragonCount = { ally: 0, enemy: 0 };
  const points: WinProbPoint[] = [];

  for (let minute = 0; minute <= finalDuration; minute++) {
    const eventsThisMinute = events.filter((e) => e.minute === minute);

    for (const e of eventsThisMinute) {
      score += eventToDelta(e, minute, dragonCount);
    }

    score = clamp(
      score,
      weights.limits.maxNegativeScore,
      weights.limits.maxPositiveScore
    );

    points.push({
      minute,
      score,
      probability: sigmoid(score),
    });
  }

  if (
    weights.smoothing?.windowMinutes &&
    weights.smoothing.windowMinutes > 0 &&
    weights.smoothing.method === "moving-average"
  ) {
    return smoothProbabilities(points, weights.smoothing.windowMinutes);
  }

  return points;
}

function sigmoid(x: number): number {
  // Score 0 → 50%, +20 → ~88%, -20 → ~12% (évite extrêmes 99%/1%)
  return Math.round((1 / (1 + Math.exp(-x / 10))) * 100);
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function eventToDelta(
  event: TimelineEvent,
  minute: number,
  dragonCount: { ally: number; enemy: number }
): number {
  const phase = minute < 14 ? "early" : minute < 25 ? "mid" : "late";
  const multiplier = weights.timeScaling[phase].multiplier;
  const isForUs = event.team === "ally";

  switch (event.kind) {
    case "kill": {
      const base = multiplier * weights.kills.kill;
      const shutdown = event.meta?.shutdownBounty
        ? multiplier *
          (event.meta.shutdownBounty > 0 ? weights.kills.shutdownTaken : 0)
        : 0;
      return isForUs ? base + shutdown : -(base + shutdown);
    }

    case "death": {
      const base = multiplier * weights.kills.death;
      const shutdown = event.meta?.shutdownBounty
        ? multiplier *
          (event.meta.shutdownBounty > 0 ? weights.kills.shutdownGiven : 0)
        : 0;
      return isForUs ? base + shutdown : -(base + shutdown);
    }

    case "assist": {
      const base = multiplier * weights.kills.assist;
      return isForUs ? base : -base;
    }

    case "dragon": {
      const current = ++dragonCount[event.team];
      const drake = event.meta?.dragonType ?? "";

      let weight: number;
      if (drake === "elder") {
        weight = weights.objectives.elder;
      } else if (current >= 4) {
        weight = weights.objectives.dragon.soul;
      } else if (current === 1) {
        weight = weights.objectives.dragon.first;
      } else if (current === 2) {
        weight = weights.objectives.dragon.second;
      } else if (current === 3) {
        weight = weights.objectives.dragon.third;
      } else {
        weight = weights.objectives.dragon.second;
      }

      const delta = multiplier * weight;
      return isForUs ? delta : -delta;
    }

    case "herald": {
      const delta = multiplier * weights.objectives.herald;
      return isForUs ? delta : -delta;
    }

    case "grub": {
      const delta = multiplier * weights.objectives.voidGrub;
      return isForUs ? delta : -delta;
    }

    case "baron": {
      const delta = multiplier * weights.objectives.baron;
      return isForUs ? delta : -delta;
    }

    case "tower": {
      const tier = event.meta?.towerTier ?? "outer";
      const tierWeight =
        tier === "inner"
          ? weights.objectives.tower.inner
          : tier === "inhibitor"
          ? weights.objectives.tower.inhibitor
          : tier === "nexus"
          ? weights.objectives.tower.inhibitor
          : weights.objectives.tower.outer;

      const delta = multiplier * tierWeight;
      return isForUs ? delta : -delta;
    }

    case "gold": {
      const diff = event.meta?.goldDiff ?? 0;
      if (!diff) return 0;
      const perK = Math.abs(diff) / 1000;
      const delta = multiplier * perK * weights.economy.goldDiffPer1000;
      return isForUs ? delta : -delta;
    }

    default:
      return 0;
  }
}

function smoothProbabilities(
  points: WinProbPoint[],
  windowMinutes: number
): WinProbPoint[] {
  const smoothed: WinProbPoint[] = [];

  for (let i = 0; i < points.length; i++) {
    const start = Math.max(0, i - windowMinutes);
    const end = Math.min(points.length - 1, i + windowMinutes);
    const count = end - start + 1;
    const avgProb =
      points.slice(start, end + 1).reduce((sum, p) => sum + p.probability, 0) /
      count;

    smoothed.push({
      ...points[i],
      probability: Math.round(avgProb),
    });
  }

  return smoothed;
}

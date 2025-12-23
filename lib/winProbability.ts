// lib/winProbability.ts
import weights from "@/lib/winProbabilityWeights.json";
import { TimelineEvent } from "@/types/timeline";

export type WinProbPoint = {
  minute: number;
  score: number;
  probability: number; // 0 → 100
};

export function computeWinProbability(
  events: TimelineEvent[],
  duration = 40
): WinProbPoint[] {
  let score = 0;
  const points: WinProbPoint[] = [];

  for (let minute = 0; minute <= duration; minute++) {
    const eventsThisMinute = events.filter(e => e.minute === minute);

    for (const e of eventsThisMinute) {
      score += eventToDelta(e, minute);
    }

    score = clamp(score, weights.limits.maxNegativeScore, weights.limits.maxPositiveScore);

    points.push({
      minute,
      score,
      probability: sigmoid(score)
    });
  }

  return points;
}

// HELPERS 

function sigmoid(x: number): number {
  return Math.round((1 / (1 + Math.exp(-x / 6))) * 100);
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function eventToDelta(event: TimelineEvent, minute: number): number {
  const phase =
    minute < 14 ? "early" :
    minute < 25 ? "mid" : "late";

  const multiplier = weights.timeScaling[phase].multiplier;

  switch (event.kind) {
    case "kill":
      return multiplier * (event.team === "ally" ? weights.kills.kill : -weights.kills.kill);

    case "death":
      return multiplier * (event.team === "ally" ? weights.kills.death : -weights.kills.death);

    case "assist":
      return multiplier * (event.team === "ally" ? weights.kills.assist : -weights.kills.assist);

    case "dragon":
      return multiplier * (event.team === "ally" ? weights.objectives.dragon.first : -weights.objectives.dragon.first);

    case "baron":
      return multiplier * (event.team === "ally" ? weights.objectives.baron : -weights.objectives.baron);

    case "tower":
      return multiplier * (event.team === "ally" ? weights.objectives.tower.outer : -weights.objectives.tower.outer);

    default:
      return 0;
  }
}

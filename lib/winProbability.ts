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

  let lastProb = 50; // Start at 50%

  for (let minute = 0; minute <= finalDuration; minute++) {
    const eventsThisMinute = events.filter((e) => e.minute === minute);
    
    // 1. Calculate Score Delta
    // We pass dragonCount by reference/mutation so eventToDelta updates it? 
    // No, eventToDelta usually shouldn't mutate state hiddenly if we want purity, but looking at previous code:
    // "const current = ++dragonCount[event.team];" -> Yes, it mutated.
    // We must preserve this behavior or replicate it safely.
    // I'll replicate the loop structure.

    let minuteDelta = 0;
    let isMajorEvent = false;
    let killsThisMinute = 0;

    for (const e of eventsThisMinute) {
      minuteDelta += eventToDelta(e, minute, dragonCount);
      
      // Check Major Events
      if (e.kind === 'baron') isMajorEvent = true;
      if (e.kind === 'dragon') {
          // Check if Soul (4th) or Elder
          const count = dragonCount[e.team as 'ally' | 'enemy']; // eventToDelta just incremented it!
          if (e.meta?.dragonType === 'elder' || count >= 4) isMajorEvent = true;
      }
      if (e.kind === 'tower' && (e.meta?.towerTier === 'inhibitor' || e.meta?.towerTier === 'nexus')) isMajorEvent = true;
      if (e.kind === 'kill') killsThisMinute++;
    }

    if (killsThisMinute >= 4) isMajorEvent = true; // Ace / wipe logic approximation

    score += minuteDelta;

    // 2. Clamp Score
    score = clamp(
      score,
      weights.limits.maxNegativeScore,
      weights.limits.maxPositiveScore
    );

    // 3. Convert to Probability (Sigmoid)
    const rawProb = sigmoid(score);

    // 4. Apply Dampening (Progressive)
    let finalProb = rawProb;

    // Prevent zigzags: limit change from lastProb based on time & events
    if (minute > 20) {
        const maxChange = isMajorEvent ? 100 : getMaxChangePerMinute(minute);
        
        // Clamp the change
        const diff = rawProb - lastProb;
        if (Math.abs(diff) > maxChange) {
            finalProb = lastProb + (diff > 0 ? maxChange : -maxChange);
        }
    }
    
    // Final clamp 0-100 (though sigmoid handles it, but safety)
    finalProb = clamp(finalProb, 1, 99); // Never 0 or 100 purely

    points.push({
      minute,
      score,
      probability: Math.round(finalProb),
    });

    lastProb = finalProb;
  }

  return points;
}

function getMaxChangePerMinute(minute: number): number {
    if (minute < 20) return 100; // Freewheeling early
    if (minute < 25) return 20; // Light dampening (max 20% swing/min without major event)
    if (minute < 30) return 10; // Medium dampening
    return 5; // Strong dampening (max 5% swing/min without major event)
}

function sigmoid(x: number): number {
  // Center at 0 (50%). Range roughly -100 to +100 score mapping to 1-99%.
  // x=0 -> 0.5
  // x=50 -> ~0.99
  // x=-50 -> ~0.01
  // Adjust divisor to tune sensitivity. 
  // With previous weights, score could provide big values. 
  // Let's assume weights sum up to ~50-100 for a stomp.
  const sensitivity = 15; 
  return (1 / (1 + Math.exp(-x / sensitivity))) * 100;
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
  // Scaling: Early events matter MORE for momentum? Or LESS because plenty of time to throw?
  // User/Instruction: "early = volatile, late = rigid".
  // Volatility implies bigger score swings early? 
  // Usually in LoL, an early kill can snowball, but a late game Ace ends the game.
  // But for *probability*:
  // Early game: 50/50. 1 kill -> 52/48.
  // Late game: 50/50. 1 ace -> 90/10.
  // So Late events should have HUGE weights, but "Dampening" prevents "zigzags" (noise).
  // "Volatility" here might mean "Frequency of change" vs "Magnitude".
  // The user said: "early = volatile (bigger swings), late = rigid (harder to swing without major events)".
  // This implies Early: Multiplier High? No, if multiplier is high, one kill = 10% swing.
  // Late: Rigid = Multiplier Low OR Dampening High?
  // I implemented Dampening.
  // Let's stick to weights.timeScaling from JSON, but ensure they reflect this.
  // If JSON is static, I can override/tweak here or rely on JSON values.
  // Since I can't see JSON values right now but I import them, I will trust the multiplier from JSON 
  // BUT I will modify the 'phase' definition if needed or just use logic.
  
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
      // NOTE: We increment dragonCount HERE to track state for scoring logic.
      // This side effect is local to the simulation loop.
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
      // Gold diff is a state, not an event delta?
      // If event is "gold snapshot", we might want to adjust base score.
      // But typically gold events are deltas? 
      // Assuming 'gold' event calculates the shift from *gold difference*.
      // existing logic: delta = multiplier * perK * weight. 
      // If we have many gold events, this might double count?
      // Assuming events are sparse milestones or periodic.
      const perK = Math.abs(diff) / 1000;
      const delta = multiplier * perK * weights.economy.goldDiffPer1000;
      return isForUs ? delta : -delta;
    }

    default:
      return 0;
  }
}


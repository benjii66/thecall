import { RiotTimeline } from "./riotTypes";

export type Objective = {
  kind: "herald" | "baron";
  label: string;
  minute: number;
  team: "ally" | "enemy";
};

/**
 * Event brut NON TYPÉ (on sort du carcan Riot)
 */
type RawEliteEvent = {
  type: "ELITE_MONSTER_KILL";
  monsterType: "RIFTHERALD" | "BARON_NASHOR";
  killerTeamId: number;
  timestamp: number;
};

/**
 * Type guard FINAL
 */
function isHeraldOrBaron(e: unknown): e is RawEliteEvent {
  if (typeof e !== "object" || e === null) return false;

  const evt = e as Record<string, unknown>;

  return (
    evt.type === "ELITE_MONSTER_KILL" &&
    (evt.monsterType === "RIFTHERALD" || evt.monsterType === "BARON_NASHOR") &&
    typeof evt.killerTeamId === "number" &&
    typeof evt.timestamp === "number"
  );
}

/**
 * Extraction propre
 */
export function extractObjectives(
  timeline: RiotTimeline,
  myTeamId: number
): Objective[] {
  return timeline.info.frames.flatMap((frame) =>
    (frame.events as unknown[]).filter(isHeraldOrBaron).map((e) => ({
      kind: e.monsterType === "RIFTHERALD" ? "herald" : "baron",
      label: e.monsterType === "RIFTHERALD" ? "Herald" : "Baron",
      minute: Math.floor(e.timestamp / 60000),
      team: e.killerTeamId === myTeamId ? "ally" : "enemy",
    }))
  );
}

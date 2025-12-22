import { RiotTimeline } from "./riotTypes";

type DrakeInfo = {
  type: string;
  minute: number;
  team: "ally" | "enemy";
};

export function extractDrakes(
  timeline: RiotTimeline,
  myTeamId: number
): DrakeInfo[] {
  const drakes: DrakeInfo[] = [];

  for (const frame of timeline.info.frames) {
    for (const event of frame.events) {
      if (
        event.type === "ELITE_MONSTER_KILL" &&
        event.monsterType === "DRAGON"
      ) {
        drakes.push({
          type: event.monsterSubType,
          minute: Math.floor(event.timestamp / 60000),
          team: event.killerTeamId === myTeamId ? "ally" : "enemy",
        });
      }
    }
  }

  return drakes;
}

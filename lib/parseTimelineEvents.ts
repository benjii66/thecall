import type { RiotMatch, RiotTimeline } from "./riotTypes";
import { TimelineEvent } from "@/types/timeline";

/* ----------------------------------
   HELPERS
---------------------------------- */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function num(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function str(v: unknown): v is string {
  return typeof v === "string";
}

function getTime(timestamp: number) {
  const totalSeconds = Math.floor(timestamp / 1000);
  return {
    minute: Math.floor(totalSeconds / 60),
    second: totalSeconds % 60,
  };
}

/* ----------------------------------
   RAW EVENT TYPES
---------------------------------- */

type ChampionKillEvent = {
  type: "CHAMPION_KILL";
  killerId: number;
  victimId: number;
  assistingParticipantIds?: number[];
  timestamp: number;
};

type EliteMonsterEvent = {
  type: "ELITE_MONSTER_KILL";
  monsterType: "DRAGON" | "RIFTHERALD" | "BARON_NASHOR" | "HORDE";
  monsterSubType?: string;
  killerTeamId: number;
  timestamp: number;
};

type TowerKillEvent = {
  type: "BUILDING_KILL";
  buildingType: "TOWER_BUILDING";
  laneType: "TOP_LANE" | "MID_LANE" | "BOT_LANE";
  towerType: "OUTER_TURRET" | "INNER_TURRET" | "BASE_TURRET" | "NEXUS_TURRET";
  teamId: number;
  timestamp: number;
};

type Participant = {
  puuid: string;
  participantId: number;
  teamId: number;
  championName: string;
};

/* ----------------------------------
   TYPE GUARDS
---------------------------------- */

function isChampionKill(e: unknown): e is ChampionKillEvent {
  return (
    isRecord(e) &&
    e.type === "CHAMPION_KILL" &&
    num(e.killerId) &&
    num(e.victimId) &&
    num(e.timestamp)
  );
}

function isEliteMonster(e: unknown): e is EliteMonsterEvent {
  return (
    isRecord(e) &&
    e.type === "ELITE_MONSTER_KILL" &&
    str(e.monsterType) &&
    num(e.killerTeamId) &&
    num(e.timestamp)
  );
}

function isTowerKill(e: unknown): e is TowerKillEvent {
  return (
    isRecord(e) &&
    e.type === "BUILDING_KILL" &&
    e.buildingType === "TOWER_BUILDING" &&
    str(e.laneType) &&
    str(e.towerType) &&
    num(e.teamId) &&
    num(e.timestamp)
  );
}

/* ----------------------------------
   UTILS
---------------------------------- */

function getChampion(
  participants: Participant[],
  id: number
): string | undefined {
  return participants.find((p) => p.participantId === id)?.championName;
}

function formatTowerLabel(raw: TowerKillEvent): string {
  const lane =
    raw.laneType === "TOP_LANE"
      ? "Top"
      : raw.laneType === "MID_LANE"
      ? "Mid"
      : raw.laneType === "BOT_LANE"
      ? "Bot"
      : "";

  const tier =
    raw.towerType === "OUTER_TURRET"
      ? "Outer"
      : raw.towerType === "INNER_TURRET"
      ? "Inner"
      : raw.towerType === "BASE_TURRET"
      ? "Base"
      : raw.towerType === "NEXUS_TURRET"
      ? "Nexus"
      : "Tower";

  if (!lane) return `Tower — ${tier}`;

  return `Tower ${tier} ${lane}`;
}

/* ----------------------------------
   MAIN PARSER
---------------------------------- */

export function extractTimelineEvents(
  match: RiotMatch,
  timeline: RiotTimeline,
  myPuuid: string
): TimelineEvent[] {
  const participants = match.info.participants as unknown as Participant[];

  const me = participants.find((p) => p.puuid === myPuuid);
  if (!me) return [];

  const myId = me.participantId;
  const myTeam = me.teamId;

  return timeline.info.frames.flatMap((frame) => {
    const events = frame.events as unknown[];

    return events.flatMap((raw): TimelineEvent[] => {
      /* ---------------- KILLS ---------------- */

      if (isChampionKill(raw)) {
        const { minute, second } = getTime(raw.timestamp);

        const killerChampion = getChampion(participants, raw.killerId);
        const victimChampion = getChampion(participants, raw.victimId);
        const assistingChampions = raw.assistingParticipantIds
          ?.map((id) => getChampion(participants, id))
          .filter(Boolean) as string[] | undefined;

        const assistCount = assistingChampions?.length ?? 0;

        // TU TUES
        if (raw.killerId === myId) {
          return [
            {
              minute,
              second,
              kind: "kill",
              team: "ally",
              involved: true,
              label: victimChampion ? `Killed ${victimChampion}` : "Kill",
              meta: { victimChampion, assistCount },
            },
          ];
        }

        // TU MEURS
        if (raw.victimId === myId) {
          return [
            {
              minute,
              second,
              kind: "death",
              team: "enemy",
              involved: true,
              label: killerChampion ? `Killed by ${killerChampion}` : "Death",
              meta: {
                killerChampion,
                assistingChampions,
                assistCount,
              },
            },
          ];
        }

        // ASSIST
        if (raw.assistingParticipantIds?.includes(myId)) {
          return [
            {
              minute,
              second,
              kind: "assist",
              team: "ally",
              involved: true,
              label: victimChampion ? `Assist on ${victimChampion}` : "Assist",
              meta: { victimChampion, assistCount },
            },
          ];
        }

        return [];
      }

      /* ---------------- OBJECTIVES ---------------- */

      if (isEliteMonster(raw)) {
        const { minute, second } = getTime(raw.timestamp);

        // VOID GRUBS (S15+)
        if (raw.monsterType === "HORDE") {
          return [
            {
              minute,
              second,
              kind: "grub",
              team: raw.killerTeamId === myTeam ? "ally" : "enemy",
              involved: false,
              label: "Void Grub",
            },
          ];
        }

        if (raw.monsterType === "DRAGON") {
          const drake =
            raw.monsterSubType
              ?.replace("_DRAGON", "")
              .toLowerCase()
              .replace(/^\w/, (c) => c.toUpperCase()) ?? "Dragon";

          return [
            {
              minute,
              second,
              kind: "dragon",
              team: raw.killerTeamId === myTeam ? "ally" : "enemy",
              involved: false,
              label: `${drake} Drake`,
            },
          ];
        }

        if (raw.monsterType === "RIFTHERALD") {
          return [
            {
              minute,
              second,
              kind: "herald",
              team: raw.killerTeamId === myTeam ? "ally" : "enemy",
              involved: false,
              label: "Herald",
            },
          ];
        }

        if (raw.monsterType === "BARON_NASHOR") {
          // sécurité hard
          if (minute < 20) return [];

          return [
            {
              minute,
              second,
              kind: "baron",
              team: raw.killerTeamId === myTeam ? "ally" : "enemy",
              involved: false,
              label: "Baron",
            },
          ];
        }
      }

      /* ---------------- TOWERS ---------------- */

      if (isTowerKill(raw)) {
        const { minute, second } = getTime(raw.timestamp);

        return [
          {
            minute,
            second,
            kind: "tower",
            team: raw.teamId === myTeam ? "ally" : "enemy",
            involved: false,
            label: formatTowerLabel(raw),
          },
        ];
      }

      return [];
    });
  });
}

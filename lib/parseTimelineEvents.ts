// Parse timeline events Riot API → TimelineEvent structurés
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

function safeNumber(v: unknown, fallback = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function getTime(timestamp: number) {
  const totalSeconds = Math.floor(timestamp / 1000);
  return {
    minute: Math.floor(totalSeconds / 60),
    second: totalSeconds % 60,
  };
}


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

  const allyIds = participants
    .filter((p) => p.teamId === myTeam)
    .map((p) => p.participantId);
  const enemyIds = participants
    .filter((p) => p.teamId !== myTeam)
    .map((p) => p.participantId);

  const parsed: TimelineEvent[] = [];

  for (let frameIndex = 0; frameIndex < timeline.info.frames.length; frameIndex++) {
    const frame = timeline.info.frames[frameIndex];
    // Les frames sont indexées par minute (frame 0 = 0:00, frame 1 = 1:00, etc.)
    // On utilise le timestamp du premier événement de la frame, ou on calcule à partir de l'index
    const frameTimestamp = frame.events && frame.events.length > 0 
      ? (frame.events[0] as { timestamp?: number }).timestamp || frameIndex * 60000
      : frameIndex * 60000;
    const { minute } = getTime(frameTimestamp);
    const events = frame.events as unknown[];

    parsed.push(
      ...events.flatMap((raw): TimelineEvent[] => {
      // Kills

      if (isChampionKill(raw)) {
        const { minute, second } = getTime(raw.timestamp);

        const killer = participants.find((p) => p.participantId === raw.killerId);
        const victim = participants.find((p) => p.participantId === raw.victimId);

        const killerChampion = killer?.championName;
        const victimChampion = victim?.championName;
        const assistingChampions = raw.assistingParticipantIds
          ?.map((id) => getChampion(participants, id))
          .filter(Boolean) as string[] | undefined;

        const assistCount = assistingChampions?.length ?? 0;
        const killerIsAlly = killer ? killer.teamId === myTeam : false;
        const victimIsAlly = victim ? victim.teamId === myTeam : false;

        const involved =
          raw.killerId === myId ||
          raw.victimId === myId ||
          raw.assistingParticipantIds?.includes(myId);

        // On encode TOUJOURS depuis la perspective de notre équipe :
        // - Si un allié tue un ennemi → kill pour nous (bon)
        // - Si un ennemi tue un allié → death pour nous (mauvais)
        // Dans LoL, pas de friendly fire, donc on a toujours l'un ou l'autre
        if (killerIsAlly && !victimIsAlly) {
          // Allié tue ennemi → kill pour nous
          return [
            {
              minute,
              second,
              kind: "kill",
              team: "ally",
              involved,
              label: killerChampion && victimChampion
                ? `${killerChampion} killed ${victimChampion}`
                : victimChampion
                ? `Kill on ${victimChampion}`
                : "Kill",
              meta: {
                victimChampion,
                killerChampion,
                assistingChampions,
                assistCount,
                shutdownBounty: safeNumber(
                  (raw as { shutdownBounty?: unknown }).shutdownBounty,
                  safeNumber((raw as { bounty?: unknown }).bounty, 0)
                ),
              },
            },
          ];
        } else if (!killerIsAlly && victimIsAlly) {
          // Ennemi tue allié → death pour nous
          return [
            {
              minute,
              second,
              kind: "death",
              team: "ally",
              involved,
              label: victimChampion && killerChampion
                ? `${victimChampion} killed by ${killerChampion}`
                : killerChampion
                ? `Killed by ${killerChampion}`
                : "Death",
              meta: {
                victimChampion,
                killerChampion,
                assistingChampions,
                assistCount,
                shutdownBounty: safeNumber(
                  (raw as { shutdownBounty?: unknown }).shutdownBounty,
                  safeNumber((raw as { bounty?: unknown }).bounty, 0)
                ),
              },
            },
          ];
        }

        // Cas edge (ne devrait jamais arriver en LoL normal)
        return [];
      }

      // Objectives

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
          const rawSub =
            raw.monsterSubType?.replace("_DRAGON", "").toLowerCase() ?? "dragon";
          const drake = rawSub.replace(/^\w/, (c) => c.toUpperCase());

          return [
            {
              minute,
              second,
              kind: "dragon",
              team: raw.killerTeamId === myTeam ? "ally" : "enemy",
              involved: false,
              label: `${drake} Drake`,
              meta: { dragonType: rawSub },
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

      // Towers

      if (isTowerKill(raw)) {
        const { minute, second } = getTime(raw.timestamp);

        const tier =
          raw.towerType === "OUTER_TURRET"
            ? "outer"
            : raw.towerType === "INNER_TURRET"
            ? "inner"
            : raw.towerType === "BASE_TURRET"
            ? "inhibitor"
            : raw.towerType === "NEXUS_TURRET"
            ? "nexus"
            : undefined;

        const lane =
          raw.laneType === "TOP_LANE"
            ? "top"
            : raw.laneType === "MID_LANE"
            ? "mid"
            : raw.laneType === "BOT_LANE"
            ? "bot"
            : undefined;

        return [
          {
            minute,
            second,
            kind: "tower",
            team: raw.teamId === myTeam ? "ally" : "enemy",
            involved: false,
            label: formatTowerLabel(raw),
            meta: { towerTier: tier, towerLane: lane },
          },
        ];
      }

      return [];
    })
    );

    // GOLD DIFF (frame level)
    const pf = (frame as { participantFrames?: unknown }).participantFrames;
    if (pf && typeof pf === "object") {
      const asRecord = pf as Record<string, unknown>;

      const totalGoldFor = (ids: number[]) =>
        ids.reduce((sum, id) => {
          const p = asRecord[id.toString()];
          if (!p || typeof p !== "object") return sum;
          const gold = safeNumber(
            (p as { totalGold?: unknown }).totalGold,
            safeNumber((p as { gold?: unknown }).gold, 0)
          );
          return sum + gold;
        }, 0);

      const allyGold = totalGoldFor(allyIds);
      const enemyGold = totalGoldFor(enemyIds);

      if (allyGold > 0 || enemyGold > 0) {
        const diff = allyGold - enemyGold;
        parsed.push({
          minute,
          second: 0,
          kind: "gold",
          team: diff >= 0 ? "ally" : "enemy",
          involved: false,
          label: `${(diff / 1000).toFixed(1)}k gold diff`,
          meta: { goldDiff: diff },
        });
      }
    }
  }

  return parsed;
}

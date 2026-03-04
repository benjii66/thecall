
import { riotFetch } from "@/lib/riot";
import { matchCache } from "@/lib/matchCache";
import type { RiotMatch, RiotTimeline } from "@/lib/riotTypes";
import type { MatchPageData } from "@/types/match";
import type { MatchListItem } from "@/types/matchList";
import { QUEUE_BY_TYPE } from "@/types/gameType";
import { extractTimelineEvents } from "@/lib/parseTimelineEvents";
import { logger } from "@/lib/logger";
import { ensureUser } from "@/lib/db/ensureUser";

// --- Types & Constants moved from route.ts (simplified) ---
// We will now fetch this dynamically, but keep a fallback
const FALLBACK_DD_VERSION = "16.1.1"; 
const TARGET_MATCHES = 10;
const IDS_BATCH = 20;
const MAX_LOOKBACK_PAGES = 6;

type RuneJSONStyle = {
  id: number;
  key: string;
  icon: string;
  name: string;
  slots: Array<{
    runes: Array<{
      id: number;
      key: string;
      icon: string;
      name: string;
      shortDesc: string;
      longDesc: string;
    }>;
  }>;
};

// --- Cache Helpers ---

let ddVersionCache: { at: number; version: string } | null = null;
const VERSION_TTL_MS = 24 * 60 * 60 * 1000;

export async function getLatestDataDragonVersion(): Promise<string> {
  if (ddVersionCache && Date.now() - ddVersionCache.at < VERSION_TTL_MS) {
    return ddVersionCache.version;
  }
  try {
      const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json", {
          next: { revalidate: 86400 } // Cache for 24h
      });
      if (res.ok) {
          const versions = await res.json();
          if (Array.isArray(versions) && versions.length > 0) {
              const v = versions[0];
              ddVersionCache = { at: Date.now(), version: v };
              logger.debug(`[MatchController] Resolved DataDragon version: ${v}`);
              return v;
          }
      }
  } catch (e) {
      logger.warn("[MatchController] Failed to fetch DD version, using fallback", { error: e });
  }
  return FALLBACK_DD_VERSION;
}


let runeJsonCache: { at: number; data: RuneJSONStyle[] } | null = null;
const RUNES_TTL_MS = 24 * 60 * 60 * 1000;

async function getRunesJson(): Promise<RuneJSONStyle[]> {
  if (runeJsonCache && Date.now() - runeJsonCache.at < RUNES_TTL_MS) {
    return runeJsonCache.data;
  }
  const version = await getLatestDataDragonVersion();
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/runesReforged.json`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as RuneJSONStyle[];
  runeJsonCache = { at: Date.now(), data };
  return data;
}

function buildRuneIconMap(data: RuneJSONStyle[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const style of data) {
    for (const slot of style.slots) {
      for (const rune of slot.runes) {
        map.set(rune.id, rune.icon);
      }
    }
  }
  return map;
}

let itemJsonCache: { at: number; data: Record<string, { name: string }> } | null = null;
const ITEMS_TTL_MS = 24 * 60 * 60 * 1000;

async function getItemsJson(): Promise<Record<string, { name: string }>> {
  if (itemJsonCache && Date.now() - itemJsonCache.at < ITEMS_TTL_MS) {
    return itemJsonCache.data;
  }
  const version = await getLatestDataDragonVersion();
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return {};
  const data = (await res.json()) as { data: Record<string, { name: string }> };
  itemJsonCache = { at: Date.now(), data: data.data };
  return data.data;
}

// --- Helper Functions ---

function safeNumber(n: unknown, fallback = 0) {
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

function formatKDA(k: number, d: number, a: number) {
  return `${k}/${d}/${a}`;
}

function roleLabel(pos: string) {
  const p = (pos || "").toUpperCase();
  if (p === "TOP") return "Top";
  if (p === "JUNGLE") return "Jungle";
  if (p === "MIDDLE" || p === "MID") return "Mid";
  if (p === "BOTTOM") return "Bot";
  if (p === "UTILITY" || p === "SUPPORT") return "Support";
  return p || "—";
}

function extractItems(p: Record<string, unknown>): string[] {
  return [0, 1, 2, 3, 4, 5, 6]
    .map((i) => safeNumber(p[`item${i}`]))
    .filter((id) => id > 0 && id !== 3175)
    .map((id) => String(id));
}

function extractRunes(p: Record<string, unknown>): string[] {
  const perks = p["perks"];
  if (!perks || typeof perks !== "object") return [];
  const styles = (perks as { styles?: unknown }).styles;
  if (!Array.isArray(styles)) return [];
  const perkIds: number[] = [];
  for (const s of styles) {
    if (!s || typeof s !== "object") continue;
    const selections = (s as { selections?: unknown }).selections;
    if (!Array.isArray(selections)) continue;
    for (const sel of selections) {
        if (!sel || typeof sel !== "object") continue;
        const perk = safeNumber((sel as { perk?: unknown }).perk, 0);
        if (perk > 0) perkIds.push(perk);
    }
  }
  return perkIds.map((id) => String(id));
}

function mapRunesToIcons(runeIds: string[], runeJson: RuneJSONStyle[]): string[] {
  const runeMap = buildRuneIconMap(runeJson);
  return runeIds.map((id) => runeMap.get(Number(id))).filter((v): v is string => Boolean(v));
}

function mapRunesToNames(runeIds: string[], runeJson: RuneJSONStyle[]): Record<string, string> {
    const idToNameMap = new Map<number, string>();
    for (const style of runeJson) {
      for (const slot of style.slots) {
        for (const rune of slot.runes) {
          idToNameMap.set(rune.id, rune.name);
        }
      }
    }
    const iconMap = buildRuneIconMap(runeJson);
    const iconPathToNameMap: Record<string, string> = {};
    for (let i = 0; i < runeIds.length; i++) {
        const runeId = Number(runeIds[i]);
        const iconPath = iconMap.get(runeId);
        const name = idToNameMap.get(runeId);
        if (iconPath && name) {
            iconPathToNameMap[iconPath] = name;
        }
    }
    return iconPathToNameMap;
}

async function mapItemsToNames(itemIds: string[]): Promise<Record<string, string>> {
  const itemsJson = await getItemsJson();
  const nameMap: Record<string, string> = {};
  for (const id of itemIds) {
    if (id === "3175" || id === "0") continue;
    const item = itemsJson[id];
    if (item?.name) {
      nameMap[id] = item.name;
    }
  }
  return nameMap;
}

function toListItem(match: RiotMatch, puuid: string): MatchListItem {
    const me = match.info.participants.find((p) => p.puuid === puuid);
    const opponent = me
      ? match.info.participants.find(
          (p) => p.teamId !== me.teamId && p.teamPosition === me.teamPosition
        )
      : undefined;
  
    const durationMin = Math.floor(match.info.gameDuration / 60);
    const durationSec = String(match.info.gameDuration % 60).padStart(2, "0");
  
    return {
      id: match.metadata.matchId,
      queueId: match.info.queueId,
      champion: me?.championName ?? "Unknown",
      opponent: opponent?.championName ?? "Unknown",
      win: Boolean(me?.win),
      duration: match.info.gameDuration,
      label: `${me?.championName ?? "Unknown"} vs ${
        opponent?.championName ?? "Unknown"
      } • ${durationMin}:${durationSec} • ${me?.win ? "Victoire" : "Défaite"}`,
    };
}

// --- Controllers ---

import { withRedisCache } from "@/lib/services/redisCacheService";

// ... imports

import { prisma } from "@/lib/prisma";

import { persistMatchMetadata } from "@/lib/db/persistMatchMetadata";
import { persistMatchJson } from "@/lib/db/persistMatchJson";
// import persistMatch removed

type PersistenceStrategy = 'none' | 'metadata' | 'full';

export async function getRawMatch(matchId: string, userId?: string, userPuuid?: string, strategy: PersistenceStrategy = 'none'): Promise<RiotMatch> {
  const region = "europe";
  const redisKey = `match:${region}:${matchId}`;

  return withRedisCache(
    redisKey,
    async () => {
        // 1. DB Check - Strategy dependent
        if (userId) {
            // If strategy is 'full', we need matchJson.
            // If strategy is 'metadata', we technically only need metadata columns but return type is RiotMatch.
            // However, we can't easily reconstruct RiotMatch from just metadata. 
            // So we check if matchJson exists.
            
            const dbMatch = await prisma.match.findUnique({
                where: { userId_matchId: { userId, matchId } },
            });

            if (dbMatch && dbMatch.hasMatchJson && dbMatch.matchJson) {
                logger.debug(`[DB] match DB HIT (matchId=${matchId})`); // Changed to debug to reduce noise
                return dbMatch.matchJson as unknown as RiotMatch;
            }
            // If we have metadata but no JSON, and we need JSON (for return type), we must fetch from Riot.
        }

        // 2. Riot Fetch
        const riotData = await riotFetch<RiotMatch>(
            `/lol/match/v5/matches/${matchId}`, 
            region, 
            { revalidate: 3600, tags: [`match-${matchId}`] }
        );

        // 3. Persistence
        if (userId && userPuuid) {
            if (strategy === 'metadata') {
                await persistMatchMetadata({ userId, userPuuid, matchId, matchJson: riotData });
            } else if (strategy === 'full') {
                 await persistMatchJson({ userId, matchId, matchJson: riotData });
            }
        }
        
        return riotData;
    },
    86400
  );
}

import { persistTimelineJson } from "@/lib/db/persistTimelineJson";

export async function getRawTimeline(matchId: string, userId?: string): Promise<RiotTimeline | null> {
    const region = "europe";
    return withRedisCache(
        `timeline:${region}:${matchId}:v1`,
        async () => {
             // DB Check
             if (userId) {
                 const dbMatch = await prisma.match.findUnique({
                     where: { userId_matchId: { userId, matchId } },
                     select: { timelineJson: true, hasTimelineJson: true }
                 });
                 if (dbMatch?.hasTimelineJson && dbMatch.timelineJson) {
                     logger.debug(`[DB] timeline DB HIT (matchId=${matchId})`);
                     return dbMatch.timelineJson as unknown as RiotTimeline;
                 }
             }

             // Riot Fetch
             const riotData = await riotFetch<RiotTimeline>(
                 `/lol/match/v5/matches/${matchId}/timeline`, 
                 region, 
                 { revalidate: 3600, tags: [`match-${matchId}-timeline`] }
             );

             // DB Save
             if (userId && riotData) {
                 await persistTimelineJson({ userId, matchId, timelineJson: riotData });
             }
             
             return riotData;
        },
        86400
   );
}

export async function getMatchDetailsController(matchId: string, puuid: string): Promise<MatchPageData | null> {
    try {
        // Resolve & Ensure User Persistence
        let userId: string | undefined;
        try {
            if (puuid) {
                const user = await ensureUser({ riotPuuid: puuid });
                userId = user.id;
            }
        } catch (e) {
            logger.warn("[MatchController] Failed to ensure user in DB", { error: e });
        }

        const match = await getRawMatch(matchId, userId, puuid, 'full'); // Pass 'full' for persistence
        if (!userId) {
             // If we didn't resolve userId previously (e.g. ensureUser failed?), try to get it from match participants if we want?
             // But actually ensureUser is robust. If it failed, userId is undefined, persistence inside getRawMatch skipped.
        }

        const timeline = await getRawTimeline(matchId, userId);

        const participants = match.info.participants as Array<
            (typeof match.info.participants)[number] & { individualPosition?: string; teamPosition?: string }
        >;

        const meRaw = participants.find((p) => p.puuid === puuid);
        if (!meRaw) {
            logger.warn(`[MatchController] Player not found in match ${matchId}`);
            return null;
        }

        const win = Boolean(meRaw.win);
        const myTeamId = meRaw.teamId;
        const ally = participants.filter((p) => p.teamId === myTeamId);
        const enemy = participants.filter((p) => p.teamId !== myTeamId);
        const myPos = meRaw.teamPosition || meRaw.individualPosition || "";
        const opponentRaw = enemy.find((p) => (p.teamPosition || p.individualPosition || "") === myPos && myPos !== "") || null;

        const allyKills = ally.reduce((sum, p) => sum + safeNumber(p.kills), 0);
        const enemyKills = enemy.reduce((sum, p) => sum + safeNumber(p.kills), 0);
        const myKP = allyKills > 0 ? Math.round(((safeNumber(meRaw.kills) + safeNumber(meRaw.assists)) / allyKills) * 100) : 0;

        const runeJson = await getRunesJson();
        const timelineEvents = Array.isArray(timeline?.info?.frames) ? extractTimelineEvents(match, timeline, puuid) : [];

        const myItemIds = extractItems(meRaw as unknown as Record<string, unknown>);
        const myRuneIds = extractRunes(meRaw as unknown as Record<string, unknown>);
        const myRuneIcons = mapRunesToIcons(myRuneIds, runeJson);
        const myItemNames = await mapItemsToNames(myItemIds);
        const myRuneNames = mapRunesToNames(myRuneIds, runeJson);

        const opponentItemIds = opponentRaw ? extractItems(opponentRaw as unknown as Record<string, unknown>) : [];
        const opponentRuneIds = opponentRaw ? extractRunes(opponentRaw as unknown as Record<string, unknown>) : [];
        const opponentRuneIcons = opponentRaw ? mapRunesToIcons(opponentRuneIds, runeJson) : [];
        const opponentItemNames = opponentRaw ? await mapItemsToNames(opponentItemIds) : {};
        const opponentRuneNames = opponentRaw ? mapRunesToNames(opponentRuneIds, runeJson) : {};

        const myCS = safeNumber(meRaw.totalMinionsKilled) + safeNumber(meRaw.neutralMinionsKilled);
        const myLevel = safeNumber(meRaw.champLevel);
        const myVision = safeNumber(meRaw.visionScore);
        const myDamage = safeNumber(meRaw.totalDamageDealtToChampions);

        const opponentCS = opponentRaw 
            ? safeNumber(opponentRaw.totalMinionsKilled) + safeNumber(opponentRaw.neutralMinionsKilled)
            : 0;
        const opponentLevel = opponentRaw ? safeNumber(opponentRaw.champLevel) : 0;
        const opponentVision = opponentRaw ? safeNumber(opponentRaw.visionScore) : 0;
        const opponentDamage = opponentRaw ? safeNumber(opponentRaw.totalDamageDealtToChampions) : 0;

        return {
            timelineEvents,
            me: {
                win,
                role: roleLabel(myPos),
                champion: meRaw.championName,
                kda: formatKDA(safeNumber(meRaw.kills), safeNumber(meRaw.deaths), safeNumber(meRaw.assists)),
                kp: myKP,
                gold: safeNumber(meRaw.goldEarned),
                cs: myCS,
                level: myLevel,
                visionScore: myVision,
                damage: myDamage,
                deaths: safeNumber(meRaw.deaths),
                build: {
                    items: myItemIds,
                    runes: myRuneIcons,
                    itemNames: myItemNames,
                    runeNames: myRuneNames,
                },
            },
            opponent: opponentRaw ? {
                win: !win,
                role: roleLabel(myPos),
                champion: opponentRaw.championName,
                kda: formatKDA(safeNumber(opponentRaw.kills), safeNumber(opponentRaw.deaths), safeNumber(opponentRaw.assists)),
                kp: enemyKills > 0 ? Math.round(((safeNumber(opponentRaw.kills) + safeNumber(opponentRaw.assists)) / enemyKills) * 100) : 0,
                gold: safeNumber(opponentRaw.goldEarned),
                cs: opponentCS,
                level: opponentLevel,
                visionScore: opponentVision,
                damage: opponentDamage,
                deaths: opponentRaw ? safeNumber(opponentRaw.deaths) : 0,
                build: {
                    items: opponentItemIds,
                    runes: opponentRuneIcons,
                    itemNames: opponentItemNames,
                    runeNames: opponentRuneNames,
                }
            } : null,
            allyTeam: ally.map((p) => ({ champion: p.championName, kda: formatKDA(safeNumber(p.kills), safeNumber(p.deaths), safeNumber(p.assists)) })),
            enemyTeam: enemy.map((p) => ({ champion: p.championName, kda: formatKDA(safeNumber(p.kills), safeNumber(p.deaths), safeNumber(p.assists)) })),
            gameVersion: match.info.gameVersion,
        };
    } catch (err) {
        logger.error("Error in getMatchDetailsController", { error: err, matchId });
        throw err;
    }
}

export async function getMatchesListController(puuid: string, type: "all" | "ranked" | "normal" | "flex" | "draft" = "all"): Promise<{ matches: MatchListItem[], cursor: number, exhausted: boolean }> {
  const queues = (QUEUE_BY_TYPE[type] ?? []) as readonly number[];
  const cacheKey = `${puuid}:${type}`;
  const LIST_TTL_MS = 60_000;

  // Resolve User ID for persistence
  let userId: string | undefined;
  try {
    if (puuid) {
        const user = await ensureUser({ riotPuuid: puuid });
        userId = user.id;
    }
  } catch (e) {
    logger.warn("[MatchController] Failed to ensure user in DB", { error: e });
  }

  const entry = await matchCache.withMatchList(cacheKey, async (prev) => {
    const base = prev && prev.expiresAt > Date.now() ? prev : null;
    const data: MatchListItem[] = base?.data ? [...base.data] : [];
    const seen = new Set(data.map((m) => m.id));

    let cursor = base?.cursor ?? 0;
    let exhausted = base?.exhausted ?? false;
    let pages = 0;

    while (!exhausted && data.length < TARGET_MATCHES && pages < MAX_LOOKBACK_PAGES) {
      pages++;
      
      const region = "europe";
      
      const ids = await withRedisCache(
        `matchIds:${region}:${puuid}:${cursor}`,
        () => riotFetch<string[]>(
            `/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${cursor}&count=${IDS_BATCH}`,
            region,
            { revalidate: 120 } 
        ),
        300
      );

      if (!ids.length) {
        exhausted = true;
        break;
      }
      cursor += ids.length;

      const matchesToFetch = ids.filter((id) => !seen.has(id));
      const CHUNK_SIZE = 5;
      
      for (let i = 0; i < matchesToFetch.length; i += CHUNK_SIZE) {
        const chunk = matchesToFetch.slice(i, i + CHUNK_SIZE);
        await Promise.all(
          chunk.map(async (id) => {
            try {
              const match = await getRawMatch(id, userId, puuid, 'metadata'); // Pass 'metadata' for persistence
              if (queues.length && !queues.includes(match.info.queueId)) return;
              const item = toListItem(match, puuid);
              data.push(item);
              seen.add(id);
            } catch (err) {
              logger.warn(`Failed to fetch match ${id}`, { error: err });
            }
          })
        );
        if (data.length >= TARGET_MATCHES) break;
      }
    }

    return { data, cursor, exhausted, expiresAt: Date.now() + LIST_TTL_MS };
  });

  return { matches: entry.data, cursor: entry.cursor, exhausted: entry.exhausted };
}



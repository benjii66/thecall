
import { riotFetch } from "@/lib/riot";
import { matchCache } from "@/lib/matchCache";
import type { RiotMatch, RiotTimeline } from "@/lib/riotTypes";
import type { MatchPageData } from "@/types/match";
import type { MatchListItem } from "@/types/matchList";
import { QUEUE_BY_TYPE } from "@/types/gameType";
import { extractTimelineEvents } from "@/lib/parseTimelineEvents";
import { logger } from "@/lib/logger";

// --- Types & Constants moved from route.ts (simplified) ---

const DD_VERSION = "14.18.1";
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

let runeJsonCache: { at: number; data: RuneJSONStyle[] } | null = null;
const RUNES_TTL_MS = 24 * 60 * 60 * 1000;

async function getRunesJson(): Promise<RuneJSONStyle[]> {
  if (runeJsonCache && Date.now() - runeJsonCache.at < RUNES_TTL_MS) {
    return runeJsonCache.data;
  }
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${DD_VERSION}/data/en_US/runesReforged.json`,
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
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${DD_VERSION}/data/en_US/item.json`,
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

export async function getRawMatch(matchId: string): Promise<RiotMatch> {
  const region = "europe";
  return withRedisCache(
    `match:${region}:${matchId}`,
    () => matchCache.withMatch(matchId, async () => {
      // Revalidate 5 minutes, tag match-{id}
      return riotFetch<RiotMatch>(`/lol/match/v5/matches/${matchId}`, region, { revalidate: 300, tags: [`match-${matchId}`] });
    }),
    3600 // 1 hour TTL in Redis
  );
}

export async function getRawTimeline(matchId: string): Promise<RiotTimeline | null> {
    const region = "europe";
    return withRedisCache(
        `timeline:${region}:${matchId}:v1`,
        () => matchCache.withTimeline(matchId, async () => {
             return riotFetch<RiotTimeline>(`/lol/match/v5/matches/${matchId}/timeline`, region, { revalidate: 300, tags: [`match-${matchId}-timeline`] });
        }),
        3600
   );
}

export async function getMatchDetailsController(matchId: string, puuid: string): Promise<MatchPageData | null> {
    try {
        // const region = "europe"; // interne au helper

        const match = await getRawMatch(matchId);
        const timeline = await getRawTimeline(matchId);

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

        return {
            timelineEvents,
            me: {
                win,
                role: roleLabel(myPos),
                champion: meRaw.championName,
                kda: formatKDA(safeNumber(meRaw.kills), safeNumber(meRaw.deaths), safeNumber(meRaw.assists)),
                kp: myKP,
                gold: safeNumber(meRaw.goldEarned),
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
                build: {
                    items: opponentItemIds,
                    runes: opponentRuneIcons,
                    itemNames: opponentItemNames,
                    runeNames: opponentRuneNames,
                }
            } : null,
            allyTeam: ally.map((p) => ({ champion: p.championName, kda: formatKDA(safeNumber(p.kills), safeNumber(p.deaths), safeNumber(p.assists)) })),
            enemyTeam: enemy.map((p) => ({ champion: p.championName, kda: formatKDA(safeNumber(p.kills), safeNumber(p.deaths), safeNumber(p.assists)) })),
        };
    } catch (err) {
        logger.error("Error in getMatchDetailsController", { error: err, matchId });
        throw err;
    }
}

export async function getMatchesListController(puuid: string, type: "all" | "ranked" | "normal" | "flex" | "draft" = "all"): Promise<{ matches: MatchListItem[], cursor: number, exhausted: boolean }> {
  const queues = (QUEUE_BY_TYPE[type] ?? []) as readonly number[];
  const cacheKey = `${puuid}:${type}`;
  const LIST_TTL_MS = 120_000;

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
      // Redis Key: matchIds:{region}:{puuid}:{cursor} - TTL 5 min (300s) - Note: key logic assumes batch size is constant? 
      // Actually user asked for `matchIds:${region}:${puuid}:15` (assuming 15 matches?). 
      // Logic uses IDS_BATCH=20.
      // Let's use `matchIds:${region}:${puuid}:${cursor}` as key to be safe for pagination.
      
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
              const match = await getRawMatch(id);
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

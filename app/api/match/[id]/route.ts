// GET /api/match/[id] - Détails complets d'un match
import { NextRequest, NextResponse } from "next/server";
import { riotFetch } from "@/lib/riot";
import { matchCache } from "@/lib/matchCache";
import type { RiotMatch, RiotTimeline } from "@/lib/riotTypes";
import type { MatchPageData } from "@/types/match";
import { extractTimelineEvents } from "@/lib/parseTimelineEvents";

const DD_VERSION = "14.18.1";

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

let runeJsonCache: { at: number; data: RuneJSONStyle[] } | null = null;
const RUNES_TTL_MS = 24 * 60 * 60 * 1000; // 24h

async function getRunesJson(): Promise<RuneJSONStyle[]> {
  if (runeJsonCache && Date.now() - runeJsonCache.at < RUNES_TTL_MS) {
    return runeJsonCache.data;
  }

  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${DD_VERSION}/data/en_US/runesReforged.json`,
    { cache: "force-cache" }
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
        map.set(rune.id, rune.icon); // ex: perk-images/Styles/Precision/Conqueror/Conqueror.png
      }
    }
  }
  return map;
}

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
  // Riot: item0..item6
  // Filtrer les items invalides comme 3175 (trinket ou item spécial non présent dans Data Dragon)
  const items = [0, 1, 2, 3, 4, 5, 6]
    .map((i) => safeNumber(p[`item${i}`]))
    .filter((id) => id > 0 && id !== 3175)
    .map((id) => String(id));
  return items;
}

function extractRunes(p: Record<string, unknown>): string[] {
  // Riot: perks.styles[].selections[].perk
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

function mapRunesToIcons(
  runeIds: string[],
  runeJson: RuneJSONStyle[]
): string[] {
  const runeMap = buildRuneIconMap(runeJson);
  return runeIds
    .map((id) => runeMap.get(Number(id)))
    .filter((v): v is string => Boolean(v));
}

function mapRunesToNames(
  runeIds: string[],
  runeIconPaths: string[],
  runeJson: RuneJSONStyle[]
): Record<string, string> {
  // Créer un map ID -> nom
  const idToNameMap = new Map<number, string>();
  for (const style of runeJson) {
    for (const slot of style.slots) {
      for (const rune of slot.runes) {
        idToNameMap.set(rune.id, rune.name);
      }
    }
  }
  
  // Créer un map chemin icon -> nom en utilisant les IDs originaux
  const iconPathToNameMap: Record<string, string> = {};
  const iconMap = buildRuneIconMap(runeJson);
  
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

let itemJsonCache: { at: number; data: Record<string, { name: string }> } | null = null;
const ITEMS_TTL_MS = 24 * 60 * 60 * 1000; // 24h

async function getItemsJson(): Promise<Record<string, { name: string }>> {
  if (itemJsonCache && Date.now() - itemJsonCache.at < ITEMS_TTL_MS) {
    return itemJsonCache.data;
  }

  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${DD_VERSION}/data/en_US/item.json`,
    { cache: "force-cache" }
  );
  if (!res.ok) return {};

  const data = (await res.json()) as { data: Record<string, { name: string }> };
  itemJsonCache = { at: Date.now(), data: data.data };
  return data.data;
}

async function mapItemsToNames(itemIds: string[]): Promise<Record<string, string>> {
  const itemsJson = await getItemsJson();
  const nameMap: Record<string, string> = {};
  for (const id of itemIds) {
    // Ignorer les items invalides comme 3175 (trinket ou item spécial non présent dans Data Dragon)
    if (id === "3175" || id === "0") continue;
    
    const item = itemsJson[id];
    if (item?.name) {
      nameMap[id] = item.name;
    }
  }
  return nameMap;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing match id" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const puuid =
    searchParams.get("puuid") ||
    process.env.MY_PUUID ||
    process.env.NEXT_PUBLIC_PUUID ||
    "";

  if (!puuid) {
    return NextResponse.json({ error: "Missing puuid" }, { status: 400 });
  }

  try {
    // 1) Riot fetch (cache)
    const cachedMatch = matchCache.getMatch(id);
    if (cachedMatch) {
      console.log(`[cache] GET match ${id}`);
    }
    const match =
      cachedMatch ??
      (await matchCache.withMatch(id, async () => {
        console.log(`[fetch] GET match ${id}`);
        return riotFetch<RiotMatch>(`/lol/match/v5/matches/${id}`, "europe");
      }));

    const cachedTimeline = matchCache.getTimeline(id);
    if (cachedTimeline) {
      console.log(`[cache] GET timeline ${id}`);
    }
    const timeline =
      cachedTimeline ??
      (await matchCache.withTimeline(id, async () => {
        console.log(`[fetch] GET timeline ${id}`);
        return riotFetch<RiotTimeline>(
          `/lol/match/v5/matches/${id}/timeline`,
          "europe"
        );
      }));

    // 2) find "me"
    const participants = match.info.participants as Array<
      (typeof match.info.participants)[number] & { individualPosition?: string }
    >;

    const meRaw = participants.find((p) => p.puuid === puuid);
    if (!meRaw) {
      return NextResponse.json(
        { error: "Player not found in this match (puuid mismatch)" },
        { status: 404 }
      );
    }

    const win = Boolean(meRaw.win);

    const myTeamId = meRaw.teamId;
    const ally = participants.filter((p) => p.teamId === myTeamId);
    const enemy = participants.filter((p) => p.teamId !== myTeamId);

    const myPos = meRaw.teamPosition || meRaw.individualPosition || "";
    const opponentRaw =
      enemy.find(
        (p) =>
          (p.teamPosition || p.individualPosition || "") === myPos &&
          myPos !== ""
      ) || null;

    const allyKills = ally.reduce((sum, p) => sum + safeNumber(p.kills), 0);
    const enemyKills = enemy.reduce((sum, p) => sum + safeNumber(p.kills), 0);

    const myKP =
      allyKills > 0
        ? Math.round(
            ((safeNumber(meRaw.kills) + safeNumber(meRaw.assists)) /
              allyKills) *
              100
          )
        : 0;

    // 3) runes json (optionnel, mais on évite riotFetch ici)
    const runeJson = await getRunesJson(); // utilisé pour mapper id -> icon

    // 4) timeline events parsés
    const timelineEvents = Array.isArray(timeline?.info?.frames)
      ? extractTimelineEvents(match, timeline, puuid)
      : [];

    // 5) Extraire items et runes avec leurs noms
    const myItemIds = extractItems(meRaw as unknown as Record<string, unknown>);
    const myRuneIds = extractRunes(meRaw as unknown as Record<string, unknown>);
    const myRuneIcons = mapRunesToIcons(myRuneIds, runeJson);
    const myItemNames = await mapItemsToNames(myItemIds);
    const myRuneNames = mapRunesToNames(myRuneIds, myRuneIcons, runeJson);

    const opponentItemIds = opponentRaw
      ? extractItems(opponentRaw as unknown as Record<string, unknown>)
      : [];
    const opponentRuneIds = opponentRaw
      ? extractRunes(opponentRaw as unknown as Record<string, unknown>)
      : [];
    const opponentRuneIcons = opponentRaw
      ? mapRunesToIcons(opponentRuneIds, runeJson)
      : [];
    const opponentItemNames = opponentRaw
      ? await mapItemsToNames(opponentItemIds)
      : {};
    const opponentRuneNames = opponentRaw
      ? mapRunesToNames(opponentRuneIds, opponentRuneIcons, runeJson)
      : {};

    const data: MatchPageData = {
      timelineEvents,

      me: {
        win,
        role: roleLabel(myPos),
        champion: meRaw.championName,
        kda: formatKDA(
          safeNumber(meRaw.kills),
          safeNumber(meRaw.deaths),
          safeNumber(meRaw.assists)
        ),
        kp: myKP,
        gold: safeNumber(meRaw.goldEarned),
        build: {
          items: myItemIds,
          runes: myRuneIcons,
          itemNames: myItemNames,
          runeNames: myRuneNames,
        },
      },

      opponent: opponentRaw
        ? {
            win: !win,
            role: roleLabel(myPos),
            champion: opponentRaw.championName,
            kda: formatKDA(
              safeNumber(opponentRaw.kills),
              safeNumber(opponentRaw.deaths),
              safeNumber(opponentRaw.assists)
            ),
            kp:
              enemyKills > 0
                ? Math.round(
                    ((safeNumber(opponentRaw.kills) +
                      safeNumber(opponentRaw.assists)) /
                      enemyKills) *
                      100
                  )
                : 0,
            gold: safeNumber(opponentRaw.goldEarned),
            build: {
              items: opponentItemIds,
              runes: opponentRuneIcons,
              itemNames: opponentItemNames,
              runeNames: opponentRuneNames,
            },
          }
        : null,

      allyTeam: ally.map((p) => ({
        champion: p.championName,
        kda: formatKDA(
          safeNumber(p.kills),
          safeNumber(p.deaths),
          safeNumber(p.assists)
        ),
      })),

      enemyTeam: enemy.map((p) => ({
        champion: p.championName,
        kda: formatKDA(
          safeNumber(p.kills),
          safeNumber(p.deaths),
          safeNumber(p.assists)
        ),
      })),
    };

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("MATCH ROUTE ERROR", err);
    
    const error = err as Error & { status?: number; isRiotError?: boolean };
    
    // Si c'est une erreur Riot API, on renvoie un message d'erreur clair
    if (error.isRiotError) {
      return NextResponse.json(
        {
          error: error.message,
          errorCode: error.status,
        },
        { status: error.status === 401 ? 401 : 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch match data" },
      { status: 500 }
    );
  }
}

// app/api/matches/route.ts
import { riotFetch } from "@/lib/riot";
import { matchCache } from "@/lib/matchCache";
import type { RiotMatch } from "@/lib/riotTypes";
import type { MatchListItem } from "@/types/matchList";
import { NextResponse } from "next/server";

const QUEUE_FILTERS = {
  ranked: [420, 440],
  draft: [400],
  all: [400, 420, 440],
} as const;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const puuid = searchParams.get("puuid");
  const type = (searchParams.get("type") ??
    "all") as keyof typeof QUEUE_FILTERS;

  if (!puuid) {
    return NextResponse.json({ error: "Missing puuid" }, { status: 400 });
  }

  // ✅ CACHE HIT (clé = puuid+type)
  const cached = matchCache.getMatchList(puuid, type);
  if (cached) {
    return NextResponse.json(cached);
  }

  // 1) IDs (limité à 5)
  const ids = await riotFetch<string[]>(
    `/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=5`,
    "europe"
  );

  // 2) Fetch matches complets (pour construire les labels)
  const matches = await Promise.all(
    ids.map(async (id) => {
      // ✅ si déjà en cache (warm), pas de refetch
      const cachedMatch = matchCache.getMatch(id);
      if (cachedMatch) return cachedMatch;

      try {
        const m = await riotFetch<RiotMatch>(
          `/lol/match/v5/matches/${id}`,
          "europe"
        );
        // ✅ warm cache du match
        matchCache.setMatch(id, m);
        return m;
      } catch {
        return null;
      }
    })
  );

  const allowedQueues: readonly number[] =
    QUEUE_FILTERS[type] ?? QUEUE_FILTERS.all;

  const list: MatchListItem[] = matches
    .filter((m): m is RiotMatch => m !== null)
    .filter((m) => m.info.queueId != null)
    .map((m) => {
      const me = m.info.participants.find((p) => p.puuid === puuid);
      if (!me) return null;

      const opponent =
        m.info.participants.find(
          (p) =>
            p.teamId !== me.teamId &&
            p.teamPosition === me.teamPosition &&
            p.teamPosition !== ""
        ) ?? m.info.participants.find((p) => p.teamId !== me.teamId);

      const min = Math.floor(m.info.gameDuration / 60);
      const sec = String(m.info.gameDuration % 60).padStart(2, "0");

      return {
        id: m.metadata.matchId,
        queueId: m.info.queueId,
        label: `${me.championName} vs ${
          opponent?.championName ?? "???"
        } • ${min}:${sec} • ${me.win ? "Victoire" : "Défaite"}`,
      };
    })
    .filter((x): x is MatchListItem => x !== null);

  // ✅ set cache (ne cache pas les listes vides -> géré dans matchCache)
  matchCache.setMatchList(puuid, type, list);

  return NextResponse.json(list);
}

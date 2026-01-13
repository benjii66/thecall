// GET /api/matches - Liste des matchs avec pagination intelligente
import { NextResponse } from "next/server";
import { riotFetch } from "@/lib/riot";
import { matchCache } from "@/lib/matchCache";
import { QUEUE_BY_TYPE, type GameType } from "@/types/gameType";
import type { RiotMatch } from "@/lib/riotTypes";
import type { MatchListItem } from "@/types/matchList";

const LIST_TTL_MS = 5 * 60_000;
const TARGET_MATCHES = 10;
const IDS_BATCH = 20;
const MAX_LOOKBACK_PAGES = 6;
const MATCH_FETCH_DELAY_MS = 70;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const puuid = searchParams.get("puuid") ?? process.env.MY_PUUID ?? "";
  const type = (searchParams.get("type") ?? "all") as GameType;

  if (!puuid) {
    return NextResponse.json({ matches: [] as MatchListItem[] }, { status: 200 });
  }

  const queues = (QUEUE_BY_TYPE[type] ?? []) as readonly number[];
  const cacheKey = `${puuid}:${type}`;

  try {
    const entry = await matchCache.withMatchList(cacheKey, async (prev) => {
      // si on a un cache encore valide, on repart de là
      const base = prev && prev.expiresAt > Date.now() ? prev : null;

      const data: MatchListItem[] = base?.data ? [...base.data] : [];
      const seen = new Set(data.map((m) => m.id));

      let cursor = base?.cursor ?? 0;
      let exhausted = base?.exhausted ?? false;

      // TTL recalculé à la fin
      let pages = 0;

      while (!exhausted && data.length < TARGET_MATCHES && pages < MAX_LOOKBACK_PAGES) {
        pages++;

        // 1) fetch IDs batch
        const ids = await riotFetch<string[]>(
          `/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${cursor}&count=${IDS_BATCH}`,
          "europe"
        );

        if (!ids.length) {
          exhausted = true;
          break;
        }

        cursor += ids.length;

        // 2) fetch match details progressivement
        for (const id of ids) {
          if (seen.has(id)) continue;

          // throttle soft anti-429
          await sleep(MATCH_FETCH_DELAY_MS);

          const match = await matchCache.withMatch(id, async () => {
            return riotFetch<RiotMatch>(`/lol/match/v5/matches/${id}`, "europe");
          });

          // 3) filtrage queue
          if (queues.length && !queues.includes(match.info.queueId)) continue;

          const item = toListItem(match, puuid);
          data.push(item);
          seen.add(id);

          if (data.length >= TARGET_MATCHES) break;
        }
      }

      return {
        data,
        cursor,
        exhausted,
        expiresAt: Date.now() + LIST_TTL_MS,
      };
    });

    return NextResponse.json({ matches: entry.data }, { status: 200 });
  } catch (err) {
    console.error("MATCH LIST ROUTE ERROR", err);
    
    const error = err as Error & { status?: number; isRiotError?: boolean };
    
    // Si c'est une erreur Riot API, on renvoie un message d'erreur clair
    if (error.isRiotError) {
      return NextResponse.json(
        {
          matches: [] as MatchListItem[],
          error: error.message,
          errorCode: error.status,
        },
        { status: 200 } // On garde 200 pour ne pas casser la page, mais on inclut l'erreur
      );
    }
    
    // En dev, on préfère renvoyer un truc safe plutôt que casser la page
    return NextResponse.json(
      {
        matches: [] as MatchListItem[],
        error: "Erreur lors de la récupération des matchs",
      },
      { status: 200 }
    );
  }
}

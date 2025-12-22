// app/api/match/[id]/route.ts

import { riotFetch } from "@/lib/riot";
import { getRuneMap } from "@/lib/runes";
import { extractTimelineEvents } from "@/lib/parseTimelineEvents";

import type { RiotMatch, RiotTimeline, RiotParticipant } from "@/lib/riotTypes";

import type { MatchPageData, PlayerSummary, TeamPlayer } from "@/types/match";

/* ----------------------------------
   HELPERS
---------------------------------- */

function formatKDA(p: RiotParticipant): string {
  return `${p.kills}/${p.deaths}/${p.assists}`;
}

function getRunes(p: RiotParticipant, runeMap: Map<number, string>): string[] {
  const runes = p.perks.styles
    .flatMap((style) =>
      style.selections.map((s) => {
        const rune = runeMap.get(s.perk);
        console.log("🔹 RUNE ID:", s.perk, "→", rune);
        return rune;
      })
    )
    .filter((r): r is string => Boolean(r));

  console.log(`🟡 FINAL RUNES for ${p.championName}:`, runes);

  return runes;
}

function getItems(p: RiotParticipant): string[] {
  return [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5]
    .filter((id): id is number => id > 0)
    .map((id) => id.toString());
}

function toPlayerSummary(
  p: RiotParticipant,
  runeMap: Map<number, string>
): PlayerSummary {
  return {
    champion: p.championName,
    role: p.teamPosition || "Unknown",
    kda: formatKDA(p),
    kp: 0, // calculable plus tard
    gold: p.goldEarned,
    win: p.win,
    build: {
      items: getItems(p),
      runes: getRunes(p, runeMap),
    },
  };
}

/* ----------------------------------
   ROUTE
---------------------------------- */

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ⚠️ Next 15+ : params est async
    const { id: matchId } = await params;

    if (!matchId) {
      return Response.json({ error: "Missing match id" }, { status: 400 });
    }

    /* ----------------------------------
       FETCH RIOT
    ---------------------------------- */

    const match = await riotFetch<RiotMatch>(
      `/lol/match/v5/matches/${matchId}`,
      "europe"
    );

    const timeline = await riotFetch<RiotTimeline>(
      `/lol/match/v5/matches/${matchId}/timeline`,
      "europe"
    );

    const runeMap = await getRuneMap();

    const participants = match.info.participants;

    const myPuuid = process.env.MY_PUUID;

    if (!myPuuid) {
      console.error("MY_PUUID is missing in environment variables");
      return Response.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    const me = participants.find((p) => p.puuid === myPuuid);

    if (!me) {
      return Response.json(null, { status: 404 });
    }

    const timelineEvents = extractTimelineEvents(match, timeline, myPuuid);

    const opponent =
      participants.find(
        (p) => p.teamId !== me.teamId && p.teamPosition === me.teamPosition
      ) ?? null;

    const allyTeam: TeamPlayer[] = participants
      .filter((p) => p.teamId === me.teamId)
      .map((p) => ({
        champion: p.championName,
        kda: formatKDA(p),
      }));

    const enemyTeam: TeamPlayer[] = participants
      .filter((p) => p.teamId !== me.teamId)
      .map((p) => ({
        champion: p.championName,
        kda: formatKDA(p),
      }));

    const response: MatchPageData = {
      timelineEvents,
      me: toPlayerSummary(me, runeMap),
      opponent: opponent ? toPlayerSummary(opponent, runeMap) : null,
      allyTeam,
      enemyTeam,
    };

    return Response.json(response);
  } catch (err) {
    console.error("MATCH ROUTE ERROR", err);
    // ⚠️ important : ne PAS throw → permet au front de tester un autre match
    return Response.json(null, { status: 404 });
  }
}

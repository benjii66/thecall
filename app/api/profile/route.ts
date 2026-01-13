// app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { riotFetch } from "@/lib/riot";
import { matchCache } from "@/lib/matchCache";
import type { RiotMatch, RiotTimeline } from "@/lib/riotTypes";
import type { PlayerProfile, RoleStats } from "@/types/profile";
import { extractTimelineEvents } from "@/lib/parseTimelineEvents";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

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

async function analyzeAllMatches(puuid: string): Promise<PlayerProfile> {
  // On va utiliser uniquement les matchs déjà en cache
  // Pour avoir les IDs, on peut les récupérer depuis le cache ou skip cette étape
  
  // Pour l'instant, on va récupérer les IDs (1 seul appel API, nécessaire)
  // Mais on ne fetchra AUCUN match (uniquement cache)
  const matchIds = await riotFetch<string[]>(
    `/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=50`,
    "europe"
  );

  const matches: Array<{
    match: RiotMatch;
    timeline?: RiotTimeline;
    me: {
      role: string;
      champion: string;
      win: boolean;
      kda: string;
      k: number;
      d: number;
      a: number;
      kp: number;
      gold: number;
    };
  }> = [];

  // Utiliser UNIQUEMENT les matchs en cache (pas de fetch)
  // L'utilisateur doit d'abord visiter /match pour charger les matchs en cache
  // Ça évite de dépasser les rate limits Riot (20/10s, 100/2min)
  
  for (const id of matchIds) {
    try {
      // Vérifier le cache uniquement (pas de fetch)
      const cachedMatch = matchCache.getMatch(id);
      const cachedTimeline = matchCache.getTimeline(id);
      
      // Si le match n'est pas en cache, on le skip
      if (!cachedMatch) {
        console.log(`[profile] Skipping ${id} (not in cache, visit /match first)`);
        continue;
      }
      
      const match = cachedMatch;
      const timeline = cachedTimeline ?? null; // Timeline optionnel

      const participants = match.info.participants as Array<
        (typeof match.info.participants)[number] & { individualPosition?: string }
      >;

      const meRaw = participants.find((p) => p.puuid === puuid);
      if (!meRaw) continue;

      const myTeamId = meRaw.teamId;
      const ally = participants.filter((p) => p.teamId === myTeamId);
      const allyKills = ally.reduce((sum, p) => sum + safeNumber(p.kills), 0);
      const myKP =
        allyKills > 0
          ? Math.round(
              ((safeNumber(meRaw.kills) + safeNumber(meRaw.assists)) /
                allyKills) *
                100
            )
          : 0;

      matches.push({
        match,
        timeline,
        me: {
          role: roleLabel(meRaw.teamPosition || meRaw.individualPosition || ""),
          champion: meRaw.championName,
          win: Boolean(meRaw.win),
          kda: formatKDA(
            safeNumber(meRaw.kills),
            safeNumber(meRaw.deaths),
            safeNumber(meRaw.assists)
          ),
          k: safeNumber(meRaw.kills),
          d: safeNumber(meRaw.deaths),
          a: safeNumber(meRaw.assists),
          kp: myKP,
          gold: safeNumber(meRaw.goldEarned),
        },
      });
    } catch (err) {
      console.error(`Error loading match ${id}:`, err);
      continue;
    }
  }

  if (!matches.length) {
    throw new Error(
      "Aucun match en cache. Visite d'abord /match pour charger tes matchs, puis reviens sur /profile."
    );
  }
  
  console.log(`[profile] Analysing ${matches.length} matches from cache (no API calls)`);

  // Calculer les stats par rôle
  // Type intermédiaire pour la construction des stats
  type RoleStatsBuilder = {
    role: string;
    games: number;
    wins: number;
    losses: number;
    totalK: number;
    totalD: number;
    totalA: number;
    totalKP: number;
    totalGold: number;
    champions: Map<string, { games: number; wins: number }>;
  };
  
  const roleMap = new Map<string, RoleStatsBuilder>();

  for (const { me } of matches) {
    const existing = roleMap.get(me.role) || {
      role: me.role,
      games: 0,
      wins: 0,
      losses: 0,
      totalK: 0,
      totalD: 0,
      totalA: 0,
      totalKP: 0,
      totalGold: 0,
      champions: new Map<string, { games: number; wins: number }>(),
    };

    existing.games++;
    if (me.win) existing.wins++;
    else existing.losses++;
    existing.totalK += me.k;
    existing.totalD += me.d;
    existing.totalA += me.a;
    existing.totalKP += me.kp;
    existing.totalGold += me.gold;

    const champ = existing.champions.get(me.champion) || { games: 0, wins: 0 };
    champ.games++;
    if (me.win) champ.wins++;
    existing.champions.set(me.champion, champ);

    roleMap.set(me.role, existing);
  }

  const roleStats: RoleStats[] = Array.from(roleMap.values()).map((r) => {
    const avgK = r.totalK / r.games;
    const avgD = r.totalD / r.games;
    const avgA = r.totalA / r.games;
    const champions = Array.from(r.champions.entries())
      .map(([champ, stats]) => ({
        champion: champ,
        games: stats.games,
        winRate: Math.round((stats.wins / stats.games) * 100),
      }))
      .sort((a, b) => b.games - a.games)
      .slice(0, 5);

    return {
      role: r.role,
      games: r.games,
      wins: r.wins,
      losses: r.losses,
      winRate: Math.round((r.wins / r.games) * 100),
      avgKDA: formatKDA(Math.round(avgK), Math.round(avgD), Math.round(avgA)),
      avgKP: Math.round(r.totalKP / r.games),
      avgGold: Math.round(r.totalGold / r.games),
      mostPlayedChampions: champions,
    };
  });

  // Trouver le rôle principal
  const mainRole = roleStats.sort((a, b) => b.games - a.games)[0]?.role || "—";

  // Calculer win rate global
  const totalWins = matches.filter((m) => m.me.win).length;
  const overallWinRate = Math.round((totalWins / matches.length) * 100);

  // Analyser le playstyle (aggression, objectifs, team fights)
  let totalDeaths = 0;
  let totalObjectives = 0;
  let totalKP = 0;
  let totalGames = matches.length;

  for (const { me, timeline, match } of matches) {
    totalDeaths += me.d;
    totalKP += me.kp;

      if (timeline) {
        const events = extractTimelineEvents(match, timeline, puuid);
      const objectives = events.filter(
        (e) => e.kind === "dragon" || e.kind === "herald" || e.kind === "baron"
      );
      const allyObjectives = objectives.filter((e) => e.team === "ally").length;
      totalObjectives += allyObjectives;
    }
  }

  const avgDeaths = totalDeaths / totalGames;
  const avgObjectives = totalObjectives / totalGames;
  const avgKPGlobal = totalKP / totalGames;

  // Calculs basés sur des seuils réalistes LoL
  // Agression : basée sur les morts moyennes
  // - Low: < 4 morts/game (safe, défensif)
  // - Medium: 4-6 morts/game (équilibré)
  // - High: > 6 morts/game (agressif, prend des risques)
  const aggression: "low" | "medium" | "high" =
    avgDeaths > 6 ? "high" : avgDeaths > 4 ? "medium" : "low";

  // Focus objectifs : basé sur le nombre moyen d'objectifs pris par game
  // - Low: < 2 objectifs/game (néglige les objectifs)
  // - Medium: 2-3 objectifs/game (équilibré)
  // - High: > 3 objectifs/game (excellent focus objectifs)
  const objectiveFocus: "low" | "medium" | "high" =
    avgObjectives > 3 ? "high" : avgObjectives > 2 ? "medium" : "low";

  // Présence team fights : basée sur le KP moyen
  // - Low: < 45% KP (peu présent en fights)
  // - Medium: 45-60% KP (présent)
  // - High: > 60% KP (très présent, bon roams/rotations)
  const teamFightPresence: "low" | "medium" | "high" =
    avgKPGlobal > 60 ? "high" : avgKPGlobal > 45 ? "medium" : "low";

  // Générer les insights avec IA
  const insights = await generateProfileInsights(
    roleStats,
    mainRole,
    aggression,
    objectiveFocus,
    teamFightPresence,
    overallWinRate
  );

  // Tendances récentes (10 derniers matchs)
  const recentMatches = matches.slice(0, 10);
  const recentWins = recentMatches.filter((m) => m.me.win).length;
  const recentWinRate = Math.round((recentWins / recentMatches.length) * 100);
  const improving = recentWinRate > overallWinRate;

  return {
    totalGames: matches.length,
    overallWinRate,
    mainRole,
    roleStats,
    playstyle: {
      aggression,
      objectiveFocus,
      teamFightPresence,
      description: generatePlaystyleDescription(
        aggression,
        objectiveFocus,
        teamFightPresence
      ),
    },
    insights,
    trends: {
      recentWinRate,
      recentGames: recentMatches.length,
      improving,
    },
  };
}

function generatePlaystyleDescription(
  aggression: "low" | "medium" | "high",
  objectiveFocus: "low" | "medium" | "high",
  teamFightPresence: "low" | "medium" | "high"
): string {
  const parts: string[] = [];
  
  // Agression
  if (aggression === "high") {
    parts.push("style très agressif (beaucoup de risques pris)");
  } else if (aggression === "medium") {
    parts.push("style équilibré avec prise de risques modérée");
  } else {
    parts.push("style safe et défensif");
  }
  
  // Objectifs
  if (objectiveFocus === "high") {
    parts.push("excellent focus sur les objectifs");
  } else if (objectiveFocus === "low") {
    parts.push("objectifs souvent négligés");
  }
  
  // Team fights
  if (teamFightPresence === "high") {
    parts.push("très présent en team fights");
  } else if (teamFightPresence === "low") {
    parts.push("peu présent lors des engagements");
  }
  
  return parts.join(". ") + ".";
}

async function generateProfileInsights(
  roleStats: RoleStats[],
  mainRole: string,
  aggression: "low" | "medium" | "high",
  objectiveFocus: "low" | "medium" | "high",
  teamFightPresence: "low" | "medium" | "high",
  winRate: number
): Promise<PlayerProfile["insights"]> {
  if (!OPENAI_API_KEY) {
    // Fallback heuristique
    return generateHeuristicInsights(
      roleStats,
      mainRole,
      aggression,
      objectiveFocus,
      teamFightPresence,
      winRate
    );
  }

  try {
    const prompt = `Analyse ce profil de joueur League of Legends et génère des insights personnalisés.

**Rôle principal**: ${mainRole}
**Win rate global**: ${winRate}%
**Style de jeu**:
- Agression: ${aggression}
- Focus objectifs: ${objectiveFocus}
- Présence team fights: ${teamFightPresence}

**Stats par rôle**:
${roleStats
  .map(
    (r) =>
      `- ${r.role}: ${r.games} games, ${r.winRate}% win rate, KDA ${r.avgKDA}, KP ${r.avgKP}%`
  )
  .join("\n")}

Génère 4-6 insights au format JSON:
[
  {
    "type": "strength" | "weakness" | "recommendation",
    "title": "Titre court",
    "description": "Description détaillée avec explication du pourquoi",
    "priority": "high" | "medium" | "low",
    "data": [{"label": "Stat", "value": "Valeur"}]
  }
]

Exemples:
- Si agression high + objectifs low → "Tu joues agressif mais tu négliges les objectifs"
- Si win rate bas sur un rôle → "Ton win rate sur [rôle] est perfectible"
- Si KP bas → "Ta présence en team fights est faible"

Réponds UNIQUEMENT avec le JSON, pas de texte avant/après.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: `Tu es TheCall, un coach League of Legends expert. Tu analyses les profils de joueurs et génères des insights actionnables basés sur leurs stats et leur style de jeu.`,
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error("No content");

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON found");

    return JSON.parse(jsonMatch[0]) as PlayerProfile["insights"];
  } catch (error) {
    console.error("Profile insights error:", error);
    return generateHeuristicInsights(
      roleStats,
      mainRole,
      aggression,
      objectiveFocus,
      teamFightPresence,
      winRate
    );
  }
}

function generateHeuristicInsights(
  roleStats: RoleStats[],
  mainRole: string,
  aggression: "low" | "medium" | "high",
  objectiveFocus: "low" | "medium" | "high",
  teamFightPresence: "low" | "medium" | "high",
  winRate: number
): PlayerProfile["insights"] {
  const insights: PlayerProfile["insights"] = [];

  // Insight 1: Agression vs Objectifs
  if (aggression === "high" && objectiveFocus === "low") {
    insights.push({
      type: "recommendation",
      title: "Ajuste ton agressivité",
      description:
        "Tu joues très agressif (beaucoup de morts) mais tu négliges les objectifs. Réduis les risques inutiles et priorise la vision + setup avant les drakes/herald.",
      priority: "high",
      data: [
        { label: "Agression", value: "Élevée" },
        { label: "Focus objectifs", value: "Faible" },
      ],
    });
  }

  // Insight 2: Win rate global
  if (winRate < 45) {
    insights.push({
      type: "weakness",
      title: "Win rate à améliorer",
      description: `Ton win rate global est de ${winRate}%. Concentre-toi sur ${mainRole} où tu es le plus à l'aise et évite les rôles où tu performes moins.`,
      priority: "high",
      data: [{ label: "Win rate", value: `${winRate}%` }],
    });
  } else if (winRate > 55) {
    insights.push({
      type: "strength",
      title: "Bonne performance globale",
      description: `Avec ${winRate}% de win rate, tu es sur la bonne voie. Continue à te concentrer sur ${mainRole} pour maintenir ce niveau.`,
      priority: "low",
      data: [{ label: "Win rate", value: `${winRate}%` }],
    });
  }

  // Insight 3: Présence team fights
  if (teamFightPresence === "low") {
    insights.push({
      type: "recommendation",
      title: "Augmente ta présence",
      description:
        "Ton KP moyen est faible. Sois plus présent lors des team fights et rotations. Priorise les roams et la vision pour être au bon endroit au bon moment.",
      priority: "medium",
      data: [{ label: "KP moyen", value: "Faible" }],
    });
  }

  // Insight 4: Rôle principal
  const mainRoleStats = roleStats.find((r) => r.role === mainRole);
  if (mainRoleStats && mainRoleStats.winRate < 50) {
    insights.push({
      type: "weakness",
      title: `${mainRole} à optimiser`,
      description: `Sur ${mainRole} (ton rôle principal), ton win rate est de ${mainRoleStats.winRate}%. Analyse tes replays pour identifier les erreurs récurrentes.`,
      priority: "high",
      data: [
        { label: "Rôle", value: mainRole },
        { label: "Win rate", value: `${mainRoleStats.winRate}%` },
      ],
    });
  }

  return insights;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const puuid =
    searchParams.get("puuid") ||
    process.env.MY_PUUID ||
    process.env.NEXT_PUBLIC_PUUID ||
    "";

  if (!puuid) {
    return NextResponse.json(
      { error: "Missing puuid" },
      { status: 400 }
    );
  }

  try {
    const profile = await analyzeAllMatches(puuid);
    return NextResponse.json({ profile }, { status: 200 });
  } catch (err) {
    console.error("PROFILE ROUTE ERROR", err);
    return NextResponse.json(
      { error: "Failed to generate profile" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
// POST /api/coaching - Génère rapport coaching (OpenAI premium ou heuristique free)
import { NextRequest, NextResponse } from "next/server";
import { getMatchDetailsController } from "@/lib/controllers/matchController";
import type { MatchPageData } from "@/types/match";
import type { CoachingReport } from "@/types/coaching";
import { computeWinProbability } from "@/lib/winProbability";
import { getUserTier, canDoCoaching, getUserTierLimits } from "@/lib/tier";
import { validateJsonSize } from "@/lib/security";
import { checkRateLimit, getRateLimitIdentifier, RATE_LIMITS } from "@/lib/rateLimit";
import { getCsrfTokenFromRequest, isSameOriginRequest, requiresCsrfProtection, validateCsrfToken } from "@/lib/csrf";
import { logger } from "@/lib/logger";

const COACHING_REPORT_VERSION = "v1";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;


import { generateCoachingReportStrict } from "@/lib/openai";

async function generateCoachingReport(
  matchData: MatchPageData,
  winProbData: ReturnType<typeof computeWinProbability>,
  isPremium: boolean = false
): Promise<CoachingReport & { quality?: string; modelUsed?: string }> {
  // 1. Fallback immédiat si FREE ou pas de clé API conf
  if (!isPremium || !OPENAI_API_KEY) {
    return { ...generateHeuristicReport(matchData, winProbData, isPremium), quality: "heuristic" };
  }

  try {
    const userPrompt = buildPrompt(matchData, winProbData, isPremium);
    const systemPrompt = `You are TheCall, an elite League of Legends post-game coach (Master+).
You analyze ONLY the provided match data. If something is missing, say "unknown" — never invent.

Style:
- Direct, concise, no fluff.
- Actionable instructions with timestamps / windows when possible.
- Focus on macro: tempo, resets, objectives, vision, rotations, wave states, punish windows.

Rules:
- Keep the JSON short. Avoid long paragraphs.
- Hard rule: If you don't see it in the data, you cannot claim it.
- Output MUST be STRICT JSON matching the given schema. No extra keys, no markdown, no explanations outside JSON.
- Advice must be specific: "what to do", "when", "why", "how to repeat".
- Prefer 3–6 high-impact points over 20 generic ones.
- If you propose a timing, base it on the match flow or say "around X min".

Content priorities:
1) Biggest turning point(s): identify 1–2 moments that flipped the game.
2) Root causes: 2–4 fundamental mistakes (not symptoms).
3) Action plan: 3 immediate habits to apply next games.
4) Drills: 2 drills that are measurable and repeatable.
5) Punish windows: how to convert a lead or stabilize when behind.

Constraints:
- Avoid generic phrases like "play safer" or "focus objectives" unless you add a concrete trigger + action.
- Use short bullet-like sentences inside JSON strings.
- Keep total output compact.

Input:
(Data provided in the user message below)
`;

    const { reportJson, modelUsed } = await generateCoachingReportStrict(systemPrompt, userPrompt);
    
    // cast result to CoachingReport (schema ensures structure)
    const report = reportJson as CoachingReport;

    return { ...report, quality: "premium", modelUsed };
  } catch (error) {
    logger.error("Coaching API error (OpenAI)", error);
    // Fallback heuristique en cas d'erreur de génération, timeout, ou rate limit
    return { ...generateHeuristicReport(matchData, winProbData, isPremium), quality: "heuristic_fallback" };
  }
}

function buildPrompt(
  matchData: MatchPageData,
  winProbData: ReturnType<typeof computeWinProbability>,
  isPremium: boolean = false
): string {
  const { me, opponent, timelineEvents } = matchData;
  const winProb = winProbData;

  // Détecter turning points (chutes/remontées > 15%)
  const turningPoints: Array<{ minute: number; change: number; event?: string }> = [];
  for (let i = 1; i < winProb.length; i++) {
    const change = winProb[i].probability - winProb[i - 1].probability;
    if (Math.abs(change) > 15) {
      const eventAtMinute = timelineEvents.find(
        (e) => Math.abs(e.minute - winProb[i].minute) < 1
      );
      turningPoints.push({
        minute: winProb[i].minute,
        change,
        event: eventAtMinute?.label,
      });
    }
  }

  // Objectifs pris/perdus avec détails
  const objectives = timelineEvents.filter(
    (e) => e.kind === "dragon" || e.kind === "herald" || e.kind === "baron" || e.kind === "tower"
  );

  const allyObjectives = objectives.filter((e) => e.team === "ally");
  const enemyObjectives = objectives.filter((e) => e.team === "enemy");

  // Analyser les builds
  const myItems = me.build.items.filter((id) => id !== "0");
  const opponentItems = opponent?.build.items.filter((id) => id !== "0") ?? [];

  // Détecter patterns d'erreurs récurrents
  const earlyDeaths = timelineEvents.filter(
    (e) => e.kind === "death" && e.involved && e.minute < 10
  ).length;

  const lateGameDeaths = timelineEvents.filter(
    (e) => e.kind === "death" && e.involved && e.minute > 25
  ).length;

  // Gold efficiency
  const goldSpent = myItems.length * 1000; // Estimation
  const goldEfficiency = me.gold > 0 ? (goldSpent / me.gold) * 100 : 0;

  // KP timing analysis
  const earlyKP = timelineEvents
    .filter((e) => (e.kind === "kill" || e.kind === "assist") && e.involved && e.minute < 15)
    .length;
  const midKP = timelineEvents.filter(
    (e) =>
      (e.kind === "kill" || e.kind === "assist") &&
      e.involved &&
      e.minute >= 15 &&
      e.minute < 25
  ).length;

  const premiumContext = isPremium
    ? `

**ANALYSE PREMIUM**:

**Build Analysis**:
- Tes items: ${myItems.join(", ") || "Aucun"}
- Items opponent: ${opponentItems.join(", ") || "N/A"}
- Gold efficiency: ${goldEfficiency.toFixed(0)}%
- Build cohérent: ${myItems.length >= 3 ? "Oui" : "Non (items manquants)"}

**Patterns détectés**:
- Morts early game (<10min): ${earlyDeaths} ${earlyDeaths > 2 ? "(Trop de morts early)" : ""}
- Morts late game (>25min): ${lateGameDeaths} ${lateGameDeaths > 3 ? "(Décisions risquées en late)" : ""}
- KP early (0-15min): ${earlyKP} ${earlyKP < 1 ? "(Manque de présence early)" : ""}
- KP mid (15-25min): ${midKP} ${midKP < 2 ? "(Participation mid faible)" : ""}

**Objectifs détaillés**:
- Alliés: ${allyObjectives.map((o) => `${o.minute}min ${o.label}`).join(", ") || "Aucun"}
- Ennemis: ${enemyObjectives.map((o) => `${o.minute}min ${o.label}`).join(", ") || "Aucun"}
- Différence: ${allyObjectives.length - enemyObjectives.length} objectifs

**Contexte supplémentaire**:
- Matchup: ${me.champion} (${me.role}) vs ${opponent?.champion || "N/A"} (${opponent?.role || "N/A"})
- Durée: ${Math.floor(winProb[winProb.length - 1]?.minute || 0)} minutes
- Résultat: ${me.win ? "Victoire" : "Défaite"}`
    : "";

  return `Analyse cette partie de League of Legends et génère un rapport coaching ${isPremium ? "PREMIUM et détaillé" : "essentiel"}.

**Résultat**: ${me.win ? "VICTOIRE" : "DÉFAITE"}
**Rôle**: ${me.role} (${me.champion})
**Opponent**: ${opponent?.champion || "N/A"} (${opponent?.role || "N/A"})

**Stats**:
- KDA: ${me.kda} (KP: ${me.kp}%)
- Gold: ${me.gold.toLocaleString()}
- Opponent KDA: ${opponent?.kda || "N/A"} (KP: ${opponent?.kp || 0}%)
- Opponent Gold: ${opponent?.gold.toLocaleString() || "N/A"}

**Objectifs**:
- Alliés: ${allyObjectives.length} (dragon, herald, baron, towers)
- Ennemis: ${enemyObjectives.length}
${isPremium ? `- Détails alliés: ${allyObjectives.map((o) => `${o.minute}min ${o.label}`).join(", ") || "Aucun"}\n- Détails ennemis: ${enemyObjectives.map((o) => `${o.minute}min ${o.label}`).join(", ") || "Aucun"}` : ""}

**Turning Points détectés**:
${turningPoints
  .map(
    (tp) =>
      `- ${tp.minute} min: ${tp.change > 0 ? "+" : ""}${tp.change.toFixed(1)}% win prob${tp.event ? ` (${tp.event})` : ""}`
  )
  .join("\n") || "Aucun turning point significatif détecté"}

**Win Probability finale**: ${winProb[winProb.length - 1]?.probability || 50}%${premiumContext}

${isPremium ? `**INSTRUCTIONS PREMIUM**:
- Analyse en profondeur le build (items/rune cohérence, timing d'achat)
- Identifie les patterns d'erreurs récurrents (morts répétées, objectifs manqués)
- Donne des conseils macro avancés (rotations, tempo, vision)
- Compare avec le meta actuel du patch 14.18
- Propose des alternatives concrètes (items, runes, stratégie)
- Sois précis sur les timings (ex: "À 14:30, reset 40s avant Drake")` : ""}

Génère un rapport JSON avec cette structure exacte:
{
  "turningPoint": {
    "type": "turning_point",
    "title": "Moment clé",
    "description": "Description du moment clé avec timestamp et cause",
    "timestamp": "15:23",
    "impact": "-18% win prob"
  },
  "focus": {
    "type": "focus",
    "title": "Focus prioritaire",
    "description": "Un seul axe clair à travailler (tempo, rotations, objectifs, etc.)"
  },
  "action": {
    "type": "action",
    "title": "Action next game",
    "description": "Une consigne simple et actionnable pour la prochaine partie"
  },
  "positives": [
    {
      "type": "positive",
      "title": "Point fort",
      "description": "Ce qui a bien fonctionné"
    }
  ],
  "negatives": [
    {
      "type": "negative",
      "title": "Point à améliorer",
      "description": "Ce qui doit être corrigé"
    }
  ]${isPremium ? `,
  "rootCauses": {
    "title": "Causes racines",
    "causes": [
      {
        "cause": "Cause principale identifiée",
        "evidence": ["Événement 1 à timestamp précis", "Événement 2", "Timing spécifique"],
        "timing": "12:30"
      }
    ]
  },
  "actionPlan": {
    "title": "Plan d'action",
    "rules": [
      {
        "rule": "Règle concrète à appliquer",
        "phase": "early",
        "antiErrors": ["Erreur à éviter 1", "Erreur à éviter 2"]
      }
    ]
  },
  "drills": {
    "title": "Drills / exercices",
    "exercises": [
      {
        "exercise": "Nom de l'exercice",
        "description": "Description détaillée de l'exercice",
        "games": 3
      }
    ]
  }` : ""}
}

Réponds UNIQUEMENT avec le JSON, pas de texte avant/après.`;
}



function generateHeuristicReport(
  matchData: MatchPageData,
  winProbData: ReturnType<typeof computeWinProbability>,
  isPremium: boolean = false
): CoachingReport {
  const { me, timelineEvents } = matchData;
  const winProb = winProbData;

  // Détecter turning point (plus grande chute/remontée)
  let maxChange = 0;
  let turningPointMinute = 0;
  for (let i = 1; i < winProb.length; i++) {
    const change = winProb[i].probability - winProb[i - 1].probability;
    if (Math.abs(change) > Math.abs(maxChange)) {
      maxChange = change;
      turningPointMinute = winProb[i].minute;
    }
  }

  const turningPointEvent = timelineEvents.find(
    (e) => e.minute === turningPointMinute
  );

  const objectives = timelineEvents.filter(
    (e) => e.kind === "dragon" || e.kind === "herald" || e.kind === "baron"
  );
  const allyObjectives = objectives.filter((e) => e.team === "ally").length;
  const enemyObjectives = objectives.filter((e) => e.team === "enemy").length;
  
  // Analyser pour sections premium
  const earlyDeaths = timelineEvents.filter(
    (e) => e.kind === "death" && e.involved && e.minute < 10
  );
  // midGameDeaths calculé mais non utilisé pour l'instant (réservé pour futures améliorations)
  const objectiveLosses = timelineEvents.filter(
    (e) => (e.kind === "dragon" || e.kind === "herald" || e.kind === "baron") && e.team === "enemy"
  );

  return {
    turningPoint: {
      type: "turning_point",
      title: "Moment clé",
      description: turningPointEvent
        ? `${turningPointMinute}:00 — ${turningPointEvent.label}`
        : `${turningPointMinute}:00 — Changement de tempo`,
      timestamp: `${turningPointMinute}:${String(Math.floor((turningPointMinute % 1) * 60)).padStart(2, "0")}`,
      impact: `${maxChange > 0 ? "+" : ""}${maxChange.toFixed(0)}% win prob`,
    },
    focus: {
      type: "focus",
      title: "Focus prioritaire",
      description:
        allyObjectives < enemyObjectives
          ? "Objectifs : prioriser la présence et la vision avant les drakes/herald/baron"
          : me.kp < 50
          ? "Participation : augmenter ta présence en fights (roams, rotations)"
          : "Tempo : maintenir l'avantage et convertir en objectifs",
    },
    action: {
      type: "action",
      title: "Action next game",
      description: "Reset + vision 40s avant le spawn du premier objectif",
    },
    positives: [
      {
        type: "positive",
        title: "Point fort",
        description: me.kp > 60 ? "Bonne participation en fights" : "Build cohérent",
      },
    ],
    negatives: [
      {
        type: "negative",
        title: "Point à améliorer",
        description:
          allyObjectives < enemyObjectives
            ? "Objectifs perdus : focus vision et timing"
            : "KP perfectible : plus de présence en mid game",
      },
    ],
    // Sections premium avec données heuristiques (uniquement si isPremium = true)
    ...(isPremium ? {
      rootCauses: {
        title: "Causes racines",
        causes: [
          {
            cause: allyObjectives < enemyObjectives
              ? "Objectifs perdus par manque de vision"
              : earlyDeaths.length > 2
              ? "Morts répétées en early game"
              : "Tempo lâché en mid game",
            evidence: [
              objectiveLosses.length > 0
                ? `${objectiveLosses[0]?.minute || turningPointMinute}:00 — Objectif perdu (vision insuffisante)`
                : `${turningPointMinute}:00 — Changement de tempo détecté`,
              earlyDeaths.length > 0
                ? `${earlyDeaths[0]?.minute || 5}:00 — Mort early game (${earlyDeaths.length} mort(s) avant 10min)`
                : `${turningPointMinute}:00 — Win prob chute de ${Math.abs(maxChange).toFixed(0)}%`,
              me.kp < 50
                ? "KP faible : participation limitée aux fights"
                : "Gold non converti en objectifs",
            ],
            timing: `${turningPointMinute}:${String(Math.floor((turningPointMinute % 1) * 60)).padStart(2, "0")}`,
          },
        ],
      },
      actionPlan: {
      title: "Plan d'action",
      rules: [
        {
          rule: allyObjectives < enemyObjectives
            ? "Setup vision 40s avant chaque objectif"
            : "Maintenir tempo après lead",
          phase: "early",
          antiErrors: [
            "Ne pas rester en lane sans vision",
            "Éviter les fights 2v3 sans backup",
          ],
        },
        {
          rule: "Convertir gold lead en objectifs",
          phase: "mid",
          antiErrors: [
            "Ne pas back pendant spawn objet",
            "Éviter les roams inutiles sans impact",
          ],
        },
        {
          rule: "Prioriser sécurité en late game",
          phase: "late",
          antiErrors: [
            "Ne pas split push sans vision",
            "Respecter les cooldowns ultimes",
          ],
        },
      ],
    },
      drills: {
      title: "Drills / exercices",
      exercises: [
        {
          exercise: me.kp < 50
            ? "Améliorer la participation en fights"
            : "Optimiser le timing des objectifs",
          description: me.kp < 50
            ? "Sur 5 games, vise 65%+ KP en te concentrant sur les rotations et la présence en mid game"
            : "Sur 5 games, focus sur le setup vision 40s avant chaque Drake/Herald",
          games: 5,
        },
        {
          exercise: earlyDeaths.length > 1
            ? "Réduire les morts early game"
            : "Améliorer la gestion des ressources",
          description: earlyDeaths.length > 1
            ? "Sur 3 games, limite à 1 mort max avant 10min en jouant plus safe"
            : "Sur 3 games, optimise tes backs et ton gold spending pour être présent aux objectifs",
          games: 3,
        },
      ],
    },
    } : {}),
  };
}

import { prisma } from "@/lib/prisma"; // Added import

// ... (previous imports)

// ... (helper functions: generateCoachingReport, buildPrompt, parseLLMResponse, generateHeuristicReport) stay same

// Main POST handler:
// ... imports ...
import { ensureUser } from "@/lib/db/ensureUser";
import { persistMatchJson } from "@/lib/db/persistMatchJson";
import { persistTimelineJson } from "@/lib/db/persistTimelineJson";
import { getRawMatch, getRawTimeline } from "@/lib/controllers/matchController";
// ... (keep generic helpers like generateCoachingReport etc) ...

// Main POST handler:
export async function POST(req: NextRequest) {
  try {
    // CSRF & Rate Limit checks (keep existing)
    if (requiresCsrfProtection("POST", req.nextUrl.pathname)) {
        const isSameOrigin = isSameOriginRequest(req);
        if (!isSameOrigin) {
          const csrfToken = getCsrfTokenFromRequest(req);
          const sessionToken = req.cookies.get("csrf-token")?.value;
          if (!csrfToken || !validateCsrfToken(csrfToken, sessionToken || "")) {
            return NextResponse.json({ error: "CSRF token invalide ou manquant" }, { status: 403 });
          }
        }
    }
    const identifier = getRateLimitIdentifier(req);
    const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.coaching);
    if (!rateLimit.allowed) {
        return NextResponse.json({ error: "Too many requests", retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000) }, { status: 429 });
    }

    // Parse Body
    const bodyText = await req.text();
    if (bodyText.length > 5 * 1024 * 1024) return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    const body = JSON.parse(bodyText);
    if (!validateJsonSize(body, 5 * 1024 * 1024)) return NextResponse.json({ error: "Request data too large" }, { status: 413 });
    if (!body.matchData && !body.matchId) return NextResponse.json({ error: "Missing matchData or matchId" }, { status: 400 });

    let matchData = body.matchData;
    // Retrieve match data if needed (if body only has ID)
    if (!matchData && body.matchId) {
        const puuid = process.env.MY_PUUID || process.env.NEXT_PUBLIC_PUUID || "";
        if (!puuid) return NextResponse.json({ error: "Configuration error: Missing PUUID" }, { status: 500 });
        matchData = await getMatchDetailsController(body.matchId, puuid);
        if (!matchData) return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    if (!matchData) return NextResponse.json({ error: "Failed to retrieve match data" }, { status: 404 });

    // Identify Context
    interface MatchDataWithId { matchId?: string; match?: { id?: string }; }
    const riotMatchId = body.matchId || (matchData as unknown as MatchDataWithId).matchId || (matchData as unknown as MatchDataWithId).match?.id;
    if (!riotMatchId) return NextResponse.json({ error: "Could not identify matchId" }, { status: 400 });

    const puuid = process.env.MY_PUUID || process.env.NEXT_PUBLIC_PUUID || ""; // Helper relies on this
    // We ideally need the PUUID used for fetching. Assuming MY_PUUID for now as in controller.

    // 1. Ensure User & Match Persistence
    // Ideally we assume matchController already persisted Match, but we verify here for robustness
    let userId: string | undefined = undefined;
    
    // Attempt to persist/retrieve user
    if (puuid) {
        try {
            const user = await ensureUser({ riotPuuid: puuid });
            userId = user.id;
            logger.debug(`[Coaching API] User ensured (id=${userId})`);
        } catch (e) {
            logger.warn("[Coaching API] Failed to ensure user", { error: e });
        }
    }

    // Check Tier/Quota
    const tier = getUserTier(userId); // Works even if userId undefined (returns free)
    const limits = getUserTierLimits(userId);
    const quota = await canDoCoaching(userId);
    
    if (!quota.allowed) {
        return NextResponse.json({ 
            error: "Quota coaching épuisé", 
            message: `Tu as utilisé ${quota.limit}/${quota.limit} coachings.`,
            remaining: 0 
        }, { status: 403 });
    }

    const isPremium = tier === "pro" && limits.coachingQuality === "premium";
    const quality = isPremium ? "premium" : "heuristic";

    // 2. Check DB Cache (CoachingReport)
    let dbMatchId: string | undefined;

    if (userId) {
        // Find Match Row
        const dbMatch = await prisma.match.findUnique({
             where: { userId_matchId: { userId, matchId: riotMatchId } }
        });
        
        if (dbMatch) {
            dbMatchId = dbMatch.id;

            // LAZY LOAD: Ensure we have MatchJSON & TimelineJSON if we are going to generate
            // If cached report exists, we don't strictly need them unless we want to access them? 
            // Users want fast return. So check report FIRST.

            // Check existing report
            const dbReport = await prisma.coachingReport.findUnique({
                where: {
                    matchDbId_version_quality: {
                        matchDbId: dbMatch.id,
                        version: COACHING_REPORT_VERSION,
                        quality: quality
                    }
                }
            });

            if (dbReport) {
                logger.debug(`[DB] coachingReport HIT (matchId=${riotMatchId}, quality=${quality})`);
                return NextResponse.json({
                    report: dbReport.reportJson,
                    isPremium: quality === "premium", // Current user intent
                    quality: dbReport.quality, // Actual quality served
                    modelUsed: dbReport.modelUsed,
                    tier,
                    cached: true,
                    quota: { remaining: quota.remaining, limit: quota.limit }
                });
            }

            // Report MISSING -> proceed to generate.
            // NOW ensure we have the heavy JSONs in DB (lazy load)
            
            // A) Check MatchJSON
            if (!dbMatch.hasMatchJson) {
                logger.info(`[Coaching API] Lazy loading matchJson for ${riotMatchId}`);
                // matchData might be full or partial. If it lacks info, refetch.
                // We have matchData from body maybe? 
                // matchController.getMatchDetailsController returns processed data, not raw JSON.
                // So we likely need to fetch RAW match to persist.
                await persistMatchJson({ 
                     userId, 
                     matchId: riotMatchId, 
                     matchJson: await getRawMatch(riotMatchId, undefined, undefined, 'none') // Fetch but don't auto-persist logic here, we call explicit helper
                });
            }

            // B) Check TimelineJSON
            if (!dbMatch.hasTimelineJson) {
                 logger.info(`[Coaching API] Lazy loading timelineJson for ${riotMatchId}`);
                 const rawTimeline = await getRawTimeline(riotMatchId, undefined); // Fetch raw
                 if (rawTimeline) {
                     await persistTimelineJson({ userId, matchId: riotMatchId, timelineJson: rawTimeline });
                 }
            }

        } else {
            // Match not in DB at all?
            // This happens if user never visited /match list? Or fresh directly to coach?
            // We should persist full match.
             try {
                // Fetch & Persist FULL
                await getRawMatch(riotMatchId, userId, puuid, 'full');
                await getRawTimeline(riotMatchId, userId); // This internally persists if userId present? 
                // getRawTimeline(..., userId) -> calls persistTimelineJson if userId present.
                // So calling with userId is enough?
                // logic in matchController: if (userId && riotData) persistTimelineJson...
                // Yes.
             } catch (e) {
                logger.warn("[Coaching API] Recovery persist failed", { error: e });
             }
             // Re-fetch ID?
             const retryMatch = await prisma.match.findUnique({ where: { userId_matchId: { userId, matchId: riotMatchId } }});
             dbMatchId = retryMatch?.id;
        }
    }

    // 3. Generate Report
    logger.info("[Coaching API] Generating Report (fresh)", { matchId: riotMatchId, quality: isPremium ? "premium (attempt)" : "heuristic" });
    const winProbData = computeWinProbability(matchData.timelineEvents);
    const result = await generateCoachingReport(matchData, winProbData, isPremium);
    
    // Extract flags from result (added in generateCoachingReport)
    const reportQuality = (result as any).quality || (isPremium ? "premium" : "heuristic");
    const modelUsed = (result as any).modelUsed || null;

    // Clean result to be just CoachingReport for persistent storage JSON
    // (We cast to any to drop extra props temporary, logic below handles it)
    const reportToStore = { ...result };
    delete (reportToStore as any).quality;
    delete (reportToStore as any).modelUsed;

    // 4. Persist Report
    if (dbMatchId) {
        try {
            await prisma.coachingReport.upsert({
                where: {
                    matchDbId_version_quality: {
                        matchDbId: dbMatchId,
                        version: COACHING_REPORT_VERSION,
                        quality: reportQuality // Store as actual quality produced (might be heuristic_fallback)
                    }
                },
                create: {
                   matchDbId: dbMatchId,
                   version: COACHING_REPORT_VERSION,
                   quality: reportQuality,
                   // eslint-disable-next-line @typescript-eslint/no-explicit-any
                   reportJson: reportToStore as any,
                   modelUsed: modelUsed
                },
                update: {
                   // eslint-disable-next-line @typescript-eslint/no-explicit-any
                   reportJson: reportToStore as any,
                   modelUsed: modelUsed
                }
            });
            logger.info(`[DB] coachingReport upsert OK (matchId=${riotMatchId}, quality=${reportQuality})`);
        } catch (e) {
            logger.error("[DB] Failed to save coaching report", e);
        }
    }

    // 5. Update Quota (only if Premium was successfully generated)
    // If we fell back to heuristic, we DO NOT consume quota
    let remaining = quota.remaining;
    if (isPremium && reportQuality === "premium") {
        // TODO: Call decrement service here if implemented
        remaining = quota.remaining - 1; 
    }

    return NextResponse.json({
        report: reportToStore,
        isPremium: isPremium, // user tier status
        quality: reportQuality, // actual generation quality
        tier,
        cached: false,
        quota: { remaining, limit: quota.limit }
    });

  } catch (error) {
    logger.error("COACHING ROUTE ERROR", error);
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 500 });
  }
}

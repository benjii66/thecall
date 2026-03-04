export const runtime = "nodejs";
// POST /api/coaching - Génère rapport coaching (OpenAI premium ou heuristique free)
import { NextRequest, NextResponse } from "next/server";
import { getMatchDetailsController } from "@/lib/controllers/matchController";
import type { MatchPageData } from "@/types/match";
import type { CoachingReport } from "@/types/coaching";
import { computeWinProbability } from "@/lib/winProbability";
import { getUserTierServer, canDoCoachingServer, getUserTierLimitsServer, incrementCoachingUsage } from "@/lib/tier-server";


import { validateJsonSize } from "@/lib/security";
import { checkRateLimit, getRateLimitIdentifier, RATE_LIMITS } from "@/lib/rateLimit";
import { getCsrfTokenFromRequest, isSameOriginRequest, requiresCsrfProtection, validateCsrfToken } from "@/lib/csrf";
import { logger } from "@/lib/logger";

const COACHING_REPORT_VERSION = "v1";


import { generateCoachingReportStrict } from "@/lib/openai";

async function generateCoachingReport(
  matchData: MatchPageData,
  winProbData: ReturnType<typeof computeWinProbability>,
  isPremium: boolean = false
): Promise<CoachingReport & { quality?: string; modelUsed?: string }> {
  // 1. Fallback immédiat si FREE ou pas de clé API conf
  const apiKey = process.env.OPENAI_API_KEY;
  if (!isPremium || !apiKey) {
    return { ...generateHeuristicReport(matchData, winProbData, isPremium), quality: "heuristic" };
  }

  try {
    const userPrompt = buildPrompt(matchData, winProbData, isPremium);
const systemPrompt = `You are TheCall, an elite League of Legends post-game coach (Challenger/Pro Tier).
You analyze ONLY the provided match data. If something is missing, say "unknown" — never invent.

**Role & Persona**:
You are a **Challenger Head Coach**. You are TOUGH, DIRECT, and STRICT.
- No "Nice try", no "Good job". WE WANT TO WIN.
- Point out mistakes ruthlessly. Avoid "obvious" advice like "don't die" unless it was the #1 reason for losing.
- If the build is bad, SAY IT. "Freezing heart vs 4 AP? trolling."
- Focus on **Win Conditions**, **Tempo**, and **Macro**.

**Process**:
1. **Review the Preliminary Analysis**: Use the maths as a factual base, but ADD VALUE.
2. **Progression Objectives**: You MUST provide EXACTLY 3 distinct objectives in "negatives".
3. **Analyze Build vs Matchup**:
   - Critique BAD choices ruthlessly (e.g. Armor vs AP).
   - **VALIDATE GOOD CHOICES**: If the build is perfect, say it!
   - Be specific: cite the item name and *why* it worked or failed in THIS specific game context.
4. **Identify the Pivot Point**: Find the exact moment the game was lost.

**Output Style**:
- **Strict JSON** only.
- **Short, punchy sentences**. No fluff.
- **Actionable**: "Rotate to Drake at 14:00" > "Control objectives".
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

  const gameDurationMin = (winProb[winProb.length - 1]?.minute || 20);
  const myCS = me.cs;
  const myLevel = me.level;
  const opponentCS = opponent?.cs || 0;

  const csPerMin = (myCS / gameDurationMin).toFixed(1);

  // Extract Builds with Names
  const myItems = me.build.items.map(id => me.build.itemNames?.[id] || id).join(", ");
  const opItems = opponent?.build.items.map(id => opponent.build.itemNames?.[id] || id).join(", ") || "Unknown";

  // 1. Generate Heuristic Baseline
  const heuristicReport = generateHeuristicReport(matchData, winProbData, isPremium);
  
  // 2. Format Timeline (Compressed)
  const compressedTimeline = formatTimelineEvents(timelineEvents);

  // 3. Construct Augmented Prompt
  return `Analyse cette partie de League of Legends.
  
  **PRELIMINARY ANALYSIS (MATHS)** - Use this as a factual baseline:
  - **Review**: ${JSON.stringify(heuristicReport.focus)}
  - **Strength**: ${JSON.stringify(heuristicReport.positives[0])}
  - **Weakness**: ${JSON.stringify(heuristicReport.negatives[0])}
  - **Key Moment Calculation**: ${JSON.stringify(heuristicReport.turningPoint)}
  
  **CONTEXT**:
  - **Game Version**: ${matchData.gameVersion}
  - **Résultat**: ${me.win ? "VICTOIRE" : "DÉFAITE"}
  - **Matchup**: ${me.role} (${me.champion}) vs ${opponent?.champion || "Unknown"}
  - **Stats**: KDA ${me.kda} | CS ${myCS} (${csPerMin}/min) | Gold ${me.gold} | Lvl ${myLevel} | KP ${me.kp}%
  - **My Build**: ${myItems}
  - **Opponent Build**: ${opItems}
  - **Opponent**: CS ${opponentCS} | Gold ${opponent?.gold} | KP ${opponent?.kp}%
  
  **TIMELINE (Compressed)**:
  ${compressedTimeline}
  
  **YOUR MISSION**:
  Using the Preliminary Analysis and the Timeline, generate a **PREMIUM COACHING REPORT** that explains *WHY* the stats are what they are. 
  - You MUST provide **EXACTLY 3** distinct "negatives" (progression objectives).
  - Do not be too generic. If they died 11 times, don't just say "stop dying", explain *where* (e.g., "Facechecking bush at 12:00").
  - If "Farming & Ressources" is the focus, look at the timeline to see *where* the farm was lost.
  - If "Presence" is low, identify missed rotations in the timeline.
  
  ${isPremium ? `**INSTRUCTIONS PREMIUM**:
  - ADAPTE TES CONSEILS AU RÔLE (${me.role}): Un Toplaner ne joue pas comme un Support.
  - Analyse en profondeur le build (si fourni) et les timings.
  - Sois précis sur les timings (ex: "À 14:30, reset 40s avant Drake").` : ""}

  
  ${isPremium ? `**INSTRUCTIONS PREMIUM**:
  - ADAPTE TES CONSEILS AU RÔLE (${me.role}): Un Toplaner ne joue pas comme un Support (focus splitpush vs vision).
  - IDENTIFIE LE CS DIFFERENTIAL: Si ${csPerMin} < 6, c'est un problème majeur de farming.
  - Analyse en profondeur le build (items/rune cohérence, timing d'achat)
  - Identifie les patterns d'erreurs récurrents (morts répétées, objectifs manqués)
  - Donne des conseils macro avancés (rotations, tempo, vision)
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
  "buildAnalysis": {
    "title": "Analyse du Build",
    "critique": "Critique directe de ton build vs l'équipe adverse. (Ex: 'Tu n'as pas d'anti-heal contre Soraka')",
    "suggestions": [
      {
        "item": "Nom de l'item suggéré (ex: Morellonomicon)",
        "reason": "Pourquoi cet item était meilleur dans cette game ?",
        "replace": "Quel item de ton build il fallait remplacer"
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





 

import { prisma } from "@/lib/prisma"; // Added import

// ... (previous imports)

// ... (helper functions: generateCoachingReport, buildPrompt, parseLLMResponse, generateHeuristicReport) stay same

// Main POST handler:
// ... imports ...
import { ensureUser } from "@/lib/db/ensureUser";
import { persistMatchJson } from "@/lib/db/persistMatchJson";
import { persistTimelineJson } from "@/lib/db/persistTimelineJson";
import { getRawMatch, getRawTimeline } from "@/lib/controllers/matchController";
import { formatTimelineEvents } from "@/lib/timelineUtils";
import { generateHeuristicReport } from "@/lib/coachingUtils";
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
    const tier = getUserTierServer(userId); 
    const limits = getUserTierLimitsServer(userId);
    const quota = await canDoCoachingServer(userId);
    
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reportQuality = (result as any).quality || (isPremium ? "premium" : "heuristic");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modelUsed = (result as any).modelUsed || null;

    // Clean result to be just CoachingReport for persistent storage JSON
    const reportToStore: Record<string, unknown> = { ...result };
    delete reportToStore.quality;
    delete reportToStore.modelUsed;

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
        if (userId) {
            await incrementCoachingUsage(userId);
        }
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

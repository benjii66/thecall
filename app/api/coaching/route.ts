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
import { getCache, setCache } from "@/lib/services/redisCacheService";

const COACHING_REPORT_VERSION = "v1";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

async function generateCoachingReport(
  matchData: MatchPageData,
  winProbData: ReturnType<typeof computeWinProbability>,
  isPremium: boolean = false
): Promise<CoachingReport> {
  // Si pas premium ou pas d'API key, utiliser heuristique
  if (!isPremium || !OPENAI_API_KEY) {
    return generateHeuristicReport(matchData, winProbData, isPremium);
  }

  try {
    const prompt = buildPrompt(matchData, winProbData, isPremium);
    
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
            content: `Tu es TheCall, un coach League of Legends expert en analyse post-match, spécialisé dans la macro et le tempo.

**Ton expertise**:
- Analyse approfondie des builds (cohérence, timing, meta)
- Détection de patterns d'erreurs récurrents
- Conseils macro avancés (rotations, vision, objectifs, tempo)
- Comparaison avec le meta actuel (patch 14.18)
- Alternatives concrètes et actionnables

**Ton style**:
- Direct et précis, pas de blabla marketing
- Concentré sur la macro, le tempo, les objectifs
- Conseils actionnables avec timings précis
- Adapté aux joueurs bas/moyen niveau (Iron à Platine)
- Français naturel et accessible

**Format de réponse**:
- Turning Point: timestamp précis + cause détaillée + impact
- Focus: un seul axe clair avec explication du pourquoi
- Action: consigne concrète avec timing exact (ex: "Reset + vision à 14:20, 40s avant Drake")
- Positives/Negatives: points spécifiques, pas génériques${isPremium ? `
- Root Causes: causes racines avec preuves détaillées (événements, timings précis)
- Action Plan: règles concrètes par phase (early/mid/late) avec anti-erreurs
- Drills: exercices personnalisés avec nombre de games à pratiquer` : ""}`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: isPremium ? 2000 : 1500, // Plus de tokens pour premium
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content from OpenAI");
    }

    return parseLLMResponse(content, matchData, winProbData, isPremium);
  } catch (error) {
    logger.error("Coaching API error", error);
    // Fallback heuristique en cas d'erreur (même si premium)
    return generateHeuristicReport(matchData, winProbData, isPremium);
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

function parseLLMResponse(
  content: string,
  matchData: MatchPageData,
  winProbData: ReturnType<typeof computeWinProbability>,
  isPremium: boolean = false
): CoachingReport {
  try {
    // Extraire le JSON (peut être entouré de markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as CoachingReport;
    
    // Validation basique
    if (!parsed.positives || !Array.isArray(parsed.positives)) {
      parsed.positives = [];
    }
    if (!parsed.negatives || !Array.isArray(parsed.negatives)) {
      parsed.negatives = [];
    }

    // Validation des sections premium (optionnelles, uniquement si isPremium)
    if (isPremium) {
      if (parsed.rootCauses && (!parsed.rootCauses.causes || !Array.isArray(parsed.rootCauses.causes) || parsed.rootCauses.causes.length === 0)) {
        logger.warn("[Coaching] rootCauses invalide ou vide, suppression");
        parsed.rootCauses = undefined;
      }
      if (parsed.actionPlan && (!parsed.actionPlan.rules || !Array.isArray(parsed.actionPlan.rules) || parsed.actionPlan.rules.length === 0)) {
        logger.warn("[Coaching] actionPlan invalide ou vide, suppression");
        parsed.actionPlan = undefined;
      }
      if (parsed.drills && (!parsed.drills.exercises || !Array.isArray(parsed.drills.exercises) || parsed.drills.exercises.length === 0)) {
        logger.warn("[Coaching] drills invalide ou vide, suppression");
        parsed.drills = undefined;
      }
      
      // Log pour debug
      if (isPremium) {
        logger.debug("[Coaching Premium] Sections générées", {
          hasRootCauses: !!parsed.rootCauses,
          hasActionPlan: !!parsed.actionPlan,
          hasDrills: !!parsed.drills,
        });
      }
    } else {
      // Si pas premium, supprimer les sections premium si présentes
      parsed.rootCauses = undefined;
      parsed.actionPlan = undefined;
      parsed.drills = undefined;
    }

    return parsed;
  } catch (error) {
    logger.error("Failed to parse LLM response", error);
    // Fallback heuristique (sans sections premium si pas isPremium)
    return generateHeuristicReport(matchData, winProbData, isPremium);
  }
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

export async function POST(req: NextRequest) {
  try {
    // CSRF Protection (sauf pour les appels depuis Server Components)
    if (requiresCsrfProtection("POST", req.nextUrl.pathname)) {
      // Permettre les appels depuis le même serveur (Server Components)
      const isSameOrigin = isSameOriginRequest(req);
      
      if (!isSameOrigin) {
        const csrfToken = getCsrfTokenFromRequest(req);
        const sessionToken = req.cookies.get("csrf-token")?.value;
        
        if (!csrfToken || !validateCsrfToken(csrfToken, sessionToken || "")) {
          return NextResponse.json(
            { error: "CSRF token invalide ou manquant" },
            { status: 403 }
          );
        }
      }
    }
    
    // Rate limiting
    const identifier = getRateLimitIdentifier(req);
    const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.coaching);
    
    if (!rateLimit.allowed) {
      const response = NextResponse.json(
        {
          error: "Too many requests",
          message: "Tu as dépassé la limite de requêtes. Réessaie dans quelques instants.",
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
        },
        { status: 429 }
      );
      response.headers.set("X-RateLimit-Limit", String(RATE_LIMITS.coaching.maxRequests));
      response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
      response.headers.set("X-RateLimit-Reset", String(rateLimit.resetAt));
      response.headers.set("Retry-After", String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)));
      return response;
    }
    
    // Limiter la taille du body (max 5MB)
    const bodyText = await req.text();
    if (bodyText.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 }
      );
    }
    
    const body = JSON.parse(bodyText) as {
      matchData?: MatchPageData;
      matchId?: string;
      isPremium?: boolean;
    };
    
    // Valider la taille de l'objet JSON
    if (!validateJsonSize(body, 5 * 1024 * 1024)) {
      return NextResponse.json(
        { error: "Request data too large" },
        { status: 413 }
      );
    }
    
    // Validation: Soit matchData, soit matchId
    if (!body.matchData && !body.matchId) {
      return NextResponse.json(
        { error: "Missing matchData or matchId" },
        { status: 400 }
      );
    }

    let matchData = body.matchData;

    // Si on a seulement matchId, on récupère les données
    if (!matchData && body.matchId) {
      const puuid = process.env.MY_PUUID || process.env.NEXT_PUBLIC_PUUID || ""; // TODO: Mieux gérer le PUUID
      
      if (!puuid) {
         return NextResponse.json({ error: "Configuration error: Missing PUUID" }, { status: 500 });
      }

      const fetchedData = await getMatchDetailsController(body.matchId, puuid);
      if (!fetchedData) {
        return NextResponse.json({ error: "Match not found" }, { status: 404 });
      }
      matchData = fetchedData;
    }

    // Verify matchData presence
    if (!matchData) {
        return NextResponse.json({ error: "Failed to retrieve match data" }, { status: 404 });
    }

    interface MatchDataWithId {
      matchId?: string;
      match?: { id?: string };
    }
    const targetMatchId = body.matchId || (matchData as unknown as MatchDataWithId).matchId || (matchData as unknown as MatchDataWithId).match?.id;

    if (!targetMatchId) {
      return NextResponse.json(
        { error: "Could not identify matchId for caching" },
        { status: 400 }
      );
    }

    // TODO: Récupérer userId depuis session/cookie
    const userId = req.cookies.get("userId")?.value;

    // Vérifier le tier et le quota
    const tier = getUserTier(userId);
    const limits = getUserTierLimits(userId);
    const quota = await canDoCoaching(userId);

    // Vérifier si l'utilisateur peut faire un coaching
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: "Quota coaching épuisé",
          message: `Tu as utilisé ${quota.limit}/${quota.limit} coachings ce mois. Upgrade Pro pour coaching illimité.`,
          remaining: 0,
          limit: quota.limit,
        },
        { status: 403 }
      );
    }

    // Déterminer si premium (basé sur le tier réel, pas le body)
    const isPremium = tier === "pro" && limits.coachingQuality === "premium";
    
    logger.debug("[Coaching API] Tier détecté", { 
      devTier: process.env.DEV_TIER,
      tier, 
      isPremium, 
      coachingQuality: limits.coachingQuality 
    });

    // 1. Check Cache
    // coaching:${matchId}:${tier}:${COACHING_REPORT_VERSION}
    // We include tier because report content differs by tier (Premium vs Heuristic)
    const cacheKey = `coaching:${targetMatchId}:${tier}:${COACHING_REPORT_VERSION}`;
    
    interface CachedCoachingPayload {
      report: CoachingReport;
      isPremium: boolean;
      tier: string;
    }

    const cached = await getCache<CachedCoachingPayload>(cacheKey);

    if (cached) {
      logger.info(`[Coaching API] Cache HIT for ${cacheKey}`);
      // Cache hit: Return immediately, DO NOT decrement quota
      const response = NextResponse.json(
        {
          report: cached.report,
          isPremium: cached.isPremium,
          tier: cached.tier,
          cached: true,
          quota: {
            remaining: quota.remaining, // No decrement
            limit: quota.limit,
          },
        },
        { status: 200 }
      );
       // Rate limiting headers (still consume rate limit for API calls, but strictly speaking it's cached)
       // Keeping existing rate limit logic for protection
      response.headers.set("X-RateLimit-Limit", String(RATE_LIMITS.coaching.maxRequests));
      response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining - 1));
      response.headers.set("X-RateLimit-Reset", String(rateLimit.resetAt));
      return response;
    }

    logger.info(`[Coaching API] Cache MISS for ${cacheKey}`);

    const winProbData = computeWinProbability(matchData.timelineEvents);
    const report = await generateCoachingReport(
      matchData,
      winProbData,
      isPremium
    );
    
    // Log pour debug
    if (isPremium) {
      logger.debug("[Coaching API] Report premium généré", {
        hasRootCauses: !!report.rootCauses,
        hasActionPlan: !!report.actionPlan,
        hasDrills: !!report.drills,
      });
    }

    // 2. Decrement Quota logic
    // Decrement ONLY if OpenAI is actually called (approximated by isPremium intent)
    // If it's a heuristic report (isPremium=false), we don't decrement.
    const shouldDecrement = isPremium;

    if (shouldDecrement) {
        // TODO: Incrémenter le compteur de coaching dans la DB
        // await incrementCoachingCount(userId);
        logger.debug("[Coaching API] Quota decremented (Premium report)");
    } else {
        logger.debug("[Coaching API] Quota NOT decremented (Heuristic/Free report)");
    }

    // 3. Save to Cache
    // Pro: 7 days, Free: 24 hours
    const ttl = tier === "pro" ? 7 * 24 * 60 * 60 : 24 * 60 * 60;
    
    await setCache<CachedCoachingPayload>(
      cacheKey,
      {
        report,
        isPremium,
        tier,
      },
      { ttl }
    );

    const response = NextResponse.json(
      {
        report,
        isPremium,
        tier,
        quota: {
          remaining: shouldDecrement ? quota.remaining - 1 : quota.remaining,
          limit: quota.limit,
        },
      },
      { status: 200 }
    );
    
    // Headers rate limiting
    response.headers.set("X-RateLimit-Limit", String(RATE_LIMITS.coaching.maxRequests));
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining - 1));
    response.headers.set("X-RateLimit-Reset", String(rateLimit.resetAt));
    
    return response;
  } catch (error) {
    logger.error("COACHING ROUTE ERROR", error);
    return NextResponse.json(
      { error: "Failed to generate coaching report" },
      { status: 500 }
    );
  }
}

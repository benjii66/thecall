export const runtime = "nodejs";
// GET /api/matches - Liste des matchs avec pagination intelligente
import { NextResponse } from "next/server";
import { getAuthUserSafe } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getMatchesListController } from "@/lib/controllers/matchController";
import type { MatchListItem } from "@/types/matchList";
import { getSafeErrorMessage, validateGameType } from "@/lib/security";
import { isDemoModeActive } from "@/lib/settings";
import { checkRateLimit, getRateLimitIdentifier, RATE_LIMITS } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { addApiCacheHeaders } from "@/lib/cacheHeaders";

export async function GET(req: Request) {
  // Vérifier que la clé API est présente
  if (!process.env.RIOT_API_KEY) {
    logger.error("[MATCHES API] RIOT_API_KEY manquante");
    return NextResponse.json(
      { 
        matches: [] as MatchListItem[],
        error: getSafeErrorMessage(null, "Configuration serveur incomplète"),
      },
      { status: 500 }
    );
  }
  
  logger.info("[MATCHES API] ✅ RIOT_API_KEY présente", { 
    keyLength: process.env.RIOT_API_KEY.length,
    keyPrefix: process.env.RIOT_API_KEY.substring(0, 10) + "..."
  });

  // Rate limiting
  const identifier = getRateLimitIdentifier(req);
  const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.matches);
  
  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      { 
        error: "Rate limit exceeded",
        message: "Trop de requêtes. Réessaye dans quelques instants.",
        resetAt: new Date(rateLimit.resetAt).toISOString(),
      },
      { status: 429 }
    );
    response.headers.set("X-RateLimit-Limit", String(RATE_LIMITS.matches.maxRequests));
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
    response.headers.set("X-RateLimit-Reset", String(rateLimit.resetAt));
    response.headers.set("Retry-After", String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)));
    return response;
  }

  const isDemoMode = await isDemoModeActive();
  const { searchParams } = new URL(req.url);
  const typeParam = searchParams.get("type");
  const puuidParam = searchParams.get("puuid");

  // 1. Authenticate Session
  const userId = await getAuthUserSafe();
  if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // 2. Fetch User from DB to get the REAL PUUID
  const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { riotPuuid: true }
  });

  if (!user || !user.riotPuuid) {
      return NextResponse.json({ error: "Profil Riot non lié" }, { status: 404 });
  }

  // Allow external PUUID only in Demo Mode for Riot validation
  const validPuuid = (isDemoMode && puuidParam) ? puuidParam : user.riotPuuid;
  const validType = validateGameType(typeParam) ?? "all";

  try {
    logger.debug("[MATCHES API] Début fetch matches", { validPuuid: validPuuid.substring(0, 10) + "...", validType });
    
    // Use controller logic
    const { matches } = await getMatchesListController(validPuuid, validType);

    logger.debug(`[MATCHES API] Réponse finale`, { 
      matchesCount: matches.length,
      matches: matches.slice(0, 2).map(m => ({ id: m.id, champion: m.champion }))
    });

    let response = NextResponse.json({ matches }, { status: 200 }) as NextResponse<{ matches: MatchListItem[] }>;
    
    // Ajouter les headers de rate limiting
    response.headers.set("X-RateLimit-Limit", String(RATE_LIMITS.matches.maxRequests));
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining - 1));
    response.headers.set("X-RateLimit-Reset", String(rateLimit.resetAt));
    
    // Ajouter les headers de cache (2 minutes pour les listes de matchs)
    response = addApiCacheHeaders(response, 120) as NextResponse<{ matches: MatchListItem[] }>;
    
    return response;
  } catch (err) {
    // Log console (serveur uniquement)
    console.error("[MATCHES API] ❌ ERREUR:", err);
    logger.error("[MATCHES API] Error occurred", { error: err instanceof Error ? err.message : String(err) });
    
    const error = err as Error & { status?: number; isRiotError?: boolean };
    
    // Si c'est une erreur Riot API, on renvoie un message d'erreur clair mais sécurisé
    if (error.isRiotError) {
      const response = NextResponse.json(
        {
          matches: [] as MatchListItem[],
          error: getSafeErrorMessage(error, "Le service Riot Games est temporairement indisponible"),
          errorCode: error.status,
        },
        { status: 200 } 
      );
      response.headers.set("X-RateLimit-Limit", String(RATE_LIMITS.matches.maxRequests));
      response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
      response.headers.set("X-RateLimit-Reset", String(rateLimit.resetAt));
      return response;
    }
    
    const response = NextResponse.json(
      {
        matches: [] as MatchListItem[],
        error: getSafeErrorMessage(err, "Erreur lors de la récupération des matchs"),
      },
      { status: 200 }
    );
    response.headers.set("X-RateLimit-Limit", String(RATE_LIMITS.matches.maxRequests));
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
    response.headers.set("X-RateLimit-Reset", String(rateLimit.resetAt));
    return response;
  }
}

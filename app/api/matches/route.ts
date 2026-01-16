// GET /api/matches - Liste des matchs avec pagination intelligente
import { NextResponse } from "next/server";
import { getMatchesListController } from "@/lib/controllers/matchController";
import type { MatchListItem } from "@/types/matchList";
import { validatePuuid, validateGameType } from "@/lib/security";
import { checkRateLimit, getRateLimitIdentifier, RATE_LIMITS } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { addApiCacheHeaders } from "@/lib/cacheHeaders";

export async function GET(req: Request) {
  // Vérifier que la clé API est présente
  if (!process.env.RIOT_API_KEY) {
    console.error("[MATCHES API] ❌ RIOT_API_KEY manquante - Vérifie ton fichier .env.local");
    logger.error("[MATCHES API] RIOT_API_KEY manquante");
    return NextResponse.json(
      { 
        matches: [] as MatchListItem[],
        error: "Configuration serveur: RIOT_API_KEY manquante. Vérifie ton fichier .env.local",
      },
      { status: 500 }
    );
  }
  
  console.log("[MATCHES API] ✅ RIOT_API_KEY présente", { 
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

  const { searchParams } = new URL(req.url);
  const puuidParam = searchParams.get("puuid");
  const typeParam = searchParams.get("type");
  
  // Valider les inputs
  const validPuuid = puuidParam
    ? validatePuuid(puuidParam)
    : validatePuuid(process.env.MY_PUUID || "");
  
  const validType = validateGameType(typeParam) ?? "all";

  if (!validPuuid) {
    logger.error("[MATCHES API] PUUID invalide", undefined, { puuidParam, envPuuid: process.env.MY_PUUID });
    return NextResponse.json(
      { 
        matches: [] as MatchListItem[],
        error: "PUUID invalide ou manquant",
      },
      { status: 200 }
    );
  }

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
    // Log console
    console.error("[MATCHES API] ❌ ERREUR:", err);
    
    const error = err as Error & { status?: number; isRiotError?: boolean };
    
    // Si c'est une erreur Riot API, on renvoie un message d'erreur clair
    if (error.isRiotError) {
      const response = NextResponse.json(
        {
          matches: [] as MatchListItem[],
          error: error.message,
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
        error: error.message || "Erreur lors de la récupération des matchs",
      },
      { status: 200 }
    );
    response.headers.set("X-RateLimit-Limit", String(RATE_LIMITS.matches.maxRequests));
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
    response.headers.set("X-RateLimit-Reset", String(rateLimit.resetAt));
    return response;
  }
}

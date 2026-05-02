export const runtime = "nodejs";
// GET /api/match/[id] - Détails complets d'un match
import { NextRequest, NextResponse } from "next/server";
import { getAuthUserSafe } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getMatchDetailsController } from "@/lib/controllers/matchController";
import { isDemoModeActive } from "@/lib/settings";
import type { MatchPageData } from "@/types/match";
import { getSafeErrorMessage, validateMatchId } from "@/lib/security";
import { checkRateLimit, getRateLimitIdentifier, RATE_LIMITS } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { addApiCacheHeaders } from "@/lib/cacheHeaders";



export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const identifier = getRateLimitIdentifier(req);
  const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.match);
  
  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      { 
        error: "Rate limit exceeded",
        message: "Trop de requêtes. Réessaye dans quelques instants.",
        resetAt: new Date(rateLimit.resetAt).toISOString(),
      },
      { status: 429 }
    );
    response.headers.set("X-RateLimit-Limit", String(RATE_LIMITS.match.maxRequests));
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
    response.headers.set("X-RateLimit-Reset", String(rateLimit.resetAt));
    response.headers.set("Retry-After", String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)));
    return response;
  }
  const { id } = await params;

  // Valider le match ID
  const validMatchId = validateMatchId(id);
  if (!validMatchId) {
    return NextResponse.json(
      { error: "Invalid match ID format" },
      { status: 400 }
    );
  }

  const isDemoMode = await isDemoModeActive();
  const { searchParams } = new URL(req.url);
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


  try {
    // Use controller logic
    const data = await getMatchDetailsController(validMatchId, validPuuid);
    
    if (!data) {
      return NextResponse.json(
        { error: "Match not found or player missing" },
        { status: 404 }
      );
    }

    let response = NextResponse.json(data, { status: 200 }) as NextResponse<MatchPageData>;
    
    // Ajouter les headers de rate limiting
    response.headers.set("X-RateLimit-Limit", String(RATE_LIMITS.match.maxRequests));
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining - 1));
    response.headers.set("X-RateLimit-Reset", String(rateLimit.resetAt));
    
    // Ajouter les headers de cache (5 minutes pour les matchs)
    response = addApiCacheHeaders(response, 300) as NextResponse<MatchPageData>;
    
    return response;
  } catch (err) {
    logger.error("MATCH ROUTE ERROR", err, { matchId: validMatchId, puuid: validPuuid?.substring(0, 10) + "..." });
    
    const error = err as Error & { status?: number; isRiotError?: boolean };
    
    // Si c'est une erreur Riot API, on renvoie un message d'erreur clair mais sécurisé
    if (error.isRiotError) {
      return NextResponse.json(
        {
          error: getSafeErrorMessage(error, "Le service Riot Games est temporairement indisponible"),
          errorCode: error.status,
        },
        { status: error.status === 401 ? 401 : 500 }
      );
    }
    
    return NextResponse.json(
      { error: getSafeErrorMessage(err, "Échec de la récupération des données du match") },
      { status: 500 }
    );
  }
}

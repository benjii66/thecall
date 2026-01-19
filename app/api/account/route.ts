export const runtime = "nodejs";
import { riotFetch } from "@/lib/riot";
import { NextResponse } from "next/server";
import { validateGameName, validateTagLine, sanitizeForUrl } from "@/lib/security";
import { checkRateLimit, getRateLimitIdentifier, RATE_LIMITS } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

export async function GET(req: Request) {
  // Rate limiting
  const identifier = getRateLimitIdentifier(req);
  const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.account);
  
  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      { 
        error: "Rate limit exceeded",
        message: "Trop de requêtes. Réessaye dans quelques instants.",
        resetAt: new Date(rateLimit.resetAt).toISOString(),
      },
      { status: 429 }
    );
    response.headers.set("X-RateLimit-Limit", String(RATE_LIMITS.account.maxRequests));
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
    response.headers.set("X-RateLimit-Reset", String(rateLimit.resetAt));
    response.headers.set("Retry-After", String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)));
    return response;
  }
  const { searchParams } = new URL(req.url);
  const gameName = searchParams.get("gameName");
  const tagLine = searchParams.get("tagLine");

  // Valider et sanitiser les inputs
  const validGameName = validateGameName(gameName);
  const validTagLine = validateTagLine(tagLine);

  if (!validGameName || !validTagLine) {
    return NextResponse.json(
      { error: "Invalid gameName or tagLine format" },
      { status: 400 }
    );
  }

  // Sanitiser pour l'URL (double protection)
  const safeGameName = sanitizeForUrl(validGameName);
  const safeTagLine = sanitizeForUrl(validTagLine);

  try {
    const data = await riotFetch(
      `/riot/account/v1/accounts/by-riot-id/${safeGameName}/${safeTagLine}`
    );

    const response = NextResponse.json(data);
    
    // Ajouter les headers de rate limiting
    response.headers.set("X-RateLimit-Limit", String(RATE_LIMITS.account.maxRequests));
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining - 1));
    response.headers.set("X-RateLimit-Reset", String(rateLimit.resetAt));
    
    return response;
  } catch (error) {
    logger.error("Account API error", error);
    const response = NextResponse.json(
      { error: "Failed to fetch account data" },
      { status: 500 }
    );
    response.headers.set("X-RateLimit-Limit", String(RATE_LIMITS.account.maxRequests));
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
    response.headers.set("X-RateLimit-Reset", String(rateLimit.resetAt));
    return response;
  }
}

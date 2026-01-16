// API route pour récupérer le tier utilisateur
import { NextResponse } from "next/server";
import { getUserTier, getUserTierLimits } from "@/lib/tier";
import { checkRateLimit, getRateLimitIdentifier, RATE_LIMITS } from "@/lib/rateLimit";

export async function GET(req: Request) {
  // Rate limiting
  const identifier = getRateLimitIdentifier(req);
  const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.default);
  
  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      { 
        error: "Rate limit exceeded",
        message: "Trop de requêtes. Réessaye dans quelques instants.",
      },
      { status: 429 }
    );
    response.headers.set("X-RateLimit-Limit", String(RATE_LIMITS.default.maxRequests));
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
    response.headers.set("X-RateLimit-Reset", String(rateLimit.resetAt));
    return response;
  }
  // TODO: Récupérer userId depuis session/cookie
  const userId = undefined;

  // En mode dev, vérifier si un tier est stocké dans les headers (simulation)
  // Le client peut passer un header pour simuler un tier différent
  const devTier = req.headers.get("x-dev-tier") as "free" | "pro" | null;
  
  // Si on est en dev et qu'un tier est passé, l'utiliser temporairement
  // Sinon, utiliser la logique normale
  const tier = devTier && (devTier === "free" || devTier === "pro") 
    ? devTier 
    : getUserTier(userId);
  
  const limits = getUserTierLimits(userId);

  return NextResponse.json({
    tier,
    limits,
  });
}

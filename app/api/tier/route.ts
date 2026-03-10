export const runtime = "nodejs";
// API route pour récupérer le tier utilisateur (Force Refresh)
import { NextResponse } from "next/server";
import { getUserTierServer, getUserTierLimitsServer, getUserSubscriptionServer } from "@/lib/tier-server";
import { checkRateLimit, getRateLimitIdentifier, RATE_LIMITS } from "@/lib/rateLimit";
import { getAuthUserSafe } from "@/lib/session";

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
  
  // 1.5 Authenticate Session (Soft fallback allowed)
  const userId = await getAuthUserSafe();

  // En mode dev, vérifier si un tier est stocké dans les headers (simulation)
  const devTier = req.headers.get("x-dev-tier") as "free" | "pro" | null;
  
  // Si on est en dev et qu'un tier est passé, l'utiliser temporairement
  const tier = devTier && (devTier === "free" || devTier === "pro") 
    ? devTier 
    : await getUserTierServer(userId || undefined);
  
  const limits = await getUserTierLimitsServer(userId || undefined);
  const subscription = await getUserSubscriptionServer(userId || undefined);

  return NextResponse.json({
    tier,
    limits,
    subscription
  });
}

export const runtime = "nodejs";
// API route pour changer le tier en mode développement (local uniquement)
import { NextRequest, NextResponse } from "next/server";
import { getCsrfTokenFromRequest, isSameOriginRequest, requiresCsrfProtection, validateCsrfToken } from "@/lib/csrf";
import { checkRateLimit, getRateLimitIdentifier, RATE_LIMITS } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // Vérifier que nous sommes en mode développement
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Cette fonctionnalité n'est disponible qu'en mode développement" },
      { status: 403 }
    );
  }

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

  // CSRF Protection (sauf pour les appels depuis Server Components)
  if (requiresCsrfProtection("POST", "/api/tier/switch")) {
    // Permettre les appels depuis le même serveur (Server Components)
    const isSameOrigin = isSameOriginRequest(req);
    
    if (!isSameOrigin) {
      const csrfToken = getCsrfTokenFromRequest(req);
      const sessionToken = req.cookies.get("csrf-token")?.value;
      
      if (process.env.NODE_ENV !== "development" && sessionToken) {
        if (!csrfToken || !validateCsrfToken(csrfToken, sessionToken)) {
          return NextResponse.json(
            { error: "Invalid CSRF token" },
            { status: 403 }
          );
        }
      }
    }
  }

  try {
    const body = await req.json();
    const { tier } = body;

    if (tier !== "free" && tier !== "pro") {
      return NextResponse.json(
        { error: "Tier invalide. Utilise 'free' ou 'pro'" },
        { status: 400 }
      );
    }

    // En mode dev, on stocke dans une variable d'environnement côté client
    // Le client utilisera localStorage pour persister
    return NextResponse.json({
      success: true,
      tier,
      message: `Tier changé en ${tier}. Recharge la page pour voir les changements.`,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors du changement de tier" },
      { status: 500 }
    );
  }
}

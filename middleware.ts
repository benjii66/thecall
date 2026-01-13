// Middleware Next.js pour vérifier le tier et gérer les restrictions
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getUserTier, hasFeatureAccess } from "@/lib/tier";
import type { TierLimits } from "@/types/pricing";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Routes protégées par tier
  const protectedRoutes = {
    "/profile": "profileGlobal", // Nécessite au moins mini-profil
    "/api/coaching": "coachingPerMonth", // Nécessite quota coaching
  };

  // Vérifier si la route est protégée
  for (const [route, feature] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route)) {
      // TODO: Récupérer userId depuis session/cookie
      // Pour l'instant, on utilise un placeholder
      const userId = request.cookies.get("userId")?.value;

      // Vérifier l'accès
      if (!hasFeatureAccess(userId, feature as keyof TierLimits)) {
        // Rediriger vers pricing ou retourner 403
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { error: "Quota coaching épuisé. Upgrade Pro pour coaching illimité." },
            { status: 403 }
          );
        }

        // Pour les pages, rediriger vers pricing
        const pricingUrl = new URL("/pricing", request.url);
        pricingUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(pricingUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/api/coaching/:path*",
  ],
};

// Helper pour vérifier le tier utilisateur (CLIENT-SIDE SAFE)
import { TIER_LIMITS, type SubscriptionTier, type TierLimits } from "@/types/pricing";



/**
 * Récupère le tier de l'utilisateur
 * Côté Client : utilise NEXT_PUBLIC_DEV_TIER ou localStorage
 * Côté Serveur (Edge/Node) : utilise process.env.DEV_TIER
 */
export function getUserTier(_userId?: string): SubscriptionTier {
  // 1. Env Var Check (Server & Client)
  // Logic duplicated from tierClient.ts for consistency
  if (typeof window !== "undefined") {
      const envTier = process.env.NEXT_PUBLIC_DEV_TIER as SubscriptionTier | undefined;
      if (envTier === "free" || envTier === "pro") {
          return envTier;
      }
  }

  // Server side check
  if (typeof window === "undefined") {
    const devTier = process.env.DEV_TIER as SubscriptionTier | undefined;
    if (devTier === "free" || devTier === "pro") {
      return devTier;
    }
  }
  
  // 2. Client-side localStorage for Dev simulation
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("dev_tier");
      // console.log("[Tier] Checking localStorage:", stored);
      if (stored === "free" || stored === "pro") {
        return stored;
      }
    } catch {
      // Ignore
    }
  }

  // Default to free if no override found
  return "free";
}

/**
 * Récupère les limites du tier utilisateur
 */
export function getUserTierLimits(userId?: string): TierLimits {
  const tier = getUserTier(userId);
  return TIER_LIMITS[tier];
}

/**
 * Vérifie si l'utilisateur a accès à une feature
 */
export function hasFeatureAccess(
  userId: string | undefined,
  feature: keyof TierLimits
): boolean {
  const limits = getUserTierLimits(userId);
  const value = limits[feature];

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === -1 || value > 0;
  }

  if (typeof value === "string") {
    return true;
  }
  return false;
}

/**
 * Vérifie si l'utilisateur peut faire un coaching (Client-side estimation only)
 * Pour la vraie vérification, utiliser l'API /api/tier ou /api/coaching
 */
export async function canDoCoaching(userId?: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
}> {
  const limits = getUserTierLimits(userId);
  const limit = limits.coachingPerMonth;

  if (limit === -1) {
    return { allowed: true, remaining: -1, limit: -1 };
  }

  let count = 0;

  // Only check localStorage on client
  if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("coaching_count");
        if (stored) {
          const parsed = JSON.parse(stored);
          const now = new Date();
          const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
          if (parsed.month === monthKey) {
            count = parsed.count || 0;
          }
        }
      } catch {
        // Ignore
      }
  }

  const remaining = limit - count;
  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    limit,
  };
}

// NOTE: incrementCoachingUsage removed from here as it requires Prisma.
// It is now in lib/tier-server.ts

/**
 * Vérifie si l'utilisateur a accès au profil global complet
 */
export function hasFullProfileAccess(userId?: string): boolean {
  const limits = getUserTierLimits(userId);
  return limits.profileGlobal === "full";
}

/**
 * Vérifie si l'utilisateur a accès au mini-profil
 */
export function hasMiniProfileAccess(userId?: string): boolean {
  const limits = getUserTierLimits(userId);
  return limits.profileGlobal === "mini" || limits.profileGlobal === "full";
}

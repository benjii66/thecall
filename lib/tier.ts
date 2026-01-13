// Helper pour vérifier le tier utilisateur
import { TIER_LIMITS, type SubscriptionTier, type TierLimits } from "@/types/pricing";

// Mode de développement : permet de forcer un tier via variable d'environnement
// Côté serveur : process.env.DEV_TIER
// Côté client : NEXT_PUBLIC_DEV_TIER (pour le dev uniquement)
// Note: Dans Edge Runtime (middleware), window n'existe pas, donc on utilise toujours process.env.DEV_TIER
const DEV_TIER = 
  (typeof globalThis !== "undefined" && "window" in globalThis && typeof globalThis.window !== "undefined")
    ? (process.env.NEXT_PUBLIC_DEV_TIER as SubscriptionTier | undefined)
    : (process.env.DEV_TIER as SubscriptionTier | undefined);

/**
 * Récupère le tier de l'utilisateur
 * En dev : utilise DEV_TIER si défini, sinon vérifie localStorage (côté client), sinon "free"
 * En prod : récupère depuis la session/DB (à implémenter avec auth)
 */
export function getUserTier(userId?: string): SubscriptionTier {
  // Mode développement : utiliser DEV_TIER si défini (priorité absolue)
  // On vérifie d'abord process.env.DEV_TIER directement (côté serveur)
  // puis la constante DEV_TIER (qui gère client/serveur)
  const envDevTier = process.env.DEV_TIER as SubscriptionTier | undefined;
  if (envDevTier === "free" || envDevTier === "pro") {
    return envDevTier;
  }
  
  if (DEV_TIER === "free" || DEV_TIER === "pro") {
    return DEV_TIER;
  }

  // Côté client, vérifier localStorage (pour le mode dev)
  // Note: Dans Edge Runtime (middleware), on ne peut pas accéder à localStorage
  if (typeof globalThis !== "undefined" && "window" in globalThis && typeof globalThis.window !== "undefined") {
    try {
      const stored = localStorage.getItem("dev_tier");
      if (stored === "free" || stored === "pro") {
        return stored;
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  // TODO: En production, récupérer depuis la DB/session
  // Pour l'instant, on retourne "free" par défaut
  if (!userId) {
    return "free";
  }

  // TODO: Vérifier dans la DB si l'utilisateur a un abonnement actif
  // const subscription = await getSubscription(userId);
  // return subscription?.tier ?? "free";

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
    return value === -1 || value > 0; // -1 = illimité
  }

  if (typeof value === "string") {
    // Les strings dans TierLimits sont toujours des valeurs valides ("mini" | "full" | "basic" | "premium")
    return true;
  }

  return false;
}

/**
 * Vérifie si l'utilisateur peut faire un coaching (vérifie le quota)
 */
export async function canDoCoaching(userId?: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
}> {
  const limits = getUserTierLimits(userId);
  const limit = limits.coachingPerMonth;

  // Pro : illimité
  if (limit === -1) {
    return { allowed: true, remaining: -1, limit: -1 };
  }

  // TODO: Récupérer le nombre de coachings ce mois depuis la DB
  // const count = await getCoachingCountThisMonth(userId);
  // Pour l'instant, on simule avec 0 (ou depuis localStorage en client)
  let count = 0;
  
  // En client-side, on peut utiliser localStorage pour simuler
  // Note: Dans Edge Runtime (middleware), on ne peut pas accéder à localStorage
  if (typeof globalThis !== "undefined" && "window" in globalThis && typeof globalThis.window !== "undefined") {
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
      // Ignore localStorage errors
    }
  }

  const remaining = limit - count;
  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    limit,
  };
}

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

import { prisma } from "@/lib/prisma";
import { TIER_LIMITS, type SubscriptionTier, type TierLimits } from "@/types/pricing";

const DEV_TIER = process.env.DEV_TIER as SubscriptionTier | undefined;

/**
 * Récupère le tier de l'utilisateur (Côté Serveur uniquement)
 * Vérifie la DB pour confirmer le statut "pro"
 */
export async function getUserTierServer(userId?: string): Promise<SubscriptionTier> {
  // 1. Force Dev Tier (Server env overrides everything in dev)
  if (DEV_TIER === "free" || DEV_TIER === "pro") {
    return DEV_TIER;
  }

  // 2. Production / DB Check
  if (!userId) {
    return "free";
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true, subscription: true }
    });

    // On vérifie le champ tier de l'utilisateur
    // Il est synchronisé par Stripe Webhook ET modifiable par l'Admin.
    if (user?.tier === "pro") {
      return "pro";
    }

    console.log(`[TIER_SERVER] User ${userId} tier field is ${user?.tier}. Returning free.`);
  } catch (e) {
    console.error("Failed to fetch user tier from DB", e);
  }

  return "free"; 
}

export async function getUserTierLimitsServer(userId?: string): Promise<TierLimits> {
  const tier = await getUserTierServer(userId);
  return TIER_LIMITS[tier];
}

/**
 * Vérifie si l'utilisateur peut faire un coaching (Quota DB Check)
 */
export async function canDoCoachingServer(userId?: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
}> {
  const limits = await getUserTierLimitsServer(userId);
  const limit = limits.coachingPerMonth;

  // Pro unlimited
  if (limit === -1) {
    return { allowed: true, remaining: -1, limit: -1 };
  }

  let count = 0;

  if (userId) {
    try {
        const usage = await prisma.usage.findUnique({ where: { userId } });
        if (usage) {
            count = usage.monthlyCount;
        }
    } catch (e) {
        console.error("Failed to fetch usage (server)", e);
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
 * Incrémente le compteur de coaching (DB Write)
 */
export async function incrementCoachingUsage(userId: string): Promise<void> {
    try {
        await prisma.usage.upsert({
            where: { userId },
            update: {
                coachingCount: { increment: 1 },
                monthlyCount: { increment: 1 },
                lastCoachingAt: new Date()
            },
            create: {
                userId,
                coachingCount: 1,
                monthlyCount: 1,
                lastCoachingAt: new Date()
            }
        });
    } catch (e) {
        console.error("Failed to increment usage", e);
    }
}

import type { RateLimitConfig, RateLimitResult } from "./rateLimit";
import { logger } from "./logger";

import { getRedisClient } from "@/lib/redis";

// Utiliser le client centralisé
function initRedis() {
  return getRedisClient();
}

/**
 * Vérifie le rate limit avec Redis
 * Utilise une stratégie de sliding window avec TTL automatique
 */
export async function checkRateLimitRedis(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult | null> {
  const redisClient = initRedis();
  if (!redisClient) {
    // Redis non disponible, retourner null pour utiliser le fallback
    return null;
  }

  try {
    const now = Date.now();
    const windowKey = `ratelimit:${key}`;

    // Utiliser INCR pour incrémenter le compteur atomiquement
    // Si la clé n'existe pas, elle est créée avec la valeur 1
    const count = await redisClient.incr(windowKey);

    // Si c'est la première requête (count === 1), définir le TTL
    if (count === 1) {
      await redisClient.expire(windowKey, Math.ceil(config.windowMs / 1000));
    }

    // Vérifier si la limite est atteinte
    if (count > config.maxRequests) {
      // Récupérer le TTL restant pour connaître le resetAt exact
      const ttl = await redisClient.ttl(windowKey);
      const actualResetAt = now + (ttl * 1000);

      return {
        allowed: false,
        remaining: 0,
        resetAt: actualResetAt,
      };
    }

    // Récupérer le TTL restant
    const ttl = await redisClient.ttl(windowKey);
    const actualResetAt = now + (ttl * 1000);

    return {
      allowed: true,
      remaining: config.maxRequests - count,
      resetAt: actualResetAt,
    };
  } catch (error) {
    logger.error("[RATE_LIMIT] Erreur Redis, fallback sur mémoire", { error, key });
    // En cas d'erreur Redis, retourner null pour utiliser le fallback
    return null;
  }
}

/**
 * Vérifie si Redis est disponible
 */
export function isRedisAvailable(): boolean {
  return initRedis() !== null;
}

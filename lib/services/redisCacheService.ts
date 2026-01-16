import { getRedisClient } from "@/lib/redis";
import { logger } from "@/lib/logger";

interface CacheOptions {
  ttl?: number; // Seconds
}

/**
 * redisResult:
 * - null: Cache miss or Redis unavailable
 * - T: Cache hit
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const data = await client.get<T>(key);
    return data;
  } catch (error) {
    logger.warn(`[REDIS] Get error for key ${key}`, { error });
    return null;
  }
}

export async function setCache<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    if (options?.ttl) {
      await client.set(key, value, { ex: options.ttl });
    } else {
      await client.set(key, value);
    }
  } catch (error) {
    logger.warn(`[REDIS] Set error for key ${key}`, { error });
  }
}

/**
 * Cache-First Strategy wrapper
 * 1. Check Redis
 * 2. If hit, return
 * 3. If miss, execute fetcher()
 * 4. Store result in Redis
 * 5. Return result
 */
export async function withRedisCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  // 1. Try Redis
  const cached = await getCache<T>(key);
  if (cached !== null && cached !== undefined) {
    // logger.debug(`[REDIS] HIT ${key}`);
    return cached;
  }

  // logger.debug(`[REDIS] MISS ${key}`);

  // 2. Fetch fresh
  const fresh = await fetcher();

  // 3. Set Cache (non-blocking for response, but await here to ensure it's fired)
  if (fresh !== null && fresh !== undefined) {
      // Don't await strictly if performance matters, but here we want reliability
      await setCache(key, fresh, { ttl: ttlSeconds });
  }

  return fresh;
}

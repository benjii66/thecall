// lib/redis.ts
import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";

let redisInstance: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (redisInstance) return redisInstance;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // Only log once to avoid spamming
    if (!global._redisLoggedMissing) {
      logger.warn("[REDIS] Missing credentials (UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN). Redis disabled.");
      global._redisLoggedMissing = true;
    }
    return null;
  }

  try {
    redisInstance = new Redis({
      url,
      token,
    });
    return redisInstance;
  } catch (error) {
    logger.error("[REDIS] Failed to initialize client", error);
    return null;
  }
}

// Global declaration to prevent logging spam in dev HMR
declare global {
  var _redisLoggedMissing: boolean | undefined;
}

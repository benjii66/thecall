import { getRedisClient } from "./redis";
import { logger } from "./logger";

const AGG_CACHE_TTL = 30 * 60; // 30 minutes
const AGG_CACHE_PREFIX = "profile:agg";
const VERSION = "v1";

export async function getProfileAggregate(puuid: string): Promise<any | null> {
  const redis = await getRedisClient();
  if (!redis) return null;

  const key = `${AGG_CACHE_PREFIX}:${puuid}:${VERSION}`;
  
  try {
    const data = await redis.get(key);
    if (data) {
      return JSON.parse(data as string);
    }
  } catch (error) {
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger.error("[ProfileAggCache] Get failed", { error: error as any, key });
  }
  return null;
}

export async function setProfileAggregate(puuid: string, data: any): Promise<void> {
  const redis = await getRedisClient();
  if (!redis) return;

  const key = `${AGG_CACHE_PREFIX}:${puuid}:${VERSION}`;

  try {
    await redis.set(key, JSON.stringify(data), {
      ex: AGG_CACHE_TTL
    });
  } catch (error) {
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger.error("[ProfileAggCache] Set failed", { error: error as any, key });
  }
}

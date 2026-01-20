import { getRedisClient } from "@/lib/redis";
import { logger } from "@/lib/logger";

const CACHE_TTL_SECONDS = 30 * 60; // 30 minutes
const PROFILE_VERSION = "fv1"; // Bump this to invalidate all profile caches

/**
 * Generates the Redis key for a cached profile.
 */
function getProfileKey(puuid: string): string {
  return `profile:${puuid}:${PROFILE_VERSION}:20`;
}

/**
 * Retrieves the cached profile from Redis.
 * Handles Redis failures gracefully (returns null).
 */
export async function getProfileCache(puuid: string): Promise<any | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const key = getProfileKey(puuid);
    const data = await redis.get(key);
    return data;
  } catch (error) {
    logger.error("[Redis] Failed to get profile cache", error);
    return null;
  }
}

/**
 * Sets the profile cache in Redis with a TTL.
 * Handles Redis failures gracefully.
 */
export async function setProfileCache(puuid: string, data: any): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const key = getProfileKey(puuid);
    // ex: expiration in seconds
    await redis.set(key, data, { ex: CACHE_TTL_SECONDS });
  } catch (error) {
    logger.error("[Redis] Failed to set profile cache", error);
  }
}

const SYNC_LOCK_TTL_MS = 180000; // 180s (3m)
const SYNC_STATUS_TTL_SECONDS = 600; // 10m

export type SyncStatusState = "idle" | "running" | "ok" | "error";

export interface SyncStatus {
    state: SyncStatusState;
    updatedAt: number;
    startedAt?: number;
    reason?: string;
}

/**
 * Tries to acquire a distributed lock for syncing.
 * Atomic SET NX PX.
 * Returns true if acquired, false if already locked.
 */
export async function acquireSyncLock(puuid: string): Promise<boolean> {
  const redis = await getRedisClient();
  if (!redis) return true; // Fail open if Redis down

  const key = `lock:sync:${puuid}`;
  try {
    const res = await redis.set(key, "locked", {
        px: SYNC_LOCK_TTL_MS,
        nx: true
    });
    return res === "OK";
  } catch (error) {
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger.warn("[ProfileCache] Lock acquire failed", error as any);
    return true; 
  }
}

export async function releaseSyncLock(puuid: string): Promise<void> {
    const redis = await getRedisClient();
    if (!redis) return;
    try {
        await redis.del(`lock:sync:${puuid}`);
    } catch(e) {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
        logger.error("[ProfileCache] Lock release failed", e as any);
    }
}

export async function getSyncStatus(puuid: string): Promise<SyncStatus | null> {
    const redis = await getRedisClient();
    if (!redis) return null;
    try {
        const data = await redis.get(`sync:status:${puuid}`);
        if (data) return JSON.parse(data as string);
    } catch (e) {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
        logger.error("[ProfileCache] getSyncStatus failed", e as any);
    }
    return null;
}

export async function setSyncStatus(puuid: string, status: SyncStatus): Promise<void> {
    const redis = await getRedisClient();
    if (!redis) return;
    try {
        await redis.set(`sync:status:${puuid}`, JSON.stringify(status), {
            ex: SYNC_STATUS_TTL_SECONDS
        });
    } catch (e) {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
        logger.error("[ProfileCache] setSyncStatus failed", e as any);
    }
}

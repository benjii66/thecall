import { getRedisClient } from "./redis";
import { createHash } from "node:crypto";
import { logger } from "./logger";

const AI_CACHE_TTL = 24 * 60 * 60; // 24 hours
const AI_CACHE_PREFIX = "profile_ai";
const VERSION = "v1";

/**
 * Deterministically hashes the features object.
 * Sorts keys recursively to ensure stability.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function hashFeatures(features: any): string {
  const stableString = JSON.stringify(features, (_key, value) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return Object.keys(value)
        .sort()
        .reduce((sorted: any, k) => {
          sorted[k] = value[k];
          return sorted;
        }, {});
    }
    return value;
  });

  return createHash("sha256").update(stableString).digest("hex");
}

export async function getCachedAiProfile(puuid: string, featuresHash: string): Promise<any | null> {
  const redis = await getRedisClient();
  if (!redis) return null;

  const key = `${AI_CACHE_PREFIX}:${puuid}:${featuresHash}:${VERSION}`;
  
  try {
    const data = await redis.get(key);
    if (data) {
      return JSON.parse(data as string);
    }
  } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger.error("[AiCache] Get failed", { error: error as any, key });
  }
  return null;
}

export async function setCachedAiProfile(puuid: string, featuresHash: string, data: any): Promise<void> {
  const redis = await getRedisClient();
  if (!redis) return;

  const key = `${AI_CACHE_PREFIX}:${puuid}:${featuresHash}:${VERSION}`;

  try {
    await redis.set(key, JSON.stringify(data), {
      ex: AI_CACHE_TTL
    });
  } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger.error("[AiCache] Set failed", { error: error as any, key });
  }
}

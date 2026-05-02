import { prisma } from "./prisma";
import { getRedisClient } from "./redis";

const SETTINGS_CACHE_PREFIX = "config:";
const CACHE_TTL = 300; // 5 minutes

/**
 * Hybrid configuration utility.
 * Looks up a value in Redis first, then SystemSetting table, 
 * then falls back to process.env.
 */
export async function getSystemSetting(key: string): Promise<string | undefined> {
  const redis = getRedisClient();
  const cacheKey = `${SETTINGS_CACHE_PREFIX}${key}`;

  try {
    // 1. Try Redis
    if (redis) {
      const cached = await redis.get<string>(cacheKey);
      if (cached !== null) return cached;
    }
  } catch (e) {
    console.warn(`[Settings] Redis error for key ${key}`);
  }

  try {
    // 2. Try DB override
    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    });
    
    if (setting?.value) {
      // Update Redis cache
      if (redis) {
        await redis.set(cacheKey, setting.value, { ex: CACHE_TTL });
      }
      return setting.value;
    }
  } catch (error) {
    console.warn(`[Settings] Failed to fetch key ${key} from database, falling back to env.`);
  }

  // 3. Fallback to process.env
  return process.env[key];
}

/**
 * Updates a system setting in DB and clears/updates Redis.
 */
export async function setSystemSetting(key: string, value: string): Promise<void> {
  const redis = getRedisClient();
  const cacheKey = `${SETTINGS_CACHE_PREFIX}${key}`;

  await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });

  if (redis) {
    await redis.set(cacheKey, value, { ex: CACHE_TTL });
  }
}

/**
 * Checks if demo mode is active (Dynamic > Env)
 */
export async function isDemoModeActive(): Promise<boolean> {
  const value = await getSystemSetting("NEXT_PUBLIC_DEMO_MODE");
  // Supports "true", "1", "on" as true values
  return value === "true" || value === "1" || value === "on";
}

/**
 * Specifically for the Riot API Key which can be updated daily via DB.
 */
export async function getRiotApiKey(): Promise<string | undefined> {
  return await getSystemSetting("RIOT_API_KEY");
}

/**
 * Specifically for the OpenAI API Key which must ONLY come from env for security.
 */
export async function getOpenAIApiKey(): Promise<string | undefined> {
  return process.env.OPENAI_API_KEY;
}

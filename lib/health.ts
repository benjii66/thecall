import { prisma } from "./prisma";
import { getRedisClient } from "./redis";
import { getRiotApiKey, getOpenAIApiKey } from "./settings";

export interface SystemHealth {
  database: number; // 0-100
  openai: number;   // 0-100
  riot: number;     // 0-100
  redis: number;    // 0-100
  overall: boolean;
}

export async function checkSystemHealth(): Promise<SystemHealth> {
  const results = await Promise.all([
    checkDatabase(),
    checkOpenAI(),
    checkRiot(),
    checkRedis()
  ]);

  const [database, openai, riot, redis] = results;
  const overall = results.every(v => v >= 80); // Consider operational if all > 80%

  return {
    database,
    openai,
    riot,
    redis,
    overall
  };
}

async function checkDatabase(): Promise<number> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return 100;
  } catch (e) {
    return 0;
  }
}

async function checkOpenAI(): Promise<number> {
  const key = await getOpenAIApiKey();
  if (!key) return 0;
  
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { "Authorization": `Bearer ${key}` }
    });
    return res.ok ? 100 : 0;
  } catch (e) {
    return 0;
  }
}

async function checkRiot(): Promise<number> {
  const key = await getRiotApiKey();
  if (!key) return 0;

  try {
    // Check developer status or just a lightweight endpoint (e.g. shard-data)
    // We use /lol/status/v4/platform-data as it's lightweight and doesn't require player names
    const res = await fetch("https://euw1.api.riotgames.com/lol/status/v4/platform-data", {
      headers: { "X-Riot-Token": key }
    });
    return res.ok ? 100 : 0;
  } catch (e) {
    return 0;
  }
}

async function checkRedis(): Promise<number> {
  const client = getRedisClient();
  if (!client) return 0;

  try {
    // Upstash usually responds to pings or simpler operations
    const pong = await client.ping();
    return pong === "PONG" ? 100 : 50;
  } catch (e) {
    return 0;
  }
}

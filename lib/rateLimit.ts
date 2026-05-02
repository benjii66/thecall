// lib/rateLimit.ts - Rate limiting avec fallback automatique Redis → Mémoire
import { logger } from "./logger";
import { checkRateLimitRedis } from "./rateLimitRedis";

type RateLimitStore = Map<string, { count: number; resetAt: number }>;

// Store en mémoire (fallback si Redis n'est pas disponible)
const store: RateLimitStore = new Map();

// Nettoyer les entrées expirées toutes les 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.resetAt < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export type RateLimitConfig = {
  windowMs: number; // Fenêtre de temps en ms
  maxRequests: number; // Nombre max de requêtes
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

/**
 * Vérifie le rate limit pour une clé (IP, userId, etc.)
 * Utilise Redis si disponible, sinon fallback sur la mémoire
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // Essayer Redis d'abord
  const redisResult = await checkRateLimitRedis(key, config);
  
  if (redisResult !== null) {
    if (!redisResult.allowed) {
      logger.warn("[RateLimit] Limit exceeded (Redis)", { 
        key: key.includes("user:") ? "user:***" : key.substring(0, 15) + "...", 
        max: config.maxRequests 
      });
    }
    return redisResult;
  }

  // Fallback sur la mémoire
  const memoryResult = checkRateLimitMemory(key, config);
  if (!memoryResult.allowed) {
    logger.warn("[RateLimit] Limit exceeded (Memory)", { 
      key: key.includes("user:") ? "user:***" : key.substring(0, 15) + "...", 
      max: config.maxRequests 
    });
  }
  return memoryResult;
}

/**
 * Vérifie le rate limit en mémoire (fallback)
 */
function checkRateLimitMemory(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  // Si pas d'entrée ou fenêtre expirée, créer une nouvelle entrée
  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }

  // Si limite atteinte, refuser
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Incrémenter le compteur
  entry.count++;
  store.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Obtient l'IP du client depuis la requête
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0].trim();
    if (ip && ip !== "unknown") return ip;
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP && realIP !== "unknown") return realIP;

  if (process.env.NODE_ENV === "development") {
    return `dev-${Date.now()}`;
  }

  return "unknown";
}

/**
 * Configuration par défaut pour les routes API
 */
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: process.env.NODE_ENV === "development" ? 1000 : 100,
};

/**
 * Configuration stricte pour les routes sensibles
 */
export const STRICT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: process.env.NODE_ENV === "development" ? 100 : 10,
};

/**
 * Extrait le userId depuis la requête (session/cookie)
 */
function getUserIdFromRequest(request: Request): string | null {
  const cookies = request.headers.get("cookie");
  if (!cookies) return null;

  const sessionMatch = cookies.match(/(?:^|;\s*)session=([^;]+)/i);
  if (!sessionMatch?.[1]) return null;

  const sessionValue = decodeURIComponent(sessionMatch[1]);
  const [userId] = sessionValue.split(".");
  return userId || null;
}

/**
 * Obtient un identifiant unique pour le rate limiting
 */
export function getRateLimitIdentifier(request: Request): string {
  const userId = getUserIdFromRequest(request);
  if (userId) return `user:${userId}`;

  // Fallback session token
  const cookies = request.headers.get("cookie");
  const sessionMatch = cookies?.match(/(?:^|;\s*)(?:session-id|session-token|sid)=([^;]+)/i);
  if (sessionMatch?.[1]) {
    return `session:${hashToken(sessionMatch[1])}`;
  }

  const clientIP = getClientIP(request);
  return `ip:${clientIP}`;
}

/**
 * Hash un token pour éviter d'exposer des données sensibles
 */
function hashToken(token: string): string {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Configurations de rate limiting par type de route
 */
export const RATE_LIMITS = {
  default: DEFAULT_RATE_LIMIT,
  match: DEFAULT_RATE_LIMIT,
  matches: DEFAULT_RATE_LIMIT,
  account: DEFAULT_RATE_LIMIT,
  coaching: STRICT_RATE_LIMIT,
} as const;

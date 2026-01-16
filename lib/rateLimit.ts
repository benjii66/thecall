// lib/rateLimit.ts - Rate limiting avec fallback automatique Redis → Mémoire
// En production, utiliser Redis (Upstash) pour un rate limiting distribué
// En développement ou si Redis n'est pas configuré, utilise la mémoire

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
    return redisResult;
  }

  // Fallback sur la mémoire
  return checkRateLimitMemory(key, config);
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
  // Vérifier les headers proxy (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // Prendre la première IP (celle du client réel)
    const ip = forwarded.split(",")[0].trim();
    if (ip && ip !== "unknown") {
      return ip;
    }
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP && realIP !== "unknown") {
    return realIP;
  }

  // En développement local, générer un identifiant unique par requête
  // pour éviter que toutes les requêtes partagent le même quota
  // En production, cela ne devrait jamais arriver (toujours un proxy avec x-forwarded-for)
  if (process.env.NODE_ENV === "development") {
    // Utiliser un timestamp + random pour créer un identifiant unique par session
    // Cela permet de tester sans être bloqué par le rate limiting
    return `dev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // Fallback (ne devrait jamais arriver en production)
  return "unknown";
}

/**
 * Configuration par défaut pour les routes API
 * En développement, on augmente les limites pour éviter les blocages
 */
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: process.env.NODE_ENV === "development" ? 1000 : 100, // Plus permissif en dev
};

/**
 * Configuration stricte pour les routes sensibles (coaching, etc.)
 * En développement, on augmente les limites pour éviter les blocages
 */
export const STRICT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: process.env.NODE_ENV === "development" ? 100 : 10, // Plus permissif en dev
};

/**
 * Obtient un identifiant unique pour le rate limiting depuis une requête
 * 
 * Stratégie multi-niveaux pour supporter plusieurs utilisateurs :
 * 1. Si userId disponible (session/cookie) → `user:${userId}` (priorité)
 * 2. Si session token disponible → `session:${tokenHash}` (distinction par session)
 * 3. Sinon → `ip:${clientIP}` (fallback par IP)
 * 
 * Cela permet de :
 * - Distinguer les utilisateurs même sans auth complète
 * - Éviter que plusieurs utilisateurs partageant la même IP se bloquent mutuellement
 * - Préparer la migration vers un système basé sur userId
 */
export function getRateLimitIdentifier(request: Request): string {
  // 1. Priorité : userId depuis session/cookie (quand auth sera implémentée)
  const userId = getUserIdFromRequest(request);
  if (userId) {
    return `user:${userId}`;
  }

  // 2. Session token (cookie ou header) pour distinguer les sessions
  // Même sans auth complète, on peut utiliser un token de session unique
  const sessionToken = getSessionTokenFromRequest(request);
  if (sessionToken) {
    // Hash le token pour éviter d'exposer des données sensibles dans les logs
    const tokenHash = hashToken(sessionToken);
    return `session:${tokenHash}`;
  }

  // 3. Fallback : IP uniquement (limitation : plusieurs utilisateurs = même quota)
  const clientIP = getClientIP(request);
  return `ip:${clientIP}`;
}

/**
 * Extrait le userId depuis la requête (session/cookie)
 * TODO: Implémenter quand l'authentification sera disponible
 */
function getUserIdFromRequest(_request: Request): string | null {
  void _request;
  // Exemple d'implémentation future :
  // const cookies = request.headers.get("cookie");
  // const sessionId = extractSessionId(cookies);
  // const userId = await getUserIdFromSession(sessionId);
  // return userId;
  return null;
}

/**
 * Extrait un token de session depuis la requête
 * Peut être un cookie de session ou un header personnalisé
 * 
 * ⚠️ IMPORTANT : Les cookies de session ne sont utilisés que si l'utilisateur
 * a consenti aux cookies fonctionnels (conformité RGPD).
 * Le consentement est vérifié côté client et stocké dans localStorage.
 * En production, il faudrait vérifier le consentement côté serveur également.
 */
function getSessionTokenFromRequest(request: Request): string | null {
  // Chercher dans les cookies
  const cookies = request.headers.get("cookie");
  if (cookies) {
    // Chercher un cookie de session (ex: session-id, session-token, etc.)
    const sessionMatch = cookies.match(/(?:^|;\s*)(?:session-id|session-token|sid)=([^;]+)/i);
    if (sessionMatch?.[1]) {
      // TODO: Vérifier le consentement aux cookies fonctionnels côté serveur
      // Pour l'instant, on fait confiance au client (localStorage)
      // En production, utiliser un cookie sécurisé pour stocker le consentement
      return sessionMatch[1];
    }
  }

  // Chercher dans les headers personnalisés
  const sessionHeader = request.headers.get("x-session-id") || request.headers.get("x-session-token");
  if (sessionHeader) {
    return sessionHeader;
  }

  return null;
}

/**
 * Hash un token pour éviter d'exposer des données sensibles
 * Utilise un hash simple (pas de crypto lourd nécessaire ici)
 */
function hashToken(token: string): string {
  // Hash simple pour créer un identifiant unique mais non réversible
  // En production, on pourrait utiliser crypto.createHash('sha256')
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
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

// lib/cacheHeaders.ts - Headers de cache HTTP pour optimiser les performances

import { NextResponse } from "next/server";

/**
 * Ajoute des headers de cache appropriés selon le type de ressource
 */
export function addCacheHeaders(
  response: NextResponse,
  options: {
    maxAge?: number; // en secondes
    staleWhileRevalidate?: number; // en secondes
    public?: boolean;
    immutable?: boolean;
  } = {}
): NextResponse {
  const {
    maxAge = 3600, // 1h par défaut
    staleWhileRevalidate = 86400, // 24h par défaut
    public: isPublic = true,
    immutable = false,
  } = options;

  const cacheControl: string[] = [];

  if (isPublic) {
    cacheControl.push("public");
  } else {
    cacheControl.push("private");
  }

  cacheControl.push(`max-age=${maxAge}`);

  if (staleWhileRevalidate > 0) {
    cacheControl.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }

  if (immutable) {
    cacheControl.push("immutable");
  }

  response.headers.set("Cache-Control", cacheControl.join(", "));
  response.headers.set("X-Content-Type-Options", "nosniff");

  return response;
}

/**
 * Headers pour les données API (cache court avec revalidation)
 */
export function addApiCacheHeaders(response: NextResponse, maxAge = 300): NextResponse {
  return addCacheHeaders(response, {
    maxAge,
    staleWhileRevalidate: maxAge * 2,
    public: true,
  });
}

/**
 * Headers pour les assets statiques (cache long)
 */
export function addStaticCacheHeaders(response: NextResponse): NextResponse {
  return addCacheHeaders(response, {
    maxAge: 31536000, // 1 an
    staleWhileRevalidate: 31536000,
    public: true,
    immutable: true,
  });
}

/**
 * Headers pour les données dynamiques (pas de cache)
 */
export function addNoCacheHeaders(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

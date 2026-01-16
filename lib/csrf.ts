// lib/csrf.ts - Protection CSRF

import { randomBytes } from "crypto";

/**
 * Génère un token CSRF
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Valide un token CSRF
 */
export function validateCsrfToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) return false;
  return token === sessionToken;
}

/**
 * Vérifie si la requête vient du même serveur (Server Component -> API)
 */
export function isSameOriginRequest(req: Request): boolean {
  // Vérifier si la requête a un header spécial indiquant qu'elle vient du serveur
  const serverHeader = req.headers.get("x-internal-request");
  if (serverHeader === "true") return true;

  // Vérifier l'origine (pour les appels depuis Server Components)
  const origin = req.headers.get("origin");

  const host = req.headers.get("host");
  
  // Si pas d'origine (appel interne) ou si l'origine correspond au host
  if (!origin || (host && origin.includes(host))) {
    return true;
  }

  return false;
}

/**
 * Obtient le token CSRF depuis les headers ou cookies
 */
export function getCsrfTokenFromRequest(req: Request): string | null {
  // Vérifier d'abord dans les headers (pour API)
  const headerToken = req.headers.get("x-csrf-token");
  if (headerToken) return headerToken;

  // Sinon, vérifier dans les cookies (pour formulaires)
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    return cookies["csrf-token"] || null;
  }

  return null;
}

/**
 * Vérifie si une requête POST nécessite une protection CSRF
 */
export function requiresCsrfProtection(method: string, pathname: string): boolean {
  // Seulement les méthodes qui modifient l'état
  if (method !== "POST" && method !== "PUT" && method !== "DELETE" && method !== "PATCH") {
    return false;
  }

  // Routes qui nécessitent CSRF
  const protectedRoutes = [
    "/api/coaching",
    "/api/tier/switch",
    // Ajouter d'autres routes sensibles ici
  ];

  return protectedRoutes.some(route => pathname.startsWith(route));
}

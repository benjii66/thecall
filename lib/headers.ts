// lib/headers.ts - Headers de sécurité HTTP

import type { NextResponse as NextResponseType } from "next/server";

/**
 * Ajoute les headers de sécurité à une réponse
 */
export function addSecurityHeaders(response: NextResponseType): NextResponseType {
  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " + // unsafe-inline nécessaire pour Next.js
    "style-src 'self' 'unsafe-inline'; " + // unsafe-inline pour Tailwind
    "img-src 'self' data: https://ddragon.leagueoflegends.com; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://api.openai.com https://*.api.riotgames.com https://ddragon.leagueoflegends.com; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );

  // X-Frame-Options (protection contre clickjacking)
  response.headers.set("X-Frame-Options", "DENY");

  // X-Content-Type-Options (empêche MIME sniffing)
  response.headers.set("X-Content-Type-Options", "nosniff");

  // X-XSS-Protection (déprécié mais toujours utile pour les anciens navigateurs)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer-Policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions-Policy (anciennement Feature-Policy)
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=()"
  );

  // Strict-Transport-Security (HSTS) - seulement en production HTTPS
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}

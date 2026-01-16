// lib/cookieHelper.ts - Helpers pour gérer les cookies et le consentement

/**
 * Obtient le session ID depuis localStorage (créé après consentement)
 */
export function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  
  // Vérifier d'abord le consentement
  const consent = localStorage.getItem("cookie-consent");
  if (!consent) return null;
  
  try {
    const prefs = JSON.parse(consent) as { functional?: boolean; analytics?: boolean };
    // Ne retourner le session ID que si l'utilisateur a consenti aux cookies fonctionnels
    if (!prefs.functional && !prefs.analytics) return null;
  } catch {
    return null;
  }
  
  return localStorage.getItem("session-id");
}

/**
 * Vérifie si l'utilisateur a consenti aux cookies fonctionnels
 */
export function hasFunctionalCookieConsent(): boolean {
  if (typeof window === "undefined") return false;
  
  const consent = localStorage.getItem("cookie-consent");
  if (!consent) return false;
  
  try {
    const prefs = JSON.parse(consent) as { functional?: boolean; analytics?: boolean };
    return prefs.functional === true || prefs.analytics === true;
  } catch {
    return false;
  }
}

/**
 * Ajoute le session ID aux headers de la requête si le consentement est donné
 * À utiliser dans les appels fetch côté client
 */
export function getHeadersWithSession(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  const sessionId = getSessionId();
  if (sessionId) {
    headers["X-Session-ID"] = sessionId;
  }
  
  return headers;
}

// lib/security.ts - Fonctions de sécurité et validation

/**
 * Valide et sanitisse un PUUID Riot Games
 * Format: 78 caractères alphanumériques (peut contenir des underscores)
 * Exemple: FOLqGJNPweVPEM62Cq_AQrhA1Xi9lm8hapZkvytizxsO1PSAJAzyobu4gmlw6h_gbm_BPuGDCQZmqw
 * 
 * Note: Les PUUID Riot ne sont pas au format UUID standard.
 * Ils sont généralement hexadécimaux mais peuvent contenir des underscores et des lettres majuscules.
 */
export function validatePuuid(puuid: string | null | undefined): string | null {
  if (!puuid || typeof puuid !== "string") return null;
  
  const trimmed = puuid.trim();
  
  // PUUID Riot: exactement 78 caractères
  // Format: alphanumériques (0-9, a-z, A-Z) et underscores
  if (trimmed.length !== 78) return null;
  
  // Vérifier que c'est alphanumérique + underscores uniquement
  const puuidRegex = /^[0-9a-zA-Z_]+$/;
  
  if (!puuidRegex.test(trimmed)) return null;
  
  // Vérifier qu'il n'y a pas de caractères dangereux
  if (hasDangerousChars(trimmed)) return null;
  
  return trimmed;
}

/**
 * Valide et sanitisse un Match ID Riot Games
 * Format: REGION1_MATCHID (ex: EUW1_1234567890)
 */
export function validateMatchId(matchId: string | null | undefined): string | null {
  if (!matchId || typeof matchId !== "string") return null;
  
  const trimmed = matchId.trim();
  if (trimmed.length > 50) return null; // Limite de taille
  
  // Match ID: REGION + underscore + chiffres
  // Exemples: EUW1_1234567890, NA1_9876543210
  const matchIdRegex = /^[A-Z]{2,5}1_[0-9]{1,20}$/;
  
  return matchIdRegex.test(trimmed) ? trimmed : null;
}

/**
 * Valide et sanitisse un Game Name (nom de compte Riot)
 * Format: 3-16 caractères alphanumériques, espaces, tirets, underscores
 */
export function validateGameName(gameName: string | null | undefined): string | null {
  if (!gameName || typeof gameName !== "string") return null;
  
  const trimmed = gameName.trim();
  if (trimmed.length < 3 || trimmed.length > 16) return null;
  
  // Alphanumériques, espaces, tirets, underscores uniquement
  const gameNameRegex = /^[a-zA-Z0-9 _-]+$/;
  
  if (!gameNameRegex.test(trimmed)) return null;
  
  // Vérifier qu'il n'y a pas de caractères dangereux
  if (trimmed.includes("..") || trimmed.includes("//") || trimmed.includes("\\")) {
    return null;
  }
  
  return trimmed;
}

/**
 * Valide et sanitisse un Tag Line (tag Riot)
 * Format: 3-5 caractères alphanumériques
 */
export function validateTagLine(tagLine: string | null | undefined): string | null {
  if (!tagLine || typeof tagLine !== "string") return null;
  
  const trimmed = tagLine.trim();
  if (trimmed.length < 3 || trimmed.length > 5) return null;
  
  // Alphanumériques uniquement
  const tagLineRegex = /^[a-zA-Z0-9]+$/;
  
  return tagLineRegex.test(trimmed) ? trimmed : null;
}

/**
 * Valide un type de partie
 */
export function validateGameType(type: string | null | undefined): "all" | "draft" | "ranked" | "normal" | "flex" | null {
  if (!type || typeof type !== "string") return null;
  
  const validTypes = ["all", "draft", "ranked", "normal", "flex"] as const;
  return validTypes.includes(type as typeof validTypes[number]) ? (type as typeof validTypes[number]) : null;
}

/**
 * Valide un ID d'onglet
 */
export function validateTab(tab: string | null | undefined): "overview" | "coach" | null {
  if (!tab || typeof tab !== "string") return null;
  
  const validTabs = ["overview", "coach"] as const;
  return validTabs.includes(tab as typeof validTabs[number]) ? (tab as typeof validTabs[number]) : null;
}

/**
 * Valide la taille d'un objet JSON
 */
export function validateJsonSize(data: unknown, maxSizeBytes: number = 10 * 1024 * 1024): boolean {
  try {
    const jsonString = JSON.stringify(data);
    return jsonString.length <= maxSizeBytes;
  } catch {
    return false;
  }
}

/**
 * Échappe les caractères dangereux pour les URLs
 */
export function sanitizeForUrl(input: string): string {
  return encodeURIComponent(input);
}

/**
 * Valide qu'une chaîne ne contient pas de caractères dangereux
 */
export function hasDangerousChars(input: string): boolean {
  const dangerous = [
    "<", ">", '"', "'", "&",
    "../", "..\\", "//", "\\\\",
    "\x00", "\n", "\r", "\t"
  ];
  
  return dangerous.some(char => input.includes(char));
}

/**
 * Validates the Origin header for CSRF protection.
 * Returns true if the Origin matches the allowed site URL.
 */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  
  if (process.env.NODE_ENV === "development") return true;
  if (!origin) return false;

  const allowedUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;
  
  if (!allowedUrl) return true; // Fail-open in dev/preview if no URL is set, or add logic
  
  // Clean up URL to get base origin (protocol + host)
  try {
    const allowedOrigin = new URL(allowedUrl.startsWith("http") ? allowedUrl : `https://${allowedUrl}`).origin;
    
    // Exact match
    if (origin === allowedOrigin) return true;

    // Vercel Preview/Branch support: allow any *.vercel.app for ease of testing
    // In strict production with custom domain, NEXT_PUBLIC_SITE_URL should be set.
    if (origin.endsWith(".vercel.app")) {
        return true;
    }

    return false;
  } catch {
    // Fallback simple check if URL parsing fails
    return origin === allowedUrl || origin.endsWith(".vercel.app");
  }
}

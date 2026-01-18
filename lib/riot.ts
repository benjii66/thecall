// Riot API client - Centralise les requêtes vers l'API Riot Games
const RIOT_API_KEY = process.env.RIOT_API_KEY;

if (!RIOT_API_KEY) {
  throw new Error("RIOT_API_KEY is missing");
}

type Routing = "europe" | "americas" | "asia";

export async function riotFetch<T>(
  endpoint: string,
  routing: Routing = "europe",
  cacheOptions?: RequestInit["next"] & { cache?: RequestCache }
): Promise<T> {
  const token = process.env.RIOT_API_KEY;
  if (!token) throw new Error("RIOT_API_KEY missing");

  // Valider le routing
  const validRouting: Routing = ["europe", "americas", "asia"].includes(routing) 
    ? routing 
    : "europe";

  const base = `https://${validRouting}.api.riotgames.com`;
  
  // Sanitiser le path pour éviter les injections
  const sanitizedPath = endpoint
    .replace(/\.\./g, "") // Supprimer les ".."
    .replace(/\/+/g, "/") // Normaliser les slashes multiples
    .trim();
  
  const path = sanitizedPath.startsWith("/") ? sanitizedPath : `/${sanitizedPath}`;
  
  // Vérifier que le path ne contient pas de caractères dangereux
  if (/[<>"']/.test(path)) {
    throw new Error("Invalid endpoint format");
  }
  
  const url = `${base}${path}`;

  // Timeout de 10 secondes pour éviter les requêtes qui pendent indéfiniment
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      headers: { "X-Riot-Token": token },
      ...(cacheOptions?.cache 
        ? { cache: cacheOptions.cache } 
        : (cacheOptions?.revalidate 
            ? { next: cacheOptions } 
            : { cache: "no-store" })),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
    const txt = await res.text().catch(() => "");
    let errorMessage = `Riot error ${res.status}`;

    if (res.status === 401) {
      errorMessage = "Riot API key invalide ou expirée. Vérifie RIOT_API_KEY dans .env.local";
    } else if (res.status === 403) {
      errorMessage = "Riot API key sans permissions. Vérifie ta clé sur developer.riotgames.com";
    } else if (res.status === 429) {
      errorMessage = "Rate limit Riot API dépassé. Attends quelques secondes.";
    } else if (res.status === 404) {
      errorMessage = "Ressource Riot introuvable";
    } else {
      try {
        const json = JSON.parse(txt) as { status?: { message?: string } };
        if (json.status?.message) {
          errorMessage = `Riot API: ${json.status.message}`;
        }
      } catch {
        errorMessage = `Riot error ${res.status}: ${txt || "Unknown error"}`;
      }
    }

    const error = new Error(errorMessage) as Error & { status?: number; isRiotError?: boolean };
    error.status = res.status;
      error.isRiotError = true;
      throw error;
    }

    return (await res.json()) as T;
  } catch (err) {
    clearTimeout(timeoutId);
    
    // Gérer les erreurs de timeout
    if (err instanceof Error && err.name === "AbortError") {
      const timeoutError = new Error("Riot API request timeout (10s). Le serveur Riot ne répond pas.") as Error & { status?: number; isRiotError?: boolean };
      timeoutError.status = 504;
      timeoutError.isRiotError = true;
      throw timeoutError;
    }
    
    // Re-throw les autres erreurs
    throw err;
  }
}


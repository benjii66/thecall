// Riot API client - Centralise les requêtes vers l'API Riot Games
const RIOT_API_KEY = process.env.RIOT_API_KEY;

if (!RIOT_API_KEY) {
  // Warn only during build phase or allow failure at runtime
  if (process.env.NODE_ENV !== "production") {
      console.warn("RIOT_API_KEY is missing");
  }
}

type Routing = "europe" | "americas" | "asia";

export async function riotFetch<T>(
  endpoint: string,
  routing: Routing = "europe",
  cacheOptions?: RequestInit["next"] & { cache?: RequestCache }
): Promise<T> {
  const token = process.env.RIOT_API_KEY;
  if (!token) throw new Error("RIOT_API_KEY missing");

  // Validate routing
  const validRouting: Routing = ["europe", "americas", "asia"].includes(routing) 
    ? routing 
    : "europe";

  const base = `https://${validRouting}.api.riotgames.com`;
  
  // Sanitize path
  const sanitizedPath = endpoint
    .replace(/\.\./g, "")
    .replace(/\/+/g, "/")
    .trim();
  
  const path = sanitizedPath.startsWith("/") ? sanitizedPath : `/${sanitizedPath}`;
  
  if (/[<>"']/.test(path)) {
    throw new Error("Invalid endpoint format");
  }
  
  const url = `${base}${path}`;

  // Retry Logic
  let attempt = 0;
  const MAX_ATTEMPTS = 3;
  let delayMs = 1000; // Start with 1s

  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    
    // Timeout controller for each attempt
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

      // Success
      if (res.ok) {
        return (await res.json()) as T;
      }

      // Handle Errors
      const status = res.status;
      
      // Determine if we should retry (429 or 5xx)
      const shouldRetry = status === 429 || (status >= 500 && status < 600);
      
      if (shouldRetry && attempt < MAX_ATTEMPTS) {
        let waitTime = delayMs;
        
        // Respect Retry-After header if present
        const retryAfter = res.headers.get("Retry-After");
        if (retryAfter) {
            const seconds = parseInt(retryAfter, 10);
            if (!isNaN(seconds)) {
                waitTime = seconds * 1000;
            }
        }
        
        // Add minimal jitter (+0-500ms) to avoid thundering herd
        waitTime += Math.random() * 500;
        
        // Cap max wait time (30s)
        waitTime = Math.min(waitTime, 30000); 

        console.warn(`[RiotAPI] Error ${status} on ${path}. Retrying in ${Math.round(waitTime)}ms (Attempt ${attempt}/${MAX_ATTEMPTS})`);
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Exponential backoff for next time (unless Retry-After was used, but we can still increase base)
        delayMs *= 2;
        continue;
      }

      // If we are here, it's a fatal error or we ran out of retries
      const txt = await res.text().catch(() => "");
      let errorMessage = `Riot error ${status}`;

      if (status === 401) {
        errorMessage = "Riot API key invalide ou expirée. Vérifie RIOT_API_KEY dans .env.local";
      } else if (status === 403) {
        errorMessage = "Riot API key sans permissions. Vérifie ta clé sur developer.riotgames.com";
      } else if (status === 429) {
        errorMessage = "Rate limit Riot API dépassé (Max retries reached).";
      } else if (status === 404) {
        errorMessage = "Ressource Riot introuvable";
      } else {
        try {
          const json = JSON.parse(txt) as { status?: { message?: string } };
          if (json.status?.message) {
            errorMessage = `Riot API: ${json.status.message}`;
          }
        } catch {
          errorMessage = `Riot error ${status}: ${txt || "Unknown error"}`;
        }
      }

      const error = new Error(errorMessage) as Error & { status?: number; isRiotError?: boolean };
      error.status = status;
      error.isRiotError = true;
      throw error;

    } catch (err) {
      clearTimeout(timeoutId);
      
      // Handle Timeout specifically for retry
      const isTimeout = err instanceof Error && err.name === "AbortError";
      
      if (isTimeout && attempt < MAX_ATTEMPTS) {
          console.warn(`[RiotAPI] Timeout on ${path}. Retrying... (Attempt ${attempt}/${MAX_ATTEMPTS})`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          delayMs *= 2;
          continue;
      }

      if (isTimeout) {
        const timeoutError = new Error("Riot API request timeout (10s). Le serveur Riot ne répond pas.") as Error & { status?: number; isRiotError?: boolean };
        timeoutError.status = 504;
        timeoutError.isRiotError = true;
        throw timeoutError;
      }
      
      // Re-throw other errors immediately (e.g. network failure unrelated to timeout/status if we don't want to retry them, or maybe we do?)
      // For now, let's treat network errors as retryable if we wanted, but standard fetch errors (like DNS) might be permanent.
      // Let's re-throw non-timeout system errors for safety, or retry them? safest is rethrow.
      throw err;
    }
  }

  throw new Error("Riot API: Max retries exhausted"); // Should be unreachable given throw inside loop
}


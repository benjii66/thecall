// Riot API client - Centralise les requêtes vers l'API Riot Games
const RIOT_API_KEY = process.env.RIOT_API_KEY;

if (!RIOT_API_KEY) {
  throw new Error("RIOT_API_KEY is missing");
}

type Routing = "europe" | "americas" | "asia";

export async function riotFetch<T>(
  endpoint: string,
  routing: Routing = "europe"
): Promise<T> {
  const token = process.env.RIOT_API_KEY;
  if (!token) throw new Error("RIOT_API_KEY missing");

  const base = `https://${routing}.api.riotgames.com`;
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${base}${path}`;

  const res = await fetch(url, {
    headers: { "X-Riot-Token": token },
    cache: "no-store",
  });

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
}


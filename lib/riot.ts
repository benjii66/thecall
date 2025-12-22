const RIOT_API_KEY = process.env.RIOT_API_KEY;

if (!RIOT_API_KEY) {
  throw new Error("RIOT_API_KEY is missing");
}

// 👇 on force le type APRÈS le check
const RIOT_TOKEN: string = RIOT_API_KEY;

export async function riotFetch<T>(
  path: string,
  region: "europe" | "euw1" = "europe"
): Promise<T> {
  const base =
    region === "europe"
      ? "https://europe.api.riotgames.com"
      : "https://euw1.api.riotgames.com";

  const res = await fetch(`${base}${path}`, {
    headers: {
      "X-Riot-Token": RIOT_TOKEN,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Riot API error ${res.status}: ${text}`);
  }

  return res.json();
}

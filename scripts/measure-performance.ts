

const BASE_URL = "http://127.0.0.1:3000";

async function measure(label: string, url: string) {
  const start = performance.now();
  try {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const blob = await res.blob(); // fully consume body
    const end = performance.now();
    console.log(`[${label}] took ${(end - start).toFixed(2)}ms (Size: ${blob.size}b)`);
    return end - start;
  } catch (err) {
    console.error(`[${label}] FAILED:`, err);
    return 0;
  }
}

async function run() {
    console.log("Starting Benchmark...");
    
    // 1. Fetch Matches List
    // We assume the dev server is running and has access to environment variables.
    // If we can't get a PUUID easily, we might fail, but let's try a common known one or rely on default behavior.
    
    // Note: detailed match ID fetch depends on having a match ID. 
    // We'll try to fetch the list first, then pick the first match to benchmark detail fetch.

    // Using a hardcoded PUUID or relying on the server to use env var fallback.
    // Since this runs externally, we don't have access to server env vars directly.
    // But the API route handles 'puuid' param missing by falling back to env.
    
    const listUrl = `${BASE_URL}/api/matches`; 
    // First run (Coldish)
    await measure("Matches List (Run 1)", listUrl);
    // Second run (Warmish if any cache exists)
    await measure("Matches List (Run 2)", listUrl);

    // Try to get a match ID from the list to test detail fetch
    try {
        const res = await fetch(listUrl);
        const json = await res.json();
        if (json.matches && json.matches.length > 0) {
            const matchId = json.matches[0].id;
            const detailUrl = `${BASE_URL}/api/match/${matchId}`;
            
            await measure("Match Detail (Run 1)", detailUrl);
            await measure("Match Detail (Run 2)", detailUrl);
        } else {
            console.warn("No matches found to test detail fetch.");
        }
    } catch (e) {
        console.error("Failed to parse matches list for detail test", e);
    }
}

run();

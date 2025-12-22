// lib/cache.ts

import type { MatchPageData } from "@/types/match";
import type { MatchListItem } from "@/types/matchList";

/**
 * Cache L1 mémoire (serveur)
 * ⚠️ Volatile : reset au redémarrage du serveur
 */

// Cache des matchs individuels
const matchCache = new Map<string, MatchPageData>();

// Cache des listes de matchs (clé = puuid:type)
const matchListCache = new Map<string, MatchListItem[]>();

export const Cache = {
  // ---------- MATCHS INDIVIDUELS ----------

  getMatch(matchId: string) {
    return matchCache.get(matchId) ?? null;
  },

  setMatch(matchId: string, data: MatchPageData) {
    matchCache.set(matchId, data);
  },

  hasMatch(matchId: string) {
    return matchCache.has(matchId);
  },

  // ---------- LISTES DE MATCHS ----------

  getMatchList(key: string) {
    return matchListCache.get(key) ?? null;
  },

  setMatchList(key: string, list: MatchListItem[]) {
    matchListCache.set(key, list);
  },

  hasMatchList(key: string) {
    return matchListCache.has(key);
  },

  // ---------- DEBUG (optionnel) ----------

  stats() {
    return {
      matchCount: matchCache.size,
      matchListCount: matchListCache.size,
    };
  },
};

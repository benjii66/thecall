// lib/matchCache.ts
import type { RiotMatch, RiotTimeline } from "@/lib/riotTypes";
import type { MatchListItem } from "@/types/matchList";

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const now = () => Date.now();

export class MatchCache {
  private matchList = new Map<string, CacheEntry<MatchListItem[]>>();
  private matches = new Map<string, CacheEntry<RiotMatch>>();
  private timelines = new Map<string, CacheEntry<RiotTimeline>>();

  constructor(
    private ttlMs = 60_000, // 60s par défaut
    private maxMatches = 50 // anti-mémoire infinie
  ) {}

  /* ---------------------------
     Match list (par puuid+type)
  --------------------------- */

  private listKey(puuid: string, type: string) {
    return `${puuid}:${type}`;
  }

  getMatchList(puuid: string, type: string): MatchListItem[] | null {
    const key = this.listKey(puuid, type);
    const entry = this.matchList.get(key);
    if (!entry) return null;
    if (entry.expiresAt < now()) {
      this.matchList.delete(key);
      return null;
    }
    return entry.value;
  }

  setMatchList(puuid: string, type: string, list: MatchListItem[]) {
    // Option très utile : ne pas “figer” un état vide
    if (!list.length) return;

    const key = this.listKey(puuid, type);
    this.matchList.set(key, { value: list, expiresAt: now() + this.ttlMs });
  }

  /* ---------------------------
     Match (par matchId)
  --------------------------- */

  getMatch(matchId: string): RiotMatch | null {
    const entry = this.matches.get(matchId);
    if (!entry) return null;
    if (entry.expiresAt < now()) {
      this.matches.delete(matchId);
      return null;
    }
    return entry.value;
  }

  setMatch(matchId: string, match: RiotMatch) {
    this.matches.set(matchId, { value: match, expiresAt: now() + this.ttlMs });

    // petit nettoyage simple
    if (this.matches.size > this.maxMatches) {
      const firstKey = this.matches.keys().next().value as string | undefined;
      if (firstKey) this.matches.delete(firstKey);
    }
  }

  /* ---------------------------
     Timeline (par matchId)
  --------------------------- */

  getTimeline(matchId: string): RiotTimeline | null {
    const entry = this.timelines.get(matchId);
    if (!entry) return null;
    if (entry.expiresAt < now()) {
      this.timelines.delete(matchId);
      return null;
    }
    return entry.value;
  }

  setTimeline(matchId: string, timeline: RiotTimeline) {
    this.timelines.set(matchId, {
      value: timeline,
      expiresAt: now() + this.ttlMs,
    });

    if (this.timelines.size > this.maxMatches) {
      const firstKey = this.timelines.keys().next().value as string | undefined;
      if (firstKey) this.timelines.delete(firstKey);
    }
  }
}

// singleton (cache mémoire serveur)
export const matchCache = new MatchCache(60_000, 50);

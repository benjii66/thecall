// In-memory cache pour données Riot API (réduit rate limits et améliorer perf)
// Limitation: perdu au restart, pas partagé entre instances
import type { RiotMatch, RiotTimeline } from "@/lib/riotTypes";
import type { MatchListItem } from "@/types/matchList";

type Entry<T> = {
  data: T;
  expiresAt: number;
};

export type MatchListCacheEntry = {
  data: MatchListItem[];
  expiresAt: number;
  cursor: number;
  exhausted: boolean;
};

function now() {
  return Date.now();
}

export class MatchCache {
  private matchCache = new Map<string, Entry<RiotMatch>>();
  private timelineCache = new Map<string, Entry<RiotTimeline>>();
  private listCache = new Map<string, MatchListCacheEntry>();

  // Locks pour éviter double fetch simultané
  private inflightMatch = new Map<string, Promise<RiotMatch>>();
  private inflightTimeline = new Map<string, Promise<RiotTimeline>>();
  private inflightList = new Map<string, Promise<MatchListCacheEntry>>();

  getMatch(id: string): RiotMatch | null {
    const e = this.matchCache.get(id);
    if (!e) return null;
    if (e.expiresAt < now()) {
      this.matchCache.delete(id);
      return null;
    }
    return e.data;
  }

  setMatch(id: string, match: RiotMatch, ttlMs = 10 * 60 * 1000) {
    this.matchCache.set(id, { data: match, expiresAt: now() + ttlMs });
  }

  async withMatch(id: string, fetcher: () => Promise<RiotMatch>) {
    const cached = this.getMatch(id);
    if (cached) return cached;

    const inflight = this.inflightMatch.get(id);
    if (inflight) return inflight;

    const p = (async () => {
      try {
        const m = await fetcher();
        this.setMatch(id, m);
        return m;
      } finally {
        this.inflightMatch.delete(id);
      }
    })();

    this.inflightMatch.set(id, p);
    return p;
  }

  getTimeline(id: string): RiotTimeline | null {
    const e = this.timelineCache.get(id);
    if (!e) return null;
    if (e.expiresAt < now()) {
      this.timelineCache.delete(id);
      return null;
    }
    return e.data;
  }

  setTimeline(id: string, timeline: RiotTimeline, ttlMs = 10 * 60 * 1000) {
    this.timelineCache.set(id, { data: timeline, expiresAt: now() + ttlMs });
  }

  async withTimeline(id: string, fetcher: () => Promise<RiotTimeline>) {
    const cached = this.getTimeline(id);
    if (cached) return cached;

    const inflight = this.inflightTimeline.get(id);
    if (inflight) return inflight;

    const p = (async () => {
      try {
        const t = await fetcher();
        this.setTimeline(id, t);
        return t;
      } finally {
        this.inflightTimeline.delete(id);
      }
    })();

    this.inflightTimeline.set(id, p);
    return p;
  }

  getMatchList(key: string): MatchListCacheEntry | null {
    const e = this.listCache.get(key);
    if (!e) return null;
    if (e.expiresAt < now()) {
      this.listCache.delete(key);
      return null;
    }
    return e;
  }

  setMatchList(key: string, entry: MatchListCacheEntry) {
    this.listCache.set(key, entry);
  }

  async withMatchList(
    key: string,
    builder: (prev: MatchListCacheEntry | null) => Promise<MatchListCacheEntry>
  ) {
    const cached = this.getMatchList(key);
    if (cached) return cached;

    const inflight = this.inflightList.get(key);
    if (inflight) return inflight;

    const p = (async () => {
      try {
        const prev = this.getMatchList(key);
        const next = await builder(prev);
        this.setMatchList(key, next);
        return next;
      } finally {
        this.inflightList.delete(key);
      }
    })();

    this.inflightList.set(key, p);
    return p;
  }
}

export const matchCache = new MatchCache();

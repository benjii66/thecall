// __tests__/api/profile.test.ts
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { matchCache } from "@/lib/matchCache";
import type { RiotMatch, RiotTimeline } from "@/lib/riotTypes";

// Mock des dépendances
jest.mock("@/lib/riot", () => ({
  riotFetch: jest.fn(),
}));

jest.mock("@/lib/matchCache", () => ({
  matchCache: {
    getMatch: jest.fn(),
    getTimeline: jest.fn(),
  },
}));

describe("Profile API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should use only cached matches", () => {
    const mockMatch: Partial<RiotMatch> = {
      metadata: { matchId: "EUW1_123" },
      info: {
        queueId: 420,
        gameDuration: 1800,
        participants: [
          {
            puuid: "test-puuid",
            teamId: 100,
            teamPosition: "TOP",
            championName: "Poppy",
            kills: 5,
            deaths: 3,
            assists: 8,
            goldEarned: 10000,
            win: true,
            item0: 0,
            item1: 0,
            item2: 0,
            item3: 0,
            item4: 0,
            item5: 0,
            item6: 0,
            perks: { styles: [] },
          },
        ],
        teams: [],
      },
    };

    const cachedMatch = matchCache.getMatch("EUW1_123");
    expect(cachedMatch).toBeDefined();
  });

  it("should skip matches not in cache", () => {
    const cachedMatch = matchCache.getMatch("EUW1_999");
    expect(cachedMatch).toBeNull();
  });
});

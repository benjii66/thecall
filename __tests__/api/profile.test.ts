// __tests__/api/profile.test.ts
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { matchCache } from "@/lib/matchCache";

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
    // Test placeholder - à implémenter avec les mocks appropriés
    expect(true).toBe(true);
  });

  it("should skip matches not in cache", () => {
    const cachedMatch = matchCache.getMatch("EUW1_999");
    expect(cachedMatch).toBeNull();
  });
});

/** @jest-environment node */
process.env.OPENAI_API_KEY = "test-key";
process.env.RIOT_API_KEY = "test-key";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { GET } from "@/app/api/profile/route";
import { NextRequest } from "next/server";
import { getProfileAggregate } from "@/lib/profileAggregateCache";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

// Mocks
jest.mock("@/lib/profileAggregateCache", () => ({
  getProfileAggregate: jest.fn(),
  setProfileAggregate: jest.fn(),
}));

jest.mock("@/lib/session", () => ({
  getSessionUserId: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
    },
    match: {
      findMany: jest.fn(),
    },
    profileCoachingReport: {
        findFirst: jest.fn()
    }
  },
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("@/lib/riot", () => ({
  riotFetch: jest.fn().mockResolvedValue([]) as any,
}));

jest.mock("@/lib/controllers/matchController", () => ({
  getRawMatch: jest.fn(),
  getRawTimeline: jest.fn(),
}));

jest.mock("@/lib/tier-server", () => ({
  getUserTierServer: jest.fn().mockResolvedValue("free") as any,
}));

jest.mock("@/lib/openai", () => ({
  generateProfileReportStrict: jest.fn(),
}));

jest.mock("@/lib/db/ensureUser", () => ({
  ensureUser: jest.fn().mockResolvedValue({ id: "user-1" }) as any,
}));

// We need to mock computeProfileData specifically for the GET handler test
// Since it's in the same file, we can't easily mock it without restructuring,
// BUT we can mock the internal services it calls.

describe("Profile API GET Handler", () => {
  const puuid = "test-puuid";

  beforeEach(() => {
    jest.clearAllMocks();
    (getSessionUserId as any).mockResolvedValue("user-1");
  });

  function createReq(url: string) {
    return new NextRequest(url);
  }

  it("should return cached aggregate if available", async () => {
    const mockCache = { profile: { totalGames: 10 } };
    (getProfileAggregate as any).mockResolvedValue(mockCache);

    const req = createReq(`http://localhost/api/profile?puuid=${puuid}`);
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.source).toBe("agg_cache");
    expect(json.profile.totalGames).toBe(10);
  });

  it("should return needsSync: true if user exists but no cache", async () => {
    (getProfileAggregate as any).mockResolvedValue(null);
    (prisma.user.findFirst as any).mockResolvedValue({ id: "user-1" });
    
    // mock findMany to return some fast data
    (prisma.match.findMany as any).mockResolvedValue([]);

    const req = createReq(`http://localhost/api/profile?puuid=${puuid}`);
    const res = await GET(req);
    const json = await res.json();

    expect(json.needsSync).toBe(true);
    expect(json.source).toBe("db_stale");
  });

  it("should handle refresh=true by performing sync and returning needsSync: false", async () => {
    (getProfileAggregate as any).mockResolvedValue(null);
    (prisma.user.findFirst as any).mockResolvedValue({ id: "user-1" });
    (prisma.match.findMany as any).mockResolvedValue([]);
    
    // In computeProfileData, it will fetch from Riot because refresh=true (simulated by skipRiotCheck: false)
    // Wait, in my handler, refresh=true triggers skipRiotCheck: false.

    const req = createReq(`http://localhost/api/profile?puuid=${puuid}&refresh=true`);
    const res = await GET(req);
    const json = await res.json();

    expect(json.needsSync).toBe(false);
    expect(json.source).toBe("refresh");
  });

  it("should return 400 for invalid parameters", async () => {
      const req = createReq(`http://localhost/api/profile`);
      const res = await GET(req);
      expect(res.status).toBe(400);
  });
});

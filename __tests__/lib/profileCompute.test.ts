/** @jest-environment node */
process.env.OPENAI_API_KEY = "test-key";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { computeProfileData } from "@/app/api/profile/route";
import { riotFetch } from "@/lib/riot";
import { getRawMatch, getRawTimeline } from "@/lib/controllers/matchController";
import { prisma } from "@/lib/prisma";
import { setProfileAggregate } from "@/lib/profileAggregateCache";
import { getUserTierServer } from "@/lib/tier-server";
import { generateProfileReportStrict } from "@/lib/openai";

// Mocks
jest.mock("@/lib/riot", () => ({
  riotFetch: jest.fn(),
}));

jest.mock("@/lib/controllers/matchController", () => ({
  getRawMatch: jest.fn(),
  getRawTimeline: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    match: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    profileCoachingReport: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

jest.mock("@/lib/profileAggregateCache", () => ({
  getProfileAggregate: jest.fn(),
  setProfileAggregate: jest.fn(),
}));

jest.mock("@/lib/tier-server", () => ({
  getUserTierServer: jest.fn(),
}));

jest.mock("@/lib/openai", () => ({
  generateProfileReportStrict: jest.fn(),
}));

jest.mock("@/lib/db/ensureUser", () => ({
  ensureUser: jest.fn().mockResolvedValue({ id: "user-1", riotPuuid: "test-puuid" }) as any,
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("computeProfileData", () => {
  const puuid = "test-puuid";

  beforeEach(() => {
    jest.clearAllMocks();
    (getUserTierServer as any).mockResolvedValue("free");
  });

  it("should reduce analysis to 10 matches and fetch from DB if available", async () => {
    const mockMatchJson = {
      info: {
        participants: [{ puuid: puuid, kills: 10, deaths: 2, assists: 5, teamId: 100, teamPosition: "MIDDLE", championName: "Zed" }]
      }
    };
    
    (prisma.match.findMany as any).mockResolvedValue([
      { matchId: "MATCH1", matchJson: mockMatchJson, timelineJson: null, hasMatchJson: true }
    ]);

    const result = await computeProfileData(puuid, { skipRiotCheck: true });

    expect(result.profile.totalGames).toBe(1);
    expect(prisma.match.findMany as any).toHaveBeenCalledWith(expect.objectContaining({
      take: 10 // Verify it was reduced to 10
    }));
    expect(setProfileAggregate).toHaveBeenCalled();
  });

  it("should use chunked parallel ingestion when fetching from Riot", async () => {
    (riotFetch as any).mockResolvedValue(["M1", "M2", "M3", "M4", "M5"]);
    (prisma.user.findFirst as any).mockResolvedValue({ id: "user-1", lastMatchIdSeen: "OLD" });
    
    await computeProfileData(puuid, { skipRiotCheck: false });

    // Verify Riot IDs fetch
    expect(riotFetch).toHaveBeenCalledWith(expect.stringContaining("count=10"), "europe");
    
    // Verify getRawMatch calls
    expect(getRawMatch).toHaveBeenCalledTimes(5);
  });

  it("should call AI generation for PRO users when no cached report exists", async () => {
    (getUserTierServer as any).mockResolvedValue("pro");
    (prisma.profileCoachingReport.findFirst as any).mockResolvedValue(null);
    (generateProfileReportStrict as any).mockResolvedValue({
      reportJson: {
        summary: "AI Summary",
        strengths: [],
        weaknesses: [],
        top_3_priorities: [],
        wording_rules_applied: {}
      },
      modelUsed: "gpt-4o"
    });

    const mockMatchJson = {
      info: {
        gameVersion: "14.1.1",
        participants: [{ puuid: puuid, kills: 10, deaths: 2, assists: 5, teamId: 100, championName: "Zed" }]
      }
    };
    (prisma.match.findMany as any).mockResolvedValue([
        { matchId: "MATCH1", matchJson: mockMatchJson, hasMatchJson: true }
    ]);

    const result = await computeProfileData(puuid, { skipRiotCheck: true });

    expect(generateProfileReportStrict).toHaveBeenCalled();
    expect(result.profile.playstyle.description).toBe("AI Summary");
  });

  it("should fallback to heuristics if AI generation fails", async () => {
    (getUserTierServer as any).mockResolvedValue("pro");
    (generateProfileReportStrict as any).mockRejectedValue(new Error("AI down"));

    const mockMatchJson = {
      info: {
        participants: [{ puuid: puuid, kills: 10, deaths: 2, assists: 5, teamId: 100, championName: "Zed" }]
      }
    };
    (prisma.match.findMany as any).mockResolvedValue([
      { matchId: "MATCH1", matchJson: mockMatchJson, hasMatchJson: true }
    ]);

    const result = await computeProfileData(puuid, { skipRiotCheck: true });

    expect(result.profile.insights.length).toBeGreaterThan(0);
    // Should still return heuristics
    expect(result.profile.playstyle.description).toContain("style");
  });
});

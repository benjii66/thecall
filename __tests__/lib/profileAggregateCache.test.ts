import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { getProfileAggregate, setProfileAggregate } from "@/lib/profileAggregateCache";
import { getRedisClient } from "@/lib/redis";

// Mock des dépendances
jest.mock("@/lib/redis", () => ({
  getRedisClient: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("profileAggregateCache", () => {
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getRedisClient as jest.Mock).mockReturnValue(mockRedis);
  });

  describe("getProfileAggregate", () => {
    it("should return null if redis is not available", async () => {
      (getRedisClient as jest.Mock).mockReturnValue(null);
      const result = await getProfileAggregate("test-puuid");
      expect(result).toBeNull();
    });

    it("should return parsed JSON if data exists in redis", async () => {
      const mockData = { totalGames: 10, mainRole: "MID" };
      mockRedis.get.mockResolvedValue(JSON.stringify(mockData));

      const result = await getProfileAggregate("test-puuid");
      expect(result).toEqual(mockData);
      expect(mockRedis.get).toHaveBeenCalledWith(expect.stringContaining("test-puuid"));
    });

    it("should return null and log error if JSON parsing fails", async () => {
      mockRedis.get.mockResolvedValue("invalid-json");
      const result = await getProfileAggregate("test-puuid");
      expect(result).toBeNull();
    });
  });

  describe("setProfileAggregate", () => {
    it("should call redis.set with correct key and TTL", async () => {
      const mockData = { totalGames: 10 };
      await setProfileAggregate("test-puuid", mockData);

      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining("test-puuid"),
        JSON.stringify(mockData),
        { ex: 1800 } // AGG_CACHE_TTL = 30 * 60
      );
    });

    it("should do nothing if redis is not available", async () => {
      (getRedisClient as jest.Mock).mockReturnValue(null);
      await setProfileAggregate("test-puuid", { data: 1 });
      expect(mockRedis.set).not.toHaveBeenCalled();
    });
  });
});

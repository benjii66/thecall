import {
  validatePuuid,
  validateMatchId,
  validateGameName,
  validateTagLine,
  validateGameType,
  validateTab,
} from "@/lib/security";

describe("Security Validation", () => {
  describe("validatePuuid", () => {
    it("should validate correct PUUID", () => {
      const validPuuid = "FOLqGJNPweVPEM62Cq_AQrhA1Xi9lm8hapZkvytizxsO1PSAJAzyobu4gmlw6h_gbm_BPuGDCQZmqw";
      expect(validatePuuid(validPuuid)).toBe(validPuuid);
    });

    it("should reject invalid PUUID length", () => {
      expect(validatePuuid("short")).toBeNull();
      expect(validatePuuid("a".repeat(100))).toBeNull();
    });

    it("should reject PUUID with dangerous characters", () => {
      const invalid = "FOLqGJNPweVPEM62Cq_AQrhA1Xi9lm8hapZkvytizxsO1PSAJAzyobu4gmlw6h_gbm_BPuGDCQZmq<script>";
      expect(validatePuuid(invalid)).toBeNull();
    });

    it("should handle null/undefined", () => {
      expect(validatePuuid(null)).toBeNull();
      expect(validatePuuid(undefined)).toBeNull();
    });
  });

  describe("validateMatchId", () => {
    it("should validate correct match ID", () => {
      expect(validateMatchId("EUW1_1234567890")).toBe("EUW1_1234567890");
      expect(validateMatchId("NA1_9876543210")).toBe("NA1_9876543210");
    });

    it("should reject invalid format", () => {
      expect(validateMatchId("invalid")).toBeNull();
      expect(validateMatchId("EUW_123")).toBeNull();
      expect(validateMatchId("EUW1_abc")).toBeNull();
    });

    it("should reject too long match ID", () => {
      expect(validateMatchId("EUW1_" + "1".repeat(50))).toBeNull();
    });
  });

  describe("validateGameName", () => {
    it("should validate correct game name", () => {
      expect(validateGameName("PlayerName")).toBe("PlayerName");
      expect(validateGameName("Player Name")).toBe("Player Name");
      expect(validateGameName("Player-Name")).toBe("Player-Name");
    });

    it("should reject too short/long names", () => {
      expect(validateGameName("AB")).toBeNull(); // < 3
      expect(validateGameName("A".repeat(20))).toBeNull(); // > 16
    });

    it("should reject dangerous characters", () => {
      expect(validateGameName("Player<script>")).toBeNull();
      expect(validateGameName("Player../")).toBeNull();
    });
  });

  describe("validateTagLine", () => {
    it("should validate correct tag line", () => {
      expect(validateTagLine("EUW")).toBe("EUW");
      expect(validateTagLine("1234")).toBe("1234");
    });

    it("should reject invalid length", () => {
      expect(validateTagLine("AB")).toBeNull(); // < 3
      expect(validateTagLine("ABCDEF")).toBeNull(); // > 5
    });

    it("should reject non-alphanumeric", () => {
      expect(validateTagLine("EU-W")).toBeNull();
      expect(validateTagLine("EU W")).toBeNull();
    });
  });

  describe("validateGameType", () => {
    it("should validate correct game types", () => {
      expect(validateGameType("all")).toBe("all");
      expect(validateGameType("draft")).toBe("draft");
      expect(validateGameType("ranked")).toBe("ranked");
    });

    it("should reject invalid types", () => {
      expect(validateGameType("invalid")).toBeNull();
      expect(validateGameType("")).toBeNull();
    });
  });

  describe("validateTab", () => {
    it("should validate correct tabs", () => {
      expect(validateTab("overview")).toBe("overview");
      expect(validateTab("coach")).toBe("coach");
    });

    it("should reject invalid tabs", () => {
      expect(validateTab("invalid")).toBeNull();
      expect(validateTab("")).toBeNull();
    });
  });
});

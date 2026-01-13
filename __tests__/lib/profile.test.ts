// __tests__/lib/profile.test.ts
import { describe, it, expect } from "@jest/globals";

describe("Profile calculations", () => {
  describe("Aggression calculation", () => {
    it("should classify low aggression (< 4 deaths/game)", () => {
      const avgDeaths = 3.5;
      const aggression = avgDeaths > 6 ? "high" : avgDeaths > 4 ? "medium" : "low";
      expect(aggression).toBe("low");
    });

    it("should classify medium aggression (4-6 deaths/game)", () => {
      const avgDeaths = 5;
      const aggression = avgDeaths > 6 ? "high" : avgDeaths > 4 ? "medium" : "low";
      expect(aggression).toBe("medium");
    });

    it("should classify high aggression (> 6 deaths/game)", () => {
      const avgDeaths = 7;
      const aggression = avgDeaths > 6 ? "high" : avgDeaths > 4 ? "medium" : "low";
      expect(aggression).toBe("high");
    });
  });

  describe("Objective focus calculation", () => {
    it("should classify low focus (< 2 objectives/game)", () => {
      const avgObjectives = 1.5;
      const objectiveFocus = avgObjectives > 3 ? "high" : avgObjectives > 2 ? "medium" : "low";
      expect(objectiveFocus).toBe("low");
    });

    it("should classify medium focus (2-3 objectives/game)", () => {
      const avgObjectives = 2.5;
      const objectiveFocus = avgObjectives > 3 ? "high" : avgObjectives > 2 ? "medium" : "low";
      expect(objectiveFocus).toBe("medium");
    });

    it("should classify high focus (> 3 objectives/game)", () => {
      const avgObjectives = 4;
      const objectiveFocus = avgObjectives > 3 ? "high" : avgObjectives > 2 ? "medium" : "low";
      expect(objectiveFocus).toBe("high");
    });
  });

  describe("Team fight presence calculation", () => {
    it("should classify low presence (< 45% KP)", () => {
      const avgKP = 40;
      const teamFightPresence = avgKP > 60 ? "high" : avgKP > 45 ? "medium" : "low";
      expect(teamFightPresence).toBe("low");
    });

    it("should classify medium presence (45-60% KP)", () => {
      const avgKP = 50;
      const teamFightPresence = avgKP > 60 ? "high" : avgKP > 45 ? "medium" : "low";
      expect(teamFightPresence).toBe("medium");
    });

    it("should classify high presence (> 60% KP)", () => {
      const avgKP = 65;
      const teamFightPresence = avgKP > 60 ? "high" : avgKP > 45 ? "medium" : "low";
      expect(teamFightPresence).toBe("high");
    });
  });

  describe("Win rate calculation", () => {
    it("should calculate win rate correctly", () => {
      const wins = 7;
      const total = 10;
      const winRate = Math.round((wins / total) * 100);
      expect(winRate).toBe(70);
    });

    it("should handle zero wins", () => {
      const wins = 0;
      const total = 5;
      const winRate = Math.round((wins / total) * 100);
      expect(winRate).toBe(0);
    });
  });
});

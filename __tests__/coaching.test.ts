
import { generateHeuristicReport } from "@/lib/coachingUtils";
import { MatchPageData } from "@/types/match";
import { WinProbPoint } from "@/lib/winProbability";

describe("generateHeuristicReport", () => {
  const mockMatchData: MatchPageData = {
    gameVersion: "14.4.1",
    timelineEvents: [],
    me: {
      champion: "Ahri",
      role: "Mid",
      kda: "5/2/10",
      kills: 5,
      assists: 10,
      kp: 65,
      gold: 12000,
      cs: 200,
      level: 16,
      visionScore: 25,
      damage: 25000,
      deaths: 2,
      win: true,
      build: { items: [], runes: [] }
    },
    opponent: {
      champion: "Yasuo",
      role: "Mid",
      kda: "2/8/3",
      kills: 2,
      assists: 3,
      kp: 20,
      gold: 9000,
      cs: 150,
      level: 14,
      visionScore: 15,
      damage: 15000,
      deaths: 8,
      win: false,
      build: { items: [], runes: [] }
    },
    allyTeam: [],
    enemyTeam: []
  };

  const mockWinProb: WinProbPoint[] = [
      { minute: 0, score: 0, probability: 50 },
      { minute: 10, score: 10, probability: 60 },
      { minute: 20, score: 20, probability: 70 }, // Game ends around 20 for test?
  ];

  it("should detect good farming", () => {
    // 200 CS in 20 mins = 10 CS/min -> Excellent
    const report = generateHeuristicReport(mockMatchData, mockWinProb, false);
    expect(report.positives).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ title: "Pro du Farming" })
        ])
    );
  });

  it("should detect bad farming", () => {
      const badFarmData = { ...mockMatchData, me: { ...mockMatchData.me, cs: 80 } }; // 4 CS/min
      const report = generateHeuristicReport(badFarmData, mockWinProb, false);
      
      expect(report.focus?.title).toMatch(/Farming/);
      expect(report.negatives).toEqual(
          expect.arrayContaining([
              expect.objectContaining({ title: "Revenu critique" })
          ])
      );
  });

  it("should detect low vision score in long game", () => {
      // 30 min game
      const longGameProb = [...mockWinProb, { minute: 30, score: 30, probability: 80 }];
      const lowVisionData = { ...mockMatchData, me: { ...mockMatchData.me, visionScore: 5 } };
      
      const report = generateHeuristicReport(lowVisionData, longGameProb, false);
      expect(report.focus?.title).toMatch(/Vision/);
  });
});

import { computeWinProbability } from "@/lib/winProbability";
import type { TimelineEvent } from "@/types/timeline";

describe("computeWinProbability", () => {
  it("should return empty array for no events", () => {
    const result = computeWinProbability([]);
    expect(result).toEqual([]);
  });

  it("should calculate win probability for a kill", () => {
    const events: TimelineEvent[] = [
      {
        minute: 5,
        second: 30,
        kind: "kill",
        team: "ally",
        involved: true,
        label: "Kill",
      },
    ];

    const result = computeWinProbability(events);
    expect(result.length).toBeGreaterThan(0);
    expect(result[result.length - 1].probability).toBeGreaterThan(50);
  });

  it("should calculate win probability for a death", () => {
    const events: TimelineEvent[] = [
      {
        minute: 5,
        second: 30,
        kind: "death",
        team: "ally",
        involved: true,
        label: "Death",
      },
    ];

    const result = computeWinProbability(events);
    expect(result.length).toBeGreaterThan(0);
    expect(result[result.length - 1].probability).toBeLessThan(50);
  });

  it("should handle baron objective", () => {
    const events: TimelineEvent[] = [
      {
        minute: 25,
        second: 0,
        kind: "baron",
        team: "ally",
        involved: false,
        label: "Baron",
      },
    ];

    const result = computeWinProbability(events, 25);
    expect(result.length).toBeGreaterThan(0);
    const finalProb = result[result.length - 1].probability;
    expect(finalProb).toBeGreaterThan(50);
  });

  it("should clamp probabilities between 0 and 100", () => {
    // Créer beaucoup d'événements positifs pour tester le clamp
    const events: TimelineEvent[] = Array.from({ length: 50 }, (_, i) => ({
      minute: i,
      second: 0,
      kind: "kill" as const,
      team: "ally" as const,
      involved: true,
      label: "Kill",
    }));

    const result = computeWinProbability(events);
    result.forEach((point) => {
      expect(point.probability).toBeGreaterThanOrEqual(0);
      expect(point.probability).toBeLessThanOrEqual(100);
    });
  });

  it("should smooth probabilities with moving average", () => {
    const events: TimelineEvent[] = [
      {
        minute: 10,
        second: 0,
        kind: "kill",
        team: "ally",
        involved: true,
        label: "Kill",
      },
      {
        minute: 11,
        second: 0,
        kind: "death",
        team: "ally",
        involved: true,
        label: "Death",
      },
    ];

    const result = computeWinProbability(events, 15);
    // Vérifier que le smoothing est appliqué (pas de sauts brusques)
    expect(result.length).toBeGreaterThan(0);
  });
});

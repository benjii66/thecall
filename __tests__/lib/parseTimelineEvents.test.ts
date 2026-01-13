import { extractTimelineEvents } from "@/lib/parseTimelineEvents";
import type { RiotMatch, RiotTimeline } from "@/lib/riotTypes";

describe("extractTimelineEvents", () => {
  const createMockMatch = (myPuuid: string): RiotMatch => ({
    metadata: { matchId: "test", participants: [] },
    info: {
      gameDuration: 1800,
      participants: [
        {
          puuid: myPuuid,
          participantId: 1,
          teamId: 100,
          championName: "Jinx",
          kills: 0,
          deaths: 0,
          assists: 0,
          win: true,
          goldEarned: 0,
          teamPosition: "BOTTOM",
        },
        {
          puuid: "enemy",
          participantId: 2,
          teamId: 200,
          championName: "Caitlyn",
          kills: 0,
          deaths: 0,
          assists: 0,
          win: false,
          goldEarned: 0,
          teamPosition: "BOTTOM",
        },
      ],
    },
  } as unknown as RiotMatch);

  const createMockTimeline = (): RiotTimeline => ({
    info: {
      frames: [
        {
          timestamp: 300000, // 5 min
          events: [
            {
              type: "CHAMPION_KILL",
              killerId: 1,
              victimId: 2,
              timestamp: 300000,
            },
          ],
          participantFrames: {},
        },
      ],
    },
  } as unknown as RiotTimeline);

  it("should extract kill events", () => {
    const match = createMockMatch("me");
    const timeline = createMockTimeline();
    const events = extractTimelineEvents(match, timeline, "me");

    expect(events.length).toBeGreaterThan(0);
    const killEvent = events.find((e) => e.kind === "kill");
    expect(killEvent).toBeDefined();
    expect(killEvent?.team).toBe("ally");
  });

  it("should return empty array if player not found", () => {
    const match = createMockMatch("me");
    const timeline = createMockTimeline();
    const events = extractTimelineEvents(match, timeline, "not-me");

    expect(events).toEqual([]);
  });

  it("should handle empty timeline", () => {
    const match = createMockMatch("me");
    const timeline: RiotTimeline = {
      info: { frames: [] },
    } as unknown as RiotTimeline;

    const events = extractTimelineEvents(match, timeline, "me");
    expect(events).toEqual([]);
  });
});

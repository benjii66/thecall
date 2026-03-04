
import { formatTimelineEvents } from "../lib/timelineUtils";
import { TimelineEvent } from "../types/timeline";

describe("formatTimelineEvents", () => {
  it("should format a kill event correctly", () => {
    const events: TimelineEvent[] = [
      {
        minute: 2,
        second: 30,
        kind: "kill",
        team: "ally",
        involved: true,
        label: "Ally Ahri kills Enemy Yasuo",
      },
    ];

    const result = formatTimelineEvents(events);
    expect(result).toContain("[2:30] MOI/IMPLIQUÉ - KILL Ally Ahri kills Enemy Yasuo");
  });

  it("should format an enemy object event correctly", () => {
    const events: TimelineEvent[] = [
      {
        minute: 15,
        second: 0,
        kind: "dragon",
        team: "enemy",
        involved: false,
        label: "Cloud Drake",
      },
    ];

    const result = formatTimelineEvents(events);
    expect(result).toContain("[15:00] ENNEMI - DRAGON Cloud Drake");
  });

  it("should limit events to 60 (take first 15 and last 45)", () => {
    const events: TimelineEvent[] = Array.from({ length: 70 }, (_, i) => ({
      minute: i,
      second: 0,
      kind: "kill",
      team: "ally",
      involved: false,
      label: `Kill ${i}`,
    }));

    const result = formatTimelineEvents(events);
    const lines = result.split("\n");
    
    // logic is: > 60 events -> take first 15 and last 45 = 60 total
    expect(lines.length).toBe(60);
    expect(lines[0]).toContain("Kill 0"); // Start
    expect(lines[59]).toContain("Kill 69"); // End
    // Check missing middle
    expect(result).not.toContain("Kill 20"); 
  });
});

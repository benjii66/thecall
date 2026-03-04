
import { TimelineEvent } from "@/types/timeline";

export function formatTimelineEvents(events: TimelineEvent[]): string {
    const importantEvents = events.filter(e => 
        e.kind === "kill" || 
        e.kind === "death" || 
        e.kind === "dragon" || 
        e.kind === "baron" || 
        e.kind === "tower" ||
        (e.kind === "assist" && e.involved)
    );
    
    // Limit to max 50 events to save tokens (focus on mid/late game macro or key early moments)
    const limitedEvents = importantEvents.length > 60 
        ? [...importantEvents.slice(0, 15), ...importantEvents.slice(-45)]
        : importantEvents;

    return limitedEvents.map(e => {
        const time = `${e.minute}:${String(e.second).padStart(2, '0')}`;
        let team = e.team === "ally" ? "ALLIÉ" : "ENNEMI";
        if (e.involved) team = "MOI/IMPLIQUÉ";
        
        let desc = e.kind.toUpperCase();
        if (e.label) desc += ` ${e.label}`;
        
        return `[${time}] ${team} - ${desc}`;
    }).join("\n");
}

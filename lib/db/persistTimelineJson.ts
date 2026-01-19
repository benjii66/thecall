import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

interface PersistTimelineJsonParams {
  userId: string;
  matchId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timelineJson: any;
}

export async function persistTimelineJson(params: PersistTimelineJsonParams) {
  const { userId, matchId, timelineJson } = params;

  try {
    // We only update here, assuming match exists. 
    // If match doesn't exist, we can't really attach timeline (foreign key logic or just logical dependency).
    // Timeline without Match is useless.
    
    await prisma.match.update({
        where: { userId_matchId: { userId, matchId } },
        data: {
            timelineJson,
            hasTimelineJson: true
        }
    });

  } catch (error) {
    // If record missing, warning
    logger.warn("[DB] persistTimelineJson failed (match might be missing)", { error, matchId });
  }
}

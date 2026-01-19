import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { RiotMatch, RiotTimeline } from "@/lib/riotTypes";

interface PersistMatchParams {
  userId: string;
  userPuuid: string;
  matchId: string;
  matchJson: RiotMatch;
  timelineJson?: RiotTimeline | null;
}

export async function persistMatch(params: PersistMatchParams) {
  const { userId, userPuuid, matchId, matchJson, timelineJson } = params;

  try {
    // Extract metadata
    const info = matchJson.info;
    const gameCreation = new Date(info.gameCreation);
    const gameDuration = info.gameDuration;
    const queueId = info.queueId;

    // Find participant for this user
    const participant = info.participants.find((p) => p.puuid === userPuuid);

    const matchRow = await prisma.match.upsert({
      where: {
        userId_matchId: {
          userId,
          matchId,
        },
      },
      create: {
        userId,
        matchId,
        gameCreation,
        gameDuration,
        queueId,
        win: participant?.win ?? false,
        championId: participant?.championId ?? 0,
        role: participant?.teamPosition || participant?.individualPosition || null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        matchJson: matchJson as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        timelineJson: (timelineJson as any) ?? undefined,
      },
      update: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        matchJson: matchJson as any,
        // Only update timeline if provided
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(timelineJson && { timelineJson: timelineJson as any }),
      },
    });

    logger.debug(`[DB] match upsert OK (matchId=${matchId}, matchDbId=${matchRow.id})`);
    return matchRow;
  } catch (error) {
    logger.error("[DB] persistMatch failed", { error, matchId, userId });
    throw error;
  }
}

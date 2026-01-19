import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

interface PersistMatchMetadataParams {
  userId: string;
  userPuuid: string; // Used to find the participant data
  matchId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  matchJson: any; // RiotMatch actually, but keeping it flexible or could type properly
}

export async function persistMatchMetadata(params: PersistMatchMetadataParams) {
  const { userId, userPuuid, matchId, matchJson } = params;

  try {
    const info = matchJson.info;
    const participant = info.participants.find((p: { puuid: string }) => p.puuid === userPuuid);

    if (!participant) {
      logger.warn(`[DB] Metadata persist skipped: participant not found for puuid=${userPuuid} in match=${matchId}`);
      return;
    }

    // Upsert Match: update metadata but DO NOT TOUCH matchJson/timelineJson
    // To handle "matchJson is required in Create but optional in Update?", 
    // now we made matchJson optional in schema, so we can generic create with null.
    
    await prisma.match.upsert({
      where: { userId_matchId: { userId, matchId } },
      create: {
        userId,
        matchId,
        gameCreation: new Date(info.gameCreation),
        gameDuration: info.gameDuration,
        queueId: info.queueId,
        win: participant.win,
        championId: participant.championId,
        role: participant.teamPosition || participant.individualPosition || null,
        // matchJson/timelineJson default to null
        hasMatchJson: false,
        hasTimelineJson: false,
      },
      update: {
        // Update metadata in case it changed (unlikely for historical)
        win: participant.win,
        role: participant.teamPosition || participant.individualPosition || null,
        // Don't touch JSONs
      },
    });

  } catch (error) {
    logger.error("[DB] persistMatchMetadata failed", { error, matchId, userId });
    // We swallow error to not break the UI list
  }
}

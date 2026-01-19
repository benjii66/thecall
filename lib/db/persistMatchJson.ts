import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

interface PersistMatchJsonParams {
  userId: string;
  matchId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  matchJson: any;
}

export async function persistMatchJson(params: PersistMatchJsonParams) {
  const { userId, matchId, matchJson } = params;

  try {
    // We assume metadata might already exist, but if not we should probably fill it?
    // Ideally this is called when we have the object.
    // If row exists -> update matchJson + hasMatchJson=true.
    // If not exists -> create full row.
    
    // We need userPuuid to fill metadata if creating. 
    // But this helper signature doesn't require it if we assume row exists.
    // However, for robustness, if row missing, we can't create without metadata (required fields).
    // So we assume row exists OR we need to accept metadata params too.
    // Simplification: We update. If missing, we might fail or need to call persistMatchMetadata first.
    // Let's rely on upsert with metadata extraction to be safe.
    
    // Find PUUID from DB user if possible? Too slow.
    // Let's require the caller to ensure metadata is there, OR pass everything.
    // Better: This helper is used when we HAVE the matchJson. The matchJson contains everything.
    // We just need the PUUID to find the participant.
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const userPuuid = user?.riotPuuid;

    if (!userPuuid) {
         logger.warn(`[DB] persistMatchJson ignored: cannot find user PUUID for userId=${userId}`);
         return;
    }

    const info = matchJson.info;
    const participant = info.participants.find((p: { puuid: string }) => p.puuid === userPuuid);

    await prisma.match.upsert({
      where: { userId_matchId: { userId, matchId } },
      create: {
        userId,
        matchId,
        gameCreation: new Date(info.gameCreation),
        gameDuration: info.gameDuration,
        queueId: info.queueId,
        win: participant?.win ?? false,
        championId: participant?.championId ?? 0,
        role: participant?.teamPosition || participant?.individualPosition || null,
        matchJson: matchJson,
        hasMatchJson: true,
        hasTimelineJson: false,
      },
      update: {
        matchJson: matchJson,
        hasMatchJson: true,
      },
    });
    // logger.debug(`[DB] matchJson persist OK (matchId=${matchId})`);

  } catch (error) {
    logger.error("[DB] persistMatchJson failed", { error, matchId });
  }
}

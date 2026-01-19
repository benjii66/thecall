import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

interface EnsureUserParams {
  riotPuuid: string;
  riotGameName?: string;
  riotTagLine?: string;
  riotRegion?: string;
  name?: string;
  email?: string;
  image?: string;
}

export async function ensureUser(params: EnsureUserParams) {
  const { riotPuuid, riotGameName, riotTagLine, riotRegion, name, email, image } = params;

  try {
    const user = await prisma.user.upsert({
      where: { riotPuuid },
      create: {
        riotPuuid,
        riotGameName,
        riotTagLine,
        riotRegion,
        name,
        email,
        image,
      },
      update: {
        // Update metadata if provided
        ...(riotGameName && { riotGameName }),
        ...(riotTagLine && { riotTagLine }),
        ...(riotRegion && { riotRegion }),
        ...(name && { name }),
        ...(email && { email }),
        ...(image && { image }),
      },
    });

    logger.debug(`[DB] user upsert OK (userId=${user.id})`);
    return user;
  } catch (error) {
    logger.error("[DB] ensureUser failed", { error, riotPuuid });
    throw error;
  }
}

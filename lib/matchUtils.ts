import { RiotMatch } from "./riotTypes";

export function getMyTeamId(match: RiotMatch, myPuuid: string): number {
  const me = match.info.participants.find((p) => p.puuid === myPuuid);

  if (!me) {
    throw new Error("Player not found in match");
  }

  return me.teamId;
}

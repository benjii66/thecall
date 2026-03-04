// --- Timeline ---

export type RiotDragonEvent = {
  type: "ELITE_MONSTER_KILL";
  monsterType: "DRAGON";
  monsterSubType: string;
  timestamp: number;
  killerTeamId: number;
};

export type RiotFrame = {
  events: RiotDragonEvent[];
};

export type RiotTimeline = {
  info: {
    frames: RiotFrame[];
  };
};

// --- Match ---

// lib/riotTypes.ts

export type RiotParticipant = {
  puuid: string;
  teamId: number;
  teamPosition: string;
  individualPosition: string;

  championId: number;
  championName: string;

  kills: number;
  deaths: number;
  assists: number;

  goldEarned: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  champLevel: number;
  visionScore: number;
  totalDamageDealtToChampions: number;

  win: boolean;
  // items...
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;

  perks: {
    styles: {
      style: number;
      selections: { perk: number; var1: number; var2: number; var3: number }[];
    }[];
  };
};

export type RiotMatch = {
  metadata: {
    matchId: string;
  };
  info: {
    gameCreation: number;
    gameVersion: string;
    queueId: number;
    gameDuration: number;
    participants: RiotParticipant[];
    teams: RiotTeam[];
  };
};

export type RiotTeam = {
  teamId: number;
  objectives: {
    champion: { kills: number };
  };
};

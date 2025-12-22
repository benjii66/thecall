// types/match.ts

export type PlayerBuild = {
  items: string[];
  runes: string[];
};

export type PlayerSummary = {
  champion: string;
  role: string;

  kda: string;
  kp: number; // ← KP %
  gold: number;

  win: boolean; // ← victoire / défaite

  build: PlayerBuild;
};

export type TeamPlayer = {
  champion: string;
  kda: string;
};

export type MatchPageData = {
  timelineEvents: import("./timeline").TimelineEvent[];

  me: PlayerSummary;
  opponent: PlayerSummary | null;

  allyTeam: TeamPlayer[];
  enemyTeam: TeamPlayer[];
};

export type BuildData = {
  items: string[]; // 👈 IDs DataDragon en string
  runes: string[];
};

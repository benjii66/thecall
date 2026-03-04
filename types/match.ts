// types/match.ts

export type PlayerBuild = {
  items: string[];
  runes: string[];
  itemNames?: Record<string, string>; // Map ID -> nom (optionnel, pour tooltips)
  runeNames?: Record<string, string>; // Map chemin -> nom (optionnel, pour tooltips)
};

export type PlayerSummary = {
  champion: string;
  role: string;

  kda: string;
  kp: number; // ← KP %
  gold: number;
  cs: number; // ← Creep Score (minions + jungle)
  level: number; // ← Champion Level
  visionScore: number;
  damage: number;
  deaths: number;

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

  gameVersion: string;
};

// types/match.ts

export type MatchListItem = {
  id: string; // utilisé par le select
  label: string; // texte affiché dans le dropdown

  matchId: string; // id Riot réel
  champion: string;
  opponent: string;

  win: boolean;
  duration: number; // en secondes
  queueId: number;
};

export type BuildData = {
  items: string[]; // IDs DataDragon en string
  runes: string[]; // Chemins d'icônes de runes
  itemNames?: Record<string, string>; // Map ID -> nom (optionnel, pour tooltips)
  runeNames?: Record<string, string>; // Map chemin -> nom (optionnel, pour tooltips)
};

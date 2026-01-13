export type RoleStats = {
  role: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKDA: string;
  avgKP: number;
  avgGold: number;
  mostPlayedChampions: Array<{ champion: string; games: number; winRate: number }>;
};

export type PlayerProfile = {
  totalGames: number;
  overallWinRate: number;
  mainRole: string;
  roleStats: RoleStats[];
  playstyle: {
    aggression: "low" | "medium" | "high";
    objectiveFocus: "low" | "medium" | "high";
    teamFightPresence: "low" | "medium" | "high";
    description: string;
  };
  insights: Array<{
    type: "strength" | "weakness" | "recommendation";
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    data?: {
      label: string;
      value: string | number;
    }[];
  }>;
  trends: {
    recentWinRate: number;
    recentGames: number;
    improving: boolean;
  };
};

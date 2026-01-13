export type TimelineEvent = {
  minute: number;
  second: number;
  kind:
    | "kill"
    | "death"
    | "assist"
    | "dragon"
    | "herald"
    | "baron"
    | "tower"
    | "grub"
    | "gold";
  team: "ally" | "enemy";
  involved: boolean;
  label?: string;
  meta?: {
    victimChampion?: string;
    killerChampion?: string;
    assistingChampions?: string[];
    assistCount?: number;
    dragonType?: string;
    towerTier?: "outer" | "inner" | "inhibitor" | "nexus";
    towerLane?: "top" | "mid" | "bot";
    shutdownBounty?: number;
    goldDiff?: number; // perspective ally : positif = avantage ally
  };
};

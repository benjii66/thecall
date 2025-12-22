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
    | "grub";
  team: "ally" | "enemy";
  involved: boolean;
  label?: string; // 👈 OPTIONNEL PARTOUT
  meta?: {
    victimChampion?: string;
    killerChampion?: string;
    assistingChampions?: string[];
    assistCount?: number;
  };
};

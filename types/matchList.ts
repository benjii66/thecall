export type MatchListItem = {
  id: string;
  label: string; // "Viego vs XinZhao • 23:21 • Victoire"
  queueId: number;

  champion: string;
  opponent: string;
  win: boolean;
  duration: number;
};

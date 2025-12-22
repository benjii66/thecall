type GameType = "all" | "draft" | "ranked" | "aram";

const QUEUE_BY_TYPE: Record<GameType, number[] | null> = {
  all: null,
  draft: [400, 430],
  ranked: [420, 440],
  aram: [450],
};

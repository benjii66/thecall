export const QUEUE_BY_TYPE = {
  all: [],
  ranked: [420, 440],
  draft: [400, 430],
} as const;

export type GameType = keyof typeof QUEUE_BY_TYPE;

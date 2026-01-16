export const QUEUE_BY_TYPE = {
  all: [],
  ranked: [420, 440],
  draft: [400],
  normal: [400, 430], // Draft & Blind
  flex: [440],
} as const;

export type GameType = keyof typeof QUEUE_BY_TYPE;

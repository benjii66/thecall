import { z } from "zod";

export const profileSchema = z.object({
  puuid: z.string().min(10, "Invalid PUUID"),
  refresh: z.coerce.boolean().optional(),
});

export const syncSchema = z.object({
  puuid: z.string().min(10, "Invalid PUUID"),
});

export const matchListSchema = z.object({
  puuid: z.string().min(10, "Invalid PUUID"),
  count: z.coerce.number().min(1).max(100).optional(),
  cursor: z.string().optional(),
});

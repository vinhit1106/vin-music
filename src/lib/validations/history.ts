import { z } from "zod";
import { zTrackSnapshot } from "@/src/lib/validations/common";

export const historyCreateBodySchema = z
  .object({
    track: zTrackSnapshot,
    playedAt: z.string().datetime().optional(),
  })
  .strict();

export const historyQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(200).default(50),
  })
  .strict();


import { z } from "zod";
import { zTrackSnapshot } from "@/src/lib/validations/common";

export const favoriteCreateBodySchema = z
  .object({
    track: zTrackSnapshot,
  })
  .strict();

export const favoriteTrackParamsSchema = z
  .object({
    trackId: z.string().min(1),
  })
  .strict();


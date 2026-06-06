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

export const favoriteUpdateBodySchema = z
  .object({
    friendlyName: z.string().trim().max(160).nullable(),
  })
  .strict();

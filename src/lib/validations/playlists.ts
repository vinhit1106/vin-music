import { z } from "zod";
import { zNonEmptyString, zTrackSnapshot, zUuid } from "./common";

export const playlistCreateBodySchema = z
  .object({
    name: zNonEmptyString.max(120),
    description: z.string().trim().max(500).optional(),
  })
  .strict();

export const playlistUpdateBodySchema = z
  .object({
    name: zNonEmptyString.max(120).optional(),
    description: z.string().trim().max(500).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update." });

export const playlistIdParamsSchema = z.object({ id: zUuid }).strict();

export const playlistAddTrackBodySchema = z
  .object({
    track: zTrackSnapshot,
    position: z.number().int().min(0).optional(),
  })
  .strict();

export const playlistTrackParamsSchema = z
  .object({
    id: zUuid,
    trackId: z.string().min(1),
  })
  .strict();


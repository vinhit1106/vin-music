import { z } from "zod";

export const zUuid = z.string().uuid();

export const zOptionalString = z.string().trim().optional();

export const zNonEmptyString = z.string().trim().min(1);

export const zTrackStats = z.object({
  play_count: z.number().int().nonnegative(),
  digg_count: z.number().int().nonnegative(),
  collect_count: z.number().int().nonnegative(),
  comment_count: z.number().int().nonnegative(),
  share_count: z.number().int().nonnegative(),
  video_count: z.number().int().nonnegative(),
  music_score: z.number().nonnegative(),
});

export const zTrackSnapshot = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    artist: z.string().min(1),
    audioUrl: z.string().url(),
    coverUrl: z.string().url().optional(),
    duration: z.number().int().nonnegative(),
    original: z.boolean(),
    stats: zTrackStats.optional(),
  })
  .strict();


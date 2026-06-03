import { z } from "zod";

export const tikwmMusicInfoSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().catch(""),
    author: z.string().catch(""),
    play: z.string().url().catch(""),
    duration: z.number().int().nonnegative().catch(0),
    cover: z.string().url().optional(),
    video_count: z.number().int().nonnegative().optional(),
  })
  .passthrough();

/**
 * Schema for a single video in a TikWM search response.
 * All engagement stats are coerced and default to 0 to ensure
 * the normalization layer never drops or discards them.
 */
export const tikwmSearchVideoSchema = z
  .object({
    music_info: tikwmMusicInfoSchema,
    // Engagement stats at the video level — must all be preserved
    play_count: z.coerce.number().nonnegative().catch(0),
    digg_count: z.coerce.number().nonnegative().catch(0),
    collect_count: z.coerce.number().nonnegative().catch(0),
    comment_count: z.coerce.number().nonnegative().catch(0),
    share_count: z.coerce.number().nonnegative().catch(0),
  })
  .passthrough();

export const tikwmSearchResponseSchema = z
  .object({
    code: z.number().optional(),
    msg: z.string().optional(),
    data: z
      .object({
        videos: z.array(tikwmSearchVideoSchema).default([]),
      })
      .passthrough(),
  })
  .passthrough();

export const tikwmMusicInfoResponseSchema = z
  .object({
    code: z.number().optional(),
    msg: z.string().optional(),
    data: tikwmMusicInfoSchema.optional(),
  })
  .passthrough();

export type TikwmMusicInfo = z.infer<typeof tikwmMusicInfoSchema>;
export type TikwmSearchVideo = z.infer<typeof tikwmSearchVideoSchema>;
export type TikwmSearchResponse = z.infer<typeof tikwmSearchResponseSchema>;
export type TikwmMusicInfoResponse = z.infer<
  typeof tikwmMusicInfoResponseSchema
>;

/**
 * Schema for TikWM video import (POST /api/ with a TikTok video URL).
 * The video data contains a music_info object with sound metadata.
 */
export const tikwmVideoImportResponseSchema = z
  .object({
    code: z.number().optional(),
    msg: z.string().optional(),
    data: z
      .object({
        id: z.string().optional(),
        music_info: tikwmMusicInfoSchema.optional(),
        play_count: z.coerce.number().nonnegative().catch(0),
        digg_count: z.coerce.number().nonnegative().catch(0),
        collect_count: z.coerce.number().nonnegative().catch(0),
        comment_count: z.coerce.number().nonnegative().catch(0),
        share_count: z.coerce.number().nonnegative().catch(0),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

/** A single video returned by /api/music/posts (videos using a sound). */
export const tikwmMusicPostsVideoSchema = z
  .object({
    id: z.string(),
    title: z.string().catch(""),
    cover: z.string().catch(""),
    play_url: z.string().optional(),
    author: z
      .object({ nickname: z.string().catch(""), unique_id: z.string().catch("") })
      .passthrough()
      .optional(),
    play_count: z.coerce.number().nonnegative().catch(0),
    digg_count: z.coerce.number().nonnegative().catch(0),
  })
  .passthrough();

/** Schema for TikWM /api/music/posts response. */
export const tikwmMusicPostsResponseSchema = z
  .object({
    code: z.number().optional(),
    msg: z.string().optional(),
    data: z
      .object({
        videos: z.array(tikwmMusicPostsVideoSchema).default([]),
        cursor: z.coerce.number().optional(),
        has_more: z.union([z.boolean(), z.number()]).optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type TikwmVideoImportResponse = z.infer<
  typeof tikwmVideoImportResponseSchema
>;
export type TikwmMusicPostsVideo = z.infer<typeof tikwmMusicPostsVideoSchema>;
export type TikwmMusicPostsResponse = z.infer<
  typeof tikwmMusicPostsResponseSchema
>;

/** All engagement stats from a TikTok video — all fields guaranteed, defaults to 0. */
export type TikwmVideoStats = {
  play_count: number;
  digg_count: number;
  collect_count: number;
  comment_count: number;
  share_count: number;
  /** From music_info.video_count — number of TikTok videos using this sound. */
  video_count: number;
};

/** A search-result track with its full stats bundle. */
export type TikwmSearchTrack = {
  track: {
    id: string;
    title: string;
    author: string;
    audioUrl: string;
    duration: number;
    original: boolean;
  };
  stats: TikwmVideoStats;
};

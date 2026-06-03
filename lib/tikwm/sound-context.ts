/**
 * Sound Context Engine
 *
 * Fetches full sound metadata + paginated list of TikTok videos using that sound.
 * This powers the TikTok-style sound page (/app/music/[id]).
 *
 * API calls made (max 2 per request):
 *   1. POST /api/music/info   → sound metadata (SoundEntity)
 *   2. POST /api/music/posts  → videos using that sound (SoundVideo[])
 *
 * No N+1 enrichment — both calls are parallel.
 */

import { ApiError } from "@/src/lib/api/errors";
import { tikwmPostJson } from "@/src/lib/tikwm/client";
import {
  tikwmMusicInfoResponseSchema,
  tikwmMusicPostsResponseSchema,
} from "@/src/lib/tikwm/types";
import type {
  SoundEntity,
  SoundVideo,
  SoundContextPage,
} from "@/src/lib/tikwm/sound-entity";

// ---------------------------------------------------------------------------
// Sound metadata fetch
// ---------------------------------------------------------------------------

async function fetchSoundEntity(musicId: string): Promise<SoundEntity> {
  // TikWM accepts canonical TikTok music URLs for /api/music/info
  const musicUrl = `https://www.tiktok.com/music/-${musicId}`;

  const json = await tikwmPostJson({
    path: "/api/music/info",
    body: { url: musicUrl },
  });

  const parsed = tikwmMusicInfoResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError({
      code: "UPSTREAM_ERROR",
      message: "TikWM music info response was unexpected.",
      status: 502,
      details: parsed.error.flatten(),
    });
  }

  const info = parsed.data.data;
  if (!info?.id || !info.play) {
    throw new ApiError({
      code: "NOT_FOUND",
      message: "Sound not found.",
      status: 404,
    });
  }

  return {
    music_id: info.id,
    title: info.title || "Untitled",
    author: info.author || "Unknown",
    play: info.play,
    cover: info.cover ?? "",
    duration: info.duration,
    video_count: info.video_count ?? 0,
    enriched: true,
  };
}

// ---------------------------------------------------------------------------
// Videos using sound fetch
// ---------------------------------------------------------------------------

function toCursor(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.trunc(value);
  }
  return null;
}

function toHasMore(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  return false;
}

async function fetchSoundVideos(args: {
  musicId: string;
  count: number;
  cursor: number;
}): Promise<{ videos: SoundVideo[]; nextCursor: number | null; hasMore: boolean }> {
  const json = await tikwmPostJson({
    path: "/api/music/posts",
    body: {
      music_id: args.musicId,
      count: args.count,
      cursor: args.cursor,
      web: 1,
      hd: 1,
    },
  });

  const parsed = tikwmMusicPostsResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError({
      code: "UPSTREAM_ERROR",
      message: "TikWM music posts response was unexpected.",
      status: 502,
      details: parsed.error.flatten(),
    });
  }

  const data = parsed.data.data;
  const rawVideos = data?.videos ?? [];

  const videos: SoundVideo[] = rawVideos
    .filter((v) => Boolean(v.id))
    .map((v) => ({
      id: v.id,
      title: v.title || "Untitled",
      cover: v.cover || "",
      author: v.author?.nickname || "Unknown",
      play_count: v.play_count,
      digg_count: v.digg_count,
    }));

  const candidateCursor = toCursor(data?.cursor ?? null);
  const hasMore = toHasMore(data?.has_more ?? false);

  return {
    videos,
    nextCursor: hasMore ? candidateCursor : null,
    hasMore: hasMore && candidateCursor !== null,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch the full sound context page for a given music ID.
 * Runs sound metadata + video list fetches in parallel.
 */
export async function getSoundContext(args: {
  musicId: string;
  count?: number;
  cursor?: number;
}): Promise<SoundContextPage> {
  const count = args.count ?? 12;
  const cursor = args.cursor ?? 0;

  const [sound, postsResult] = await Promise.all([
    fetchSoundEntity(args.musicId),
    fetchSoundVideos({ musicId: args.musicId, count, cursor }),
  ]);

  return {
    sound,
    videos: postsResult.videos,
    nextCursor: postsResult.nextCursor,
    hasMore: postsResult.hasMore,
  };
}

/**
 * Fetch ONLY the sound metadata (no video list).
 * Used for quick sound header rendering.
 */
export async function getSoundEntity(musicId: string): Promise<SoundEntity> {
  return fetchSoundEntity(musicId);
}

/**
 * Fetch paginated videos using a sound.
 * Used for infinite scroll on the sound context page.
 */
export async function getSoundVideos(args: {
  musicId: string;
  count?: number;
  cursor?: number;
}): Promise<{ videos: SoundVideo[]; nextCursor: number | null; hasMore: boolean }> {
  return fetchSoundVideos({
    musicId: args.musicId,
    count: args.count ?? 12,
    cursor: args.cursor ?? 0,
  });
}

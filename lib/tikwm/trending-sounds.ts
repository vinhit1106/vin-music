/**
 * Trending Sounds Engine
 *
 * Aggregates TikWM feed/search results into a deduplicated, scored list
 * of trending sounds. The only API call is feed/search — NO per-track
 * enrichment, NO N+1 calls.
 *
 * Trending score formula (as specified):
 *   score = play_count * 1 + digg_count * 2 + share_count * 3 + comment_count * 2
 *
 * Output is cached for 5 minutes per region via Next.js unstable_cache.
 */

import { unstable_cache } from "next/cache";
import { ApiError } from "@/src/lib/api/errors";
import { tikwmPostJson } from "@/src/lib/tikwm/client";
import { tikwmSearchResponseSchema } from "@/src/lib/tikwm/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TrendingSound {
  music_id: string;
  title: string;
  author: string;
  audioUrl: string;
  cover: string;
  duration: number;
  video_count: number;
  trending_score: number;
  /** Aggregated across all videos in the search result using this sound */
  total_plays: number;
  total_diggs: number;
  total_shares: number;
  total_comments: number;
}

export interface TrendingSoundsPage {
  sounds: TrendingSound[];
  region: string;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function computeTrendingScore(stats: {
  play_count: number;
  digg_count: number;
  share_count: number;
  comment_count: number;
}): number {
  return (
    stats.play_count * 1 +
    stats.digg_count * 2 +
    stats.share_count * 3 +
    stats.comment_count * 2
  );
}

// ---------------------------------------------------------------------------
// Region keyword mapping
// ---------------------------------------------------------------------------

const REGION_KEYWORDS: Record<string, string> = {
  VN: "trending vietnam",
  US: "trending usa",
  KR: "trending kpop",
  JP: "trending japan",
  TH: "trending thailand",
  GB: "trending uk",
};

function getKeywordForRegion(region: string): string {
  return REGION_KEYWORDS[region.toUpperCase()] ?? `trending ${region}`;
}

// ---------------------------------------------------------------------------
// Core aggregation
// ---------------------------------------------------------------------------

type AggregatedSound = {
  music_id: string;
  title: string;
  author: string;
  audioUrl: string;
  cover: string;
  duration: number;
  video_count: number;
  total_plays: number;
  total_diggs: number;
  total_shares: number;
  total_comments: number;
};

async function aggregateTrendingSounds(args: {
  region: string;
  count: number;
  /** 0-based page index — maps to a cursor offset so each page returns different sounds */
  page: number;
}): Promise<TrendingSoundsPage> {
  const keywords = getKeywordForRegion(args.region);
  const pageSize = Math.max(args.count * 3, 30);
  // Offset the cursor so page 0 → rows 0-29, page 1 → rows 30-59, etc.
  const cursor = args.page * pageSize;

  const json = await tikwmPostJson({
    path: "/api/feed/search",
    body: {
      keywords,
      count: pageSize,
      cursor,
      region: args.region,
      web: 1,
      hd: 1,
    },
  });

  const parsed = tikwmSearchResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError({
      code: "UPSTREAM_ERROR",
      message: "TikWM trending search response was unexpected.",
      status: 502,
      details: parsed.error.flatten(),
    });
  }

  const videos = parsed.data.data?.videos ?? [];

  // Aggregate stats by music_id — group all videos sharing the same sound
  const soundMap = new Map<string, AggregatedSound>();

  for (const video of videos) {
    const musicInfo = video.music_info;
    if (!musicInfo?.id || !musicInfo.play) continue;

    const musicId = musicInfo.id;
    const existing = soundMap.get(musicId);

    const playCount = Number(video.play_count) || 0;
    const diggCount = Number(video.digg_count) || 0;
    const shareCount = Number((video as Record<string, unknown>).share_count) || 0;
    const commentCount = Number((video as Record<string, unknown>).comment_count) || 0;

    if (existing) {
      // Accumulate stats from additional videos using the same sound
      existing.total_plays += playCount;
      existing.total_diggs += diggCount;
      existing.total_shares += shareCount;
      existing.total_comments += commentCount;
      // Keep the higher video_count (authoritative from music_info)
      if ((musicInfo.video_count ?? 0) > existing.video_count) {
        existing.video_count = musicInfo.video_count ?? 0;
      }
    } else {
      soundMap.set(musicId, {
        music_id: musicId,
        title: musicInfo.title || "Untitled",
        author: musicInfo.author || "Unknown",
        audioUrl: musicInfo.play,
        cover: musicInfo.cover ?? "",
        duration: musicInfo.duration,
        video_count: musicInfo.video_count ?? 0,
        total_plays: playCount,
        total_diggs: diggCount,
        total_shares: shareCount,
        total_comments: commentCount,
      });
    }
  }

  // Compute trending score and sort
  const sounds: TrendingSound[] = Array.from(soundMap.values())
    .map((s) => ({
      ...s,
      trending_score: computeTrendingScore({
        play_count: s.total_plays,
        digg_count: s.total_diggs,
        share_count: s.total_shares,
        comment_count: s.total_comments,
      }),
    }))
    .sort((a, b) => b.trending_score - a.trending_score)
    .slice(0, args.count);

  return {
    sounds,
    region: args.region,
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Cached public API — 5 min cache per region+count
// ---------------------------------------------------------------------------

const cachedGetTrendingSounds = unstable_cache(
  async (args: { region: string; count: number; page: number }) =>
    aggregateTrendingSounds(args),
  // Bumped to v2: cache key shape changed (page param added)
  ["tikwm-trending-sounds-v2"],
  { revalidate: 300 }, // 5 minutes per {region, count, page} combination
);

export async function getTrendingSounds(args: {
  region?: string;
  count?: number;
  /** Page offset (0–4). Each page fetches a different cursor window from TikWM. */
  page?: number;
  /** Bypass the 5-minute server cache for explicit user refreshes. */
  fresh?: boolean;
}): Promise<TrendingSoundsPage> {
  const query = {
    region: args.region ?? "VN",
    count: Math.min(args.count ?? 12, 30),
    // Clamp to 0–4 to prevent unbounded cursor growth
    page: Math.max(0, Math.min(args.page ?? 0, 4)),
  };

  if (args.fresh) {
    return aggregateTrendingSounds(query);
  }

  return cachedGetTrendingSounds(query);
}

import type { TrackStats } from "../../../src/lib/tracks/types";

/**
 * Weighted engagement score used to rank tracks during deduplication.
 *   play_count   × 1.0
 *   digg_count   × 1.5
 *   collect_count × 2.0
 *   share_count  × 2.5
 */
export function calculateTrackScore(stats: {
  play_count: number;
  digg_count: number;
  collect_count: number;
  share_count: number;
}): number {
  return (
    stats.play_count * 1 +
    stats.digg_count * 1.5 +
    stats.collect_count * 2 +
    stats.share_count * 2.5
  );
}

/**
 * Build a complete TrackStats object with all fields defaulted to 0 and
 * music_score computed from the provided values.
 */
export function buildTrackStats(raw: {
  play_count?: number;
  digg_count?: number;
  collect_count?: number;
  comment_count?: number;
  share_count?: number;
  video_count?: number;
}): TrackStats {
  const play_count = raw.play_count ?? 0;
  const digg_count = raw.digg_count ?? 0;
  const collect_count = raw.collect_count ?? 0;
  const comment_count = raw.comment_count ?? 0;
  const share_count = raw.share_count ?? 0;
  const video_count = raw.video_count ?? 0;

  return {
    play_count,
    digg_count,
    collect_count,
    comment_count,
    share_count,
    video_count,
    music_score: calculateTrackScore({
      play_count,
      digg_count,
      collect_count,
      share_count,
    }),
  };
}
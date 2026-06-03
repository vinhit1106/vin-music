import type { TrackSnapshot } from "../../../src/lib/tracks/types";
import type { TikwmSearchVideo } from "../../../src/lib/tikwm/types";
import { calculateTrackScore, buildTrackStats } from "./scoring";
import { mapTikwmMusicInfoToBaseTrack } from "../../../src/lib/tikwm/mapper";

/**
 * Deduplicate TikWM search results by music_info.id (canonical track ID),
 * keeping the highest scoring representation.
 *
 * Stats are PRESERVED in the output — they are not discarded after scoring.
 * video_count is sourced from music_info.video_count (the canonical count of
 * TikTok videos using this sound).
 *
 * @param videos Raw video objects from TikWM API (validated by tikwmSearchVideoSchema)
 * @returns Deduplicated TrackSnapshot array with stats populated
 */
export function deduplicateTikwmSearchResults(
  videos: TikwmSearchVideo[],
): TrackSnapshot[] {
  // Map videos to track snapshots with stats attached for both scoring and UI
  const tracksWithScore: Array<{ snapshot: TrackSnapshot; score: number }> =
    videos
      .map((video) => {
        const musicInfo = video.music_info;
        if (!musicInfo?.id || !musicInfo.play) return null;

        const baseTrack = mapTikwmMusicInfoToBaseTrack(musicInfo);

        // Build the full stats object — all fields defaulted to 0, never dropped
        const stats = buildTrackStats({
          play_count: Number(video.play_count) || 0,
          digg_count: Number(video.digg_count) || 0,
          collect_count: Number(video.collect_count) || 0,
          comment_count: Number(video.comment_count) || 0,
          share_count: Number(video.share_count) || 0,
          // video_count comes from music_info (how many videos use this sound)
          video_count: Number(musicInfo.video_count) || 0,
        });

        const score = calculateTrackScore(stats);

        const snapshot: TrackSnapshot = {
          ...baseTrack,
          coverUrl: musicInfo.cover,
          videoCount: musicInfo.video_count,
          stats,
        };

        return { snapshot, score };
      })
      .filter(
        (item): item is { snapshot: TrackSnapshot; score: number } =>
          item !== null,
      );

  // Deduplicate by track ID, keeping the highest scoring version
  const dedupedMap = new Map<
    string,
    { snapshot: TrackSnapshot; score: number }
  >();

  for (const { snapshot, score } of tracksWithScore) {
    const existing = dedupedMap.get(snapshot.id);
    if (!existing || score > existing.score) {
      dedupedMap.set(snapshot.id, { snapshot, score });
    }
  }

  // Return deduplicated snapshots (stats intact)
  return Array.from(dedupedMap.values()).map((item) => item.snapshot);
}

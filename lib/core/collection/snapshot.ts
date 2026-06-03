import { BaseTrack } from "../../../src/lib/tracks/types";
import { getOrRefreshTrackMetadata } from "../metadata/metadata.service";
import type { EnrichedTrackMetadata, TrackSnapshot } from "../../../src/lib/tracks/types";

/**
 * Ensures a track has a full snapshot (metadata enriched) by fetching metadata if needed.
 * This function should be called before saving a track to favorites, playlists, or history.
 *
 * @param baseTrack The base track (without metadata)
 * @returns A promise that resolves to a TrackSnapshot (base track + metadata)
 */
export async function ensureTrackSnapshot(
  baseTrack: BaseTrack
): Promise<TrackSnapshot> {
  const metadata = await getOrRefreshTrackMetadata(baseTrack.id).catch(() => ({} as EnrichedTrackMetadata));
  const rawTrack = baseTrack as BaseTrack & { coverUrl?: string; videoCount?: number };

  return {
    ...baseTrack,
    coverUrl: metadata.coverUrl || rawTrack.coverUrl || undefined,
    videoCount: metadata.videoCount !== undefined ? metadata.videoCount : rawTrack.videoCount,
  };
}
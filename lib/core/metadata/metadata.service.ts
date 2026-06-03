import { getCachedMetadataRow, setCachedMetadata } from "./cache";
import { fetchTikwmMetadata } from "./tikwm";
import type { EnrichedTrackMetadata } from "../../../src/lib/tracks/types";

const METADATA_TTL_MS = 24 * 60 * 60 * 1000;

function isFresh(updatedAt: string): boolean {
  const ts = Date.parse(updatedAt);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < METADATA_TTL_MS;
}

/**
 * Get track metadata, using cache if fresh, otherwise fetching from TikWM and caching the result.
 */
export async function getOrRefreshTrackMetadata(
  trackId: string
): Promise<EnrichedTrackMetadata> {
  // 1. Check cache and validate freshness
  const cachedRow = await getCachedMetadataRow(trackId);
  if (cachedRow && isFresh(cachedRow.updated_at)) {
    return {
      coverUrl: cachedRow.cover_url ?? undefined,
      videoCount: cachedRow.video_count ?? undefined,
    };
  }

  // 2. Fetch from TikWM
  const metadata = await fetchTikwmMetadata(trackId);

  // 3. Cache the result
  await setCachedMetadata(trackId, metadata);

  return metadata;
}
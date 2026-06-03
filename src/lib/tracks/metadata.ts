import { getTikwmMusicInfo } from "@/src/lib/tikwm/music";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { throwSupabase } from "@/src/lib/supabase/errors";
import type {
  BaseTrack,
  EnrichedTrackMetadata,
  TrackSnapshot,
} from "@/src/lib/tracks/types";

type TrackMetadataRow = {
  id: string;
  cover_url: string | null;
  video_count: number | null;
  updated_at: string;
};

const METADATA_TTL_MS = 24 * 60 * 60 * 1000;

function isFresh(updatedAt: string): boolean {
  const ts = Date.parse(updatedAt);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < METADATA_TTL_MS;
}

function toMetadata(row: TrackMetadataRow): EnrichedTrackMetadata {
  return {
    coverUrl: row.cover_url ?? undefined,
    videoCount: row.video_count ?? undefined,
  };
}

function toMusicInfoUrl(trackId: string): string {
  // TikWM accepts canonical TikTok music URLs for /api/music/info requests.
  return `https://www.tiktok.com/music/-${trackId}`;
}

export async function getOrRefreshTrackMetadata(
  trackId: string,
): Promise<EnrichedTrackMetadata> {
  const supabase = await createSupabaseServerClient();

  const { data: cached, error: selectError } = await supabase
    .from("track_metadata")
    .select("id,cover_url,video_count,updated_at")
    .eq("id", trackId)
    .maybeSingle<TrackMetadataRow>();
  throwSupabase(selectError);

  if (cached && isFresh(cached.updated_at)) {
    return toMetadata(cached);
  }

  const upstream = await getTikwmMusicInfo(toMusicInfoUrl(trackId));
  const metadata: EnrichedTrackMetadata = {
    coverUrl: upstream.coverUrl,
    videoCount: upstream.videoCount,
  };

  const { error: upsertError } = await supabase.from("track_metadata").upsert(
    {
      id: trackId,
      cover_url: metadata.coverUrl ?? null,
      video_count: metadata.videoCount ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  throwSupabase(upsertError);

  return metadata;
}

export async function ensureTrackSnapshot(
  baseTrack: BaseTrack,
): Promise<TrackSnapshot> {
  const metadata = await getOrRefreshTrackMetadata(baseTrack.id).catch(() => ({} as EnrichedTrackMetadata));
  const rawTrack = baseTrack as BaseTrack & { coverUrl?: string; videoCount?: number };

  return {
    ...baseTrack,
    coverUrl: metadata.coverUrl || rawTrack.coverUrl || undefined,
    videoCount: metadata.videoCount !== undefined ? metadata.videoCount : rawTrack.videoCount,
  };
}

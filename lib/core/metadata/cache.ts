import { createSupabaseServerClient } from "../../../src/lib/supabase/server";
import { throwSupabase } from "../../../src/lib/supabase/errors";
import type { EnrichedTrackMetadata } from "../../../src/lib/tracks/types";

export type TrackMetadataRow = {
  id: string;
  cover_url: string | null;
  video_count: number | null;
  updated_at: string;
};

export async function getCachedMetadataRow(
  trackId: string
): Promise<TrackMetadataRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("track_metadata")
    .select("id,cover_url,video_count,updated_at")
    .eq("id", trackId)
    .maybeSingle<TrackMetadataRow>();

  throwSupabase(error);

  return data ?? null;
}

export async function getCachedMetadata(
  trackId: string
): Promise<EnrichedTrackMetadata | null> {
  const row = await getCachedMetadataRow(trackId);
  if (!row) {
    return null;
  }

  return {
    coverUrl: row.cover_url ?? undefined,
    videoCount: row.video_count ?? undefined,
  };
}

export async function setCachedMetadata(
  trackId: string,
  metadata: EnrichedTrackMetadata
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("track_metadata").upsert(
    {
      id: trackId,
      cover_url: metadata.coverUrl ?? null,
      video_count: metadata.videoCount ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  throwSupabase(error);
}
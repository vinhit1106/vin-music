import { errorResponse, successResponse } from "@/src/lib/api/response";
import { ApiError } from "@/src/lib/api/errors";
import { requireUser } from "@/src/lib/supabase/auth";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { throwSupabase } from "@/src/lib/supabase/errors";
import { ensureTrackSnapshot } from "@/lib/core/collection/snapshot";
import {
  playlistAddTrackBodySchema,
  playlistIdParamsSchema,
} from "@/src/lib/validations/playlists";

type PlaylistTrackRow = {
  id: string;
  playlist_id: string;
  track_id: string;
  track_data: unknown;
  position: number;
  created_at: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();
    const { id: playlistId } = playlistIdParamsSchema.parse(await context.params);
    const body = playlistAddTrackBodySchema.parse(await request.json());
    const enrichedTrack = await ensureTrackSnapshot(body.track);

    // Ensure the playlist belongs to the user (extra safety; RLS also enforces this).
    const { data: playlist, error: playlistError } = await supabase
      .from("playlists")
      .select("id")
      .eq("id", playlistId)
      .eq("user_id", user.id)
      .single();

    if (playlistError?.code === "PGRST116" || !playlist) {
      throw new ApiError({
        code: "NOT_FOUND",
        message: "Playlist not found.",
        status: 404,
      });
    }
    throwSupabase(playlistError);

    let position = body.position;
    if (typeof position === "undefined") {
      const { data: last, error: lastError } = await supabase
        .from("playlist_tracks")
        .select("position")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: false })
        .limit(1);
      throwSupabase(lastError);

      const lastPos = last?.[0]?.position;
      position = typeof lastPos === "number" ? lastPos + 1 : 0;
    }

    // Use upsert with ignoreDuplicates to handle idempotency without throwing 23505
    const { data: upsertData, error: upsertError } = await supabase
      .from("playlist_tracks")
      .upsert(
        {
          playlist_id: playlistId,
          track_id: enrichedTrack.id,
          track_data: enrichedTrack,
          position,
        },
        { onConflict: "playlist_id,track_id", ignoreDuplicates: true }
      )
      .select("id,playlist_id,track_id,track_data,position,created_at");

    throwSupabase(upsertError);

    let trackRow: PlaylistTrackRow | null = null;
    let duplicated = false;

    if (Array.isArray(upsertData) && upsertData.length > 0) {
      // New row was inserted
      trackRow = upsertData[0];
      duplicated = false;
    } else {
      // Duplicate: fetch the existing row
      const { data: existingData, error: existingError } = await supabase
        .from("playlist_tracks")
        .select("id,playlist_id,track_id,track_data,position,created_at")
        .eq("playlist_id", playlistId)
        .eq("track_id", enrichedTrack.id)
        .single();

      throwSupabase(existingError);
      trackRow = existingData;
      duplicated = true;
    }

    return successResponse(
      {
        ...trackRow,
        duplicated,
      },
      { status: duplicated ? 200 : 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
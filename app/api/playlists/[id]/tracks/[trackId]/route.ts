import { errorResponse, successResponse } from "@/src/lib/api/response";
import { ApiError } from "@/src/lib/api/errors";
import { requireUser } from "@/src/lib/supabase/auth";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { throwSupabase } from "@/src/lib/supabase/errors";
import {
  playlistTrackParamsSchema,
  playlistTrackUpdateBodySchema,
} from "@/src/lib/validations/playlists";

type PlaylistTrackData = Record<string, unknown> & {
  friendlyName?: string | null;
};

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; trackId: string }> },
): Promise<Response> {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();
    const { id: playlistId, trackId } = playlistTrackParamsSchema.parse(
      await context.params,
    );

    // Ensure the playlist belongs to the user.
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

    const { error } = await supabase
      .from("playlist_tracks")
      .delete()
      .eq("playlist_id", playlistId)
      .eq("track_id", trackId);

    throwSupabase(error);
    return successResponse({ playlistId, trackId });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; trackId: string }> },
): Promise<Response> {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();
    const { id: playlistId, trackId } = playlistTrackParamsSchema.parse(
      await context.params,
    );
    const body = playlistTrackUpdateBodySchema.parse(await request.json());

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

    const { data: existing, error: selectError } = await supabase
      .from("playlist_tracks")
      .select("track_data")
      .eq("playlist_id", playlistId)
      .eq("track_id", trackId)
      .single();

    throwSupabase(selectError);

    const currentTrackData =
      existing?.track_data && typeof existing.track_data === "object"
        ? (existing.track_data as PlaylistTrackData)
        : {};
    const friendlyName = body.friendlyName?.trim() || null;

    const { data, error } = await supabase
      .from("playlist_tracks")
      .update({
        track_data: {
          ...currentTrackData,
          friendlyName,
        },
      })
      .eq("playlist_id", playlistId)
      .eq("track_id", trackId)
      .select("id,playlist_id,track_id,track_data,position,created_at")
      .single();

    throwSupabase(error);
    return successResponse(data);
  } catch (error) {
    return errorResponse(error);
  }
}

import { errorResponse, successResponse } from "@/src/lib/api/response";
import { ApiError } from "@/src/lib/api/errors";
import { requireUser } from "@/src/lib/supabase/auth";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { throwSupabase } from "@/src/lib/supabase/errors";
import { playlistTrackParamsSchema } from "@/src/lib/validations/playlists";

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


import { errorResponse, successResponse } from "@/src/lib/api/response";
import { ApiError } from "@/src/lib/api/errors";
import { requireUser } from "@/src/lib/supabase/auth";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { throwSupabase } from "@/src/lib/supabase/errors";
import {
  playlistIdParamsSchema,
  playlistUpdateBodySchema,
} from "@/src/lib/validations/playlists";

type PlaylistRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

type PlaylistTrackRow = {
  id: string;
  playlist_id: string;
  track_id: string;
  track_data: unknown;
  position: number;
  created_at: string;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();
    const { id } = playlistIdParamsSchema.parse(await context.params);

    const { data: playlist, error: playlistError } = await supabase
      .from("playlists")
      .select("id,user_id,name,description,created_at,updated_at")
      .eq("id", id)
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

    const { data: tracks, error: tracksError } = await supabase
      .from("playlist_tracks")
      .select("id,playlist_id,track_id,track_data,position,created_at")
      .eq("playlist_id", id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });

    throwSupabase(tracksError);

    return successResponse({
      playlist: playlist as PlaylistRow,
      tracks: (tracks ?? []) as PlaylistTrackRow[],
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();
    const { id } = playlistIdParamsSchema.parse(await context.params);
    const body = playlistUpdateBodySchema.parse(await request.json());

    const payload: Partial<Pick<PlaylistRow, "name" | "description" | "updated_at">> =
      {
        updated_at: new Date().toISOString(),
      };
    if (typeof body.name !== "undefined") payload.name = body.name;
    if (typeof body.description !== "undefined")
      payload.description = body.description ?? null;

    const { data, error } = await supabase
      .from("playlists")
      .update(payload)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id,user_id,name,description,created_at,updated_at")
      .single();

    if (error?.code === "PGRST116" || !data) {
      throw new ApiError({
        code: "NOT_FOUND",
        message: "Playlist not found.",
        status: 404,
      });
    }
    throwSupabase(error);

    return successResponse(data as PlaylistRow);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();
    const { id } = playlistIdParamsSchema.parse(await context.params);

    const { error } = await supabase
      .from("playlists")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    throwSupabase(error);
    return successResponse({ id });
  } catch (error) {
    return errorResponse(error);
  }
}


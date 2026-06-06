import { errorResponse, successResponse } from "@/src/lib/api/response";
import { requireUser } from "@/src/lib/supabase/auth";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { throwSupabase } from "@/src/lib/supabase/errors";
import {
  favoriteTrackParamsSchema,
  favoriteUpdateBodySchema,
} from "@/src/lib/validations/favorites";

type FavoriteTrackData = Record<string, unknown> & {
  friendlyName?: string | null;
};

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ trackId: string }> },
): Promise<Response> {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();
    const { trackId } = favoriteTrackParamsSchema.parse(await context.params);

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("track_id", trackId);

    throwSupabase(error);
    return successResponse({ trackId });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ trackId: string }> },
): Promise<Response> {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();
    const { trackId } = favoriteTrackParamsSchema.parse(await context.params);
    const body = favoriteUpdateBodySchema.parse(await request.json());

    const { data: existing, error: selectError } = await supabase
      .from("favorites")
      .select("track_data")
      .eq("user_id", user.id)
      .eq("track_id", trackId)
      .single();

    throwSupabase(selectError);

    const currentTrackData =
      existing?.track_data && typeof existing.track_data === "object"
        ? (existing.track_data as FavoriteTrackData)
        : {};
    const friendlyName = body.friendlyName?.trim() || null;

    const { data, error } = await supabase
      .from("favorites")
      .update({
        track_data: {
          ...currentTrackData,
          friendlyName,
        },
      })
      .eq("user_id", user.id)
      .eq("track_id", trackId)
      .select("id,user_id,track_id,track_data,created_at")
      .single();

    throwSupabase(error);
    return successResponse(data);
  } catch (error) {
    return errorResponse(error);
  }
}

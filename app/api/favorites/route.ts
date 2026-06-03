import { errorResponse, successResponse } from "@/src/lib/api/response";
import { requireUser } from "@/src/lib/supabase/auth";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { throwSupabase } from "@/src/lib/supabase/errors";
import { ensureTrackSnapshot } from "@/lib/core/collection/snapshot";
import { favoriteCreateBodySchema } from "@/src/lib/validations/favorites";

type FavoriteRow = {
  id: string;
  user_id: string;
  track_id: string;
  track_data: unknown;
  created_at: string;
};

export async function GET(): Promise<Response> {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("favorites")
      .select("id,user_id,track_id,track_data,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    throwSupabase(error);
    return successResponse((data ?? []) as FavoriteRow[]);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();
    const body = favoriteCreateBodySchema.parse(await request.json());
    const enrichedTrack = await ensureTrackSnapshot(body.track);
    const { data, error } = await supabase
      .from("favorites")
      .insert({
        user_id: user.id,
        track_id: enrichedTrack.id,
        track_data: enrichedTrack,
      })
      .select("id,user_id,track_id,track_data,created_at")
      .single();

    throwSupabase(error);
    return successResponse(data as FavoriteRow, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

import { errorResponse, successResponse } from "@/src/lib/api/response";
import { requireUser } from "@/src/lib/supabase/auth";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { throwSupabase } from "@/src/lib/supabase/errors";
import { ensureTrackSnapshot } from "@/lib/core/collection/snapshot";
import { historyCreateBodySchema, historyQuerySchema } from "@/src/lib/validations/history";

type RecentlyPlayedRow = {
  id: string;
  user_id: string;
  track_id: string;
  track_data: unknown;
  played_at: string;
};

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();
    const url = new URL(request.url);
    const parsed = historyQuerySchema.parse({
      limit: url.searchParams.get("limit") ?? undefined,
    });

    const { data, error } = await supabase
      .from("recently_played")
      .select("id,user_id,track_id,track_data,played_at")
      .eq("user_id", user.id)
      .order("played_at", { ascending: false })
      .limit(parsed.limit);

    throwSupabase(error);
    return successResponse((data ?? []) as RecentlyPlayedRow[]);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();
    const body = historyCreateBodySchema.parse(await request.json());

    const playedAt = body.playedAt ? new Date(body.playedAt) : new Date();
    const enrichedTrack = await ensureTrackSnapshot(body.track);
    const playedAtIso = playedAt.toISOString();

    const { data: latest, error: latestError } = await supabase
      .from("recently_played")
      .select("id,track_id")
      .eq("user_id", user.id)
      .order("played_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    throwSupabase(latestError);

    if (latest?.track_id === enrichedTrack.id) {
      const { data, error } = await supabase
        .from("recently_played")
        .update({
          track_data: enrichedTrack,
          played_at: playedAtIso,
        })
        .eq("id", latest.id)
        .select("id,user_id,track_id,track_data,played_at")
        .single();

      throwSupabase(error);
      return successResponse(data as RecentlyPlayedRow);
    }

    const { data, error } = await supabase
      .from("recently_played")
      .insert({
        user_id: user.id,
        track_id: enrichedTrack.id,
        track_data: enrichedTrack,
        played_at: playedAtIso,
      })
      .select("id,user_id,track_id,track_data,played_at")
      .single();

    throwSupabase(error);
    return successResponse(data as RecentlyPlayedRow, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

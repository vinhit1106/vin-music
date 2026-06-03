import { errorResponse, successResponse } from "@/src/lib/api/response";
import { requireUser } from "@/src/lib/supabase/auth";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { throwSupabase } from "@/src/lib/supabase/errors";
import { playlistCreateBodySchema } from "@/src/lib/validations/playlists";

type PlaylistRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export async function GET(): Promise<Response> {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("playlists")
      .select("id,user_id,name,description,created_at,updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    throwSupabase(error);
    return successResponse((data ?? []) as PlaylistRow[]);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();
    const body = playlistCreateBodySchema.parse(await request.json());

    const { data, error } = await supabase
      .from("playlists")
      .insert({
        user_id: user.id,
        name: body.name,
        description: body.description ?? null,
      })
      .select("id,user_id,name,description,created_at,updated_at")
      .single();

    throwSupabase(error);
    return successResponse(data as PlaylistRow, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}


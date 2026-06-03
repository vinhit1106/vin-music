import { errorResponse, successResponse } from "@/src/lib/api/response";
import { requireUser } from "@/src/lib/supabase/auth";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { throwSupabase } from "@/src/lib/supabase/errors";
import { favoriteTrackParamsSchema } from "@/src/lib/validations/favorites";

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


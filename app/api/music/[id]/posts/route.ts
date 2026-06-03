import { z } from "zod";
import { errorResponse, successResponse } from "@/src/lib/api/response";
import { ApiError } from "@/src/lib/api/errors";
import { getSoundVideos } from "@/lib/tikwm/sound-context";

const querySchema = z.object({
  count: z.coerce.number().int().min(1).max(30).optional().default(12),
  cursor: z.coerce.number().int().min(0).optional().default(0),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await context.params;
    const musicId = id?.trim();
    if (!musicId) {
      throw new ApiError({
        code: "BAD_REQUEST",
        message: "Music id is required.",
        status: 400,
      });
    }

    const url = new URL(request.url);
    const parsed = querySchema.parse({
      count: url.searchParams.get("count") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
    });

    const result = await getSoundVideos({
      musicId,
      count: parsed.count,
      cursor: parsed.cursor,
    });

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

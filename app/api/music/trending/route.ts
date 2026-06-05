import { z } from "zod";
import { errorResponse, successResponse } from "@/src/lib/api/response";
import { getTrendingSounds } from "@/lib/tikwm/trending-sounds";

const querySchema = z.object({
  count: z.coerce.number().int().min(1).max(30).optional().default(12),
  region: z.string().min(2).max(4).toUpperCase().optional().default("VN"),
  /** Page offset: 0–4, each maps to a different cursor window in TikWM */
  page: z.coerce.number().int().min(0).max(4).optional().default(0),
  /** Present only for manual refreshes that should bypass the server cache. */
  refresh: z.string().optional(),
});

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const parsed = querySchema.parse({
      count: url.searchParams.get("count") ?? undefined,
      region: url.searchParams.get("region") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      refresh: url.searchParams.get("refresh") ?? undefined,
    });

    const page = await getTrendingSounds({
      region: parsed.region,
      count: parsed.count,
      page: parsed.page,
      fresh: Boolean(parsed.refresh),
    });

    return successResponse(page);
  } catch (error) {
    return errorResponse(error);
  }
}

import { errorResponse, successResponse } from "@/src/lib/api/response";
import { searchQuerySchema } from "@/src/lib/validations/search";
import { search } from "@/lib/core/search/search.service";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const parsed = searchQuerySchema.parse({
      q: url.searchParams.get("q") ?? "",
      count: url.searchParams.get("count") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
    });

    const page = await search({
      keywords: parsed.q,
      count: parsed.count ?? 10,
      cursor: parsed.cursor ?? 0,
    });

    return successResponse(page);
  } catch (error) {
    return errorResponse(error);
  }
}


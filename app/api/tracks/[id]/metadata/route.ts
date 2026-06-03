import { errorResponse, successResponse } from "@/src/lib/api/response";
import { ApiError } from "@/src/lib/api/errors";
import { getOrRefreshTrackMetadata } from "@/lib/core/metadata/metadata.service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await context.params;
    const trackId = id?.trim();
    if (!trackId) {
      throw new ApiError({
        code: "BAD_REQUEST",
        message: "Track id is required.",
        status: 400,
      });
    }

    const metadata = await getOrRefreshTrackMetadata(trackId);
    return successResponse(metadata);
  } catch (error) {
    return errorResponse(error);
  }
}

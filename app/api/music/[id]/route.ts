import { errorResponse, successResponse } from "@/src/lib/api/response";
import { ApiError } from "@/src/lib/api/errors";
import { getTikwmMusicInfo } from "@/src/lib/tikwm/music";

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

    // Build the canonical TikTok music URL and fetch the full TrackSnapshot
    // from TikWM (includes title, author, audio URL, cover, duration, video_count).
    const musicUrl = `https://www.tiktok.com/music/${trackId}`;
    const track = await getTikwmMusicInfo(musicUrl);

    return successResponse(track);
  } catch (error) {
    return errorResponse(error);
  }
}


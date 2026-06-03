import { ApiError } from "../../../src/lib/api/errors";
import { tikwmPostJson } from "../../../src/lib/tikwm/client";
import { tikwmMusicInfoResponseSchema } from "../../../src/lib/tikwm/types";
import type { EnrichedTrackMetadata } from "../../../src/lib/tracks/types";

export async function fetchTikwmMetadata(
  trackId: string,
): Promise<EnrichedTrackMetadata> {
  // TikWM accepts canonical TikTok music URLs for /api/music/info requests.
  const url = `https://www.tiktok.com/music/${trackId}`;
  const json = await tikwmPostJson({
    path: "/api/music/info",
    body: { url },
  });
  const parsed = tikwmMusicInfoResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError({
      code: "UPSTREAM_ERROR",
      message: "TikWM music info response was unexpected.",
      status: 502,
      details: parsed.error.flatten(),
    });
  }
  const info = parsed.data.data;
  if (!info?.id || !info.play) {
    throw new ApiError({
      code: "NOT_FOUND",
      message: "Music not found.",
      status: 404,
    });
  }

  return {
    coverUrl: info.cover ?? undefined,
    videoCount: info.video_count ?? undefined,
  };
}

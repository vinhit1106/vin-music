import { ApiError } from "@/src/lib/api/errors";
import { tikwmPostJson } from "@/src/lib/tikwm/client";
import { mapTikwmMusicInfoToTrackSnapshot } from "@/src/lib/tikwm/mapper";
import { tikwmMusicInfoResponseSchema } from "@/src/lib/tikwm/types";
import type { TrackSnapshot } from "@/src/lib/tracks/types";

export async function getTikwmMusicInfo(url: string): Promise<TrackSnapshot> {
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

  // Based on TikWM API docs, music info is at data.data, not data.data.music_info
  const info = parsed.data.data;
  if (!info?.id || !info.play) {
    throw new ApiError({
      code: "NOT_FOUND",
      message: "Music not found.",
      status: 404,
    });
  }

  return mapTikwmMusicInfoToTrackSnapshot(info);
}


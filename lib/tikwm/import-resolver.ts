/**
 * Import Link Resolver — detects TikTok URL type and calls the correct TikWM endpoint.
 *
 * VIDEO URL  (/video/)  → POST https://tikwm.com/api/           → light TrackSnapshot
 * MUSIC URL  (/music/)  → POST https://tikwm.com/api/music/info → full SoundEntity
 *
 * Critical: Video flow NEVER triggers enrichment (no extra API calls).
 * The resolved TrackSnapshot is returned immediately to the UI.
 */

import { ApiError } from "@/src/lib/api/errors";
import { tikwmPostJson } from "@/src/lib/tikwm/client";
import {
  tikwmVideoImportResponseSchema,
  tikwmMusicInfoResponseSchema,
} from "@/src/lib/tikwm/types";
import { mapTikwmMusicInfoToTrackSnapshot } from "@/src/lib/tikwm/mapper";
import { buildTrackStats } from "@/lib/core/track/scoring";
import type { ImportResult } from "@/src/lib/tikwm/sound-entity";
import type { SoundEntity } from "@/src/lib/tikwm/sound-entity";

// ---------------------------------------------------------------------------
// URL type detection
// ---------------------------------------------------------------------------

type TikTokUrlType = "video" | "music" | "unknown";

function detectUrlType(url: string): TikTokUrlType {
  if (url.includes("/video/")) return "video";
  if (url.includes("/music/")) return "music";
  return "unknown";
}

// ---------------------------------------------------------------------------
// Video URL flow — calls POST /api/ (video import endpoint)
// Returns a LIGHT TrackSnapshot from music_info — NO enrichment.
// ---------------------------------------------------------------------------

async function resolveVideoUrl(url: string): Promise<ImportResult> {
  const json = await tikwmPostJson({
    path: "/api/",
    body: { url },
  });

  const parsed = tikwmVideoImportResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError({
      code: "UPSTREAM_ERROR",
      message: "TikWM video import response was unexpected.",
      status: 502,
      details: parsed.error.flatten(),
    });
  }

  const videoData = parsed.data.data;
  const musicInfo = videoData?.music_info;
  if (!musicInfo?.id || !musicInfo.play) {
    throw new ApiError({
      code: "NOT_FOUND",
      message:
        "No music found in this video. The video may not have a TikTok sound.",
      status: 404,
    });
  }

  // Map to a light TrackSnapshot — cover + videoCount from music_info if available
  const snapshot = mapTikwmMusicInfoToTrackSnapshot(musicInfo);

  // Set engagement stats on the track snapshot from the video-level data
  if (videoData) {
    snapshot.stats = buildTrackStats({
      play_count: videoData.play_count,
      digg_count: videoData.digg_count,
      collect_count: videoData.collect_count,
      comment_count: videoData.comment_count,
      share_count: videoData.share_count,
      video_count: musicInfo.video_count,
    });
  }

  return { type: "track", data: snapshot };
}

// ---------------------------------------------------------------------------
// Music URL flow — calls POST /api/music/info
// Returns a full SoundEntity with video_count and cover.
// ---------------------------------------------------------------------------

async function resolveMusicUrl(url: string): Promise<ImportResult> {
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
      message: "Music not found for this URL.",
      status: 404,
    });
  }

  const sound: SoundEntity = {
    music_id: info.id,
    title: info.title || "Untitled",
    author: info.author || "Unknown",
    play: info.play,
    cover: info.cover ?? "",
    duration: info.duration,
    video_count: info.video_count ?? 0,
    enriched: true,
  };

  return { type: "sound", data: sound };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolve a TikTok URL (video or music) to an ImportResult.
 *
 * - Video URL → light TrackSnapshot (no enrichment)
 * - Music URL → full SoundEntity
 * - Unknown  → try video first, then music
 */
export async function resolveImportUrl(url: string): Promise<ImportResult> {
  const type = detectUrlType(url);

  if (type === "video") {
    return resolveVideoUrl(url);
  }

  if (type === "music") {
    return resolveMusicUrl(url);
  }

  // Unknown URL shape — try video endpoint first (more common), fall back to music
  try {
    return await resolveVideoUrl(url);
  } catch {
    return resolveMusicUrl(url);
  }
}

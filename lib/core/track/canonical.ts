import type { TikwmSearchVideo } from "@/src/lib/tikwm/types";

export type TrackId = string;

export function getTrackId(video: TikwmSearchVideo): TrackId {
  return video.music_info.id;
}

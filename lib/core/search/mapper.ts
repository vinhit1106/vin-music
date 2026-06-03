import type { BaseTrack } from "../../../src/lib/tracks/types";
import type { TikwmMusicInfo } from "../../../src/lib/tikwm/types";

function inferOriginal(title: string): boolean {
  return /original\s+sound/i.test(title);
}

export function mapTikwmMusicInfoToBaseTrack(info: TikwmMusicInfo): BaseTrack {
  return {
    id: info.id,
    title: info.title || "Untitled",
    artist: info.author || "Unknown",
    audioUrl: info.play,
    duration: info.duration,
    original: inferOriginal(info.title),
  };
}
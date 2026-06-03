import type {
  BaseTrack,
  EnrichedTrackMetadata,
  TrackSnapshot,
} from "../../../src/lib/tracks/types";
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

export function mapTikwmMusicInfoToMetadata(
  info: TikwmMusicInfo,
): EnrichedTrackMetadata {
  return {
    coverUrl: info.cover,
    videoCount: info.video_count,
  };
}

export function mapTikwmMusicInfoToTrackSnapshot(info: TikwmMusicInfo): TrackSnapshot {
  return {
    ...mapTikwmMusicInfoToBaseTrack(info),
    ...mapTikwmMusicInfoToMetadata(info),
  };
}


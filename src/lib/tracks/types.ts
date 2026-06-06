export interface BaseTrack {
  id: string;
  title: string;
  friendlyName?: string | null;
  artist: string;
  audioUrl: string;
  duration: number;
  original: boolean;
}

export interface EnrichedTrackMetadata {
  coverUrl?: string;
  videoCount?: number;
}

/**
 * Engagement stats for a track, sourced from TikTok video-level data.
 * All counts default to 0 when not present in the upstream API.
 * music_score is a computed ranking field derived from weighted engagement counts.
 */
export interface TrackStats {
  play_count: number;
  digg_count: number;
  collect_count: number;
  comment_count: number;
  share_count: number;
  /** Number of TikTok videos using this sound (from music_info.video_count or computed). */
  video_count: number;
  /**
   * Computed ranking score:
   *   play_count * 1 + digg_count * 1.5 + collect_count * 2 + share_count * 2.5
   */
  music_score: number;
}

export type TrackSnapshot = BaseTrack &
  EnrichedTrackMetadata & {
    /** Engagement stats populated during search normalization. */
    stats?: TrackStats;
  };

export type Track = TrackSnapshot;

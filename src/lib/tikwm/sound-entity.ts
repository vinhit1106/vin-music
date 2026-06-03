/**
 * Fully-enriched sound entity — returned by music/info API and stored in cache.
 * Distinct from TrackSnapshot (which is a search result light-weight model).
 */
export interface SoundEntity {
  music_id: string;
  title: string;
  author: string;
  /** Audio stream URL */
  play: string;
  cover: string;
  duration: number;
  /** Total TikTok videos using this sound */
  video_count: number;
  enriched: true;
}

/**
 * A TikTok video that uses a given sound.
 * Returned by the /api/music/posts TikWM endpoint.
 */
export interface SoundVideo {
  id: string;
  title: string;
  cover: string;
  author: string;
  play_count: number;
  digg_count: number;
}

/**
 * Full sound context page — sound metadata + paginated list of videos using that sound.
 */
export interface SoundContextPage {
  sound: SoundEntity;
  videos: SoundVideo[];
  nextCursor: number | null;
  hasMore: boolean;
}

/**
 * Import resolver result union — tells the caller what kind of entity was resolved.
 */
export type ImportResult =
  | { type: "track"; data: import("@/src/lib/tracks/types").TrackSnapshot }
  | { type: "sound"; data: SoundEntity };

/**
 * Engagement stats for the music card UI.
 * All fields are required and default to 0 — never undefined.
 * music_score is a computed ranking field.
 */
export type MusicStats = {
  play_count: number;
  digg_count: number;
  collect_count: number;
  comment_count: number;
  share_count: number;
  /** Number of TikTok videos using this sound. */
  video_count: number;
  /** Computed: play×1 + digg×1.5 + collect×2 + share×2.5 */
  music_score: number;
};

export type MusicCardModel = {
  id: string;
  title: string;
  friendlyName?: string | null;
  author: string;
  duration: number;
  album: string;
  play: string;
  cover: string;
  stats: MusicStats;
};

export type MusicDetailModel = MusicCardModel;


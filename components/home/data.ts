export type PlayUrl = {
  uri: string;
  url_list: string[];
  url_prefix: string | null;
  width: number;
  height: number;
};

export type TikTokTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  moodTags?: string[];
  auditionDuration: number;
  userCount: number;
  playUrl?: PlayUrl;
  avatarUrl: string;
  stats?: {
    play_count?: number;
    digg_count?: number;
    share_count?: number;
    collect_count?: number;
  };
};

import type { Track } from "@/src/lib/tracks/types";
import type { MusicCardModel } from "@/lib/vin-music/types";
import type { SoundEntity, ImportResult } from "@/src/lib/tikwm/sound-entity";

export function trackToMusicCard(track: Track): MusicCardModel {
  return {
    id: track.id,
    title: track.title,
    friendlyName: track.friendlyName ?? null,
    author: track.artist,
    duration: track.duration,
    album: "Single",
    play: track.audioUrl,
    cover: track.coverUrl || "",
    stats: track.stats ?? {
      play_count: 0,
      digg_count: 0,
      collect_count: 0,
      comment_count: 0,
      share_count: 0,
      video_count: track.videoCount ?? 0,
      music_score: 0,
    },
  };
}

export function musicCardToTrackSnapshot(music: MusicCardModel): Track {
  return {
    id: music.id,
    title: music.title,
    friendlyName: music.friendlyName ?? null,
    artist: music.author,
    audioUrl: music.play,
    coverUrl: music.cover || undefined,
    duration: music.duration,
    original: /original\s+sound/i.test(music.title),
    stats: music.stats,
  };
}
/**
 * Map a SoundEntity (from music URL import) to a MusicCardModel.
 * video_count is preserved in stats so the MusicCard can display it.
 */
export function soundEntityToMusicCard(sound: SoundEntity): MusicCardModel {
  return {
    id: sound.music_id,
    title: sound.title,
    author: sound.author,
    duration: sound.duration,
    album: "Single",
    play: sound.play,
    cover: sound.cover,
    stats: {
      play_count: 0,
      digg_count: 0,
      collect_count: 0,
      comment_count: 0,
      share_count: 0,
      video_count: sound.video_count,
      music_score: 0,
    },
  };
}

/**
 * Normalise any ImportResult to a MusicCardModel.
 * This is the single entry point for rendering import results as a MusicCard.
 */
export function importResultToMusicCard(result: ImportResult): MusicCardModel {
  if (result.type === "sound") {
    return soundEntityToMusicCard(result.data);
  }
  return trackToMusicCard(result.data);
}

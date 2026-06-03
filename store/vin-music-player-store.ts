import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { MusicCardModel } from "@/lib/vin-music/types";

export type PlaybackMode =
  | "normal"
  | "repeat-all"
  | "repeat-one"
  | "shuffle"
  | "autoplay-next";

export type PlayerDockMode = "mini" | "expanded" | "hidden";

export type RecentlyPlayedEntry = {
  track: MusicCardModel;
  playedAt: string;
};

type PlayerState = {
  currentTrack: MusicCardModel | null;
  playlist: MusicCardModel[];
  queue: MusicCardModel[];
  isPlaying: boolean;
  dockMode: PlayerDockMode;
  currentTime: number;
  duration: number;
  volume: number;
  playbackMode: PlaybackMode;
  recentlyPlayed: string[];
  recentlyPlayedEntries: RecentlyPlayedEntry[];
  playTrack: (track: MusicCardModel, playlist?: MusicCardModel[]) => void;
  playNextTrack: (track: MusicCardModel) => void;
  addToQueue: (track: MusicCardModel) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  moveQueueItem: (trackId: string, direction: "up" | "down") => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlayback: () => void;
  setPlayback: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setDockMode: (mode: PlayerDockMode) => void;
  toggleDockExpanded: () => void;
  hideDock: () => void;
  showDock: () => void;
  setPlaybackMode: (mode: PlaybackMode) => void;
  markRecentlyPlayed: (id: string) => void;
};

export const useVinMusicPlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      playlist: [],
      queue: [],
      isPlaying: false,
      dockMode: "mini",
      currentTime: 0,
      duration: 0,
      volume: 0.75,
      playbackMode: "normal",
      recentlyPlayed: [],
      recentlyPlayedEntries: [],

      playTrack: (track, playlist) => {
        const state = get();
        const nextPlaylist = playlist ?? (state.playlist.length > 0 ? state.playlist : [track]);
        set({
          currentTrack: track,
          playlist: nextPlaylist,
          isPlaying: true,
          dockMode: state.dockMode === "hidden" ? "mini" : state.dockMode,
          currentTime: 0,
          duration: track.duration,
        });
        get().markRecentlyPlayed(track.id);
      },

      playNextTrack: (track) =>
        set((state) => ({
          queue: [
            track,
            ...state.queue.filter((item) => item.id !== track.id),
          ].slice(0, 100),
        })),

      addToQueue: (track) =>
        set((state) => {
          if (state.queue.some((item) => item.id === track.id)) {
            return state;
          }
          return { queue: [...state.queue, track].slice(0, 100) };
        }),

      removeFromQueue: (trackId) =>
        set((state) => ({
          queue: state.queue.filter((item) => item.id !== trackId),
        })),

      clearQueue: () => set({ queue: [] }),

      moveQueueItem: (trackId, direction) =>
        set((state) => {
          const index = state.queue.findIndex((item) => item.id === trackId);
          if (index < 0) return state;
          const target = direction === "up" ? index - 1 : index + 1;
          if (target < 0 || target >= state.queue.length) return state;
          const queue = [...state.queue];
          const [item] = queue.splice(index, 1);
          if (!item) return state;
          queue.splice(target, 0, item);
          return { queue };
        }),

      playNext: () => {
        const { playlist, currentTrack, playbackMode, queue } = get();
        if (queue.length) {
          const [next, ...rest] = queue;
          set({ queue: rest });
          if (next) {
            get().playTrack(next, playlist.length ? playlist : [next]);
          }
          return;
        }
        if (!playlist.length || !currentTrack) return;

        if (playbackMode === "shuffle" && playlist.length > 1) {
          const pool = playlist.filter((t) => t.id !== currentTrack.id);
          const next = pool[Math.floor(Math.random() * pool.length)] ?? playlist[0];
          get().playTrack(next!, playlist);
          return;
        }

        const idx = playlist.findIndex((t) => t.id === currentTrack.id);
        const nextIdx = (idx + 1) % playlist.length;
        get().playTrack(playlist[nextIdx]!, playlist);
      },

      playPrevious: () => {
        const { playlist, currentTrack } = get();
        if (!playlist.length || !currentTrack) return;
        const idx = playlist.findIndex((t) => t.id === currentTrack.id);
        const prevIdx = idx > 0 ? idx - 1 : playlist.length - 1;
        get().playTrack(playlist[prevIdx]!, playlist);
      },

      togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
      setPlayback: (isPlaying) => set({ isPlaying }),
      setCurrentTime: (currentTime) => set({ currentTime }),
      setDuration: (duration) => set({ duration }),
      seek: (currentTime) => set({ currentTime }),
      setVolume: (volume) => set({ volume }),
      setDockMode: (dockMode) => set({ dockMode }),
      toggleDockExpanded: () =>
        set((state) => ({
          dockMode:
            state.dockMode === "expanded"
              ? "mini"
              : state.dockMode === "mini"
                ? "expanded"
                : "mini",
        })),
      hideDock: () => set({ dockMode: "hidden" }),
      showDock: () => set({ dockMode: "mini" }),
      setPlaybackMode: (playbackMode) => set({ playbackMode }),

      markRecentlyPlayed: (id) =>
        set((state) => {
          const entry =
            state.currentTrack?.id === id
              ? {
                  track: state.currentTrack,
                  playedAt: new Date().toISOString(),
                }
              : null;
          return {
            recentlyPlayed: [
              id,
              ...state.recentlyPlayed.filter((item) => item !== id),
            ].slice(0, 30),
            recentlyPlayedEntries: entry
              ? [
                  entry,
                  ...state.recentlyPlayedEntries.filter(
                    (item) => item.track.id !== id,
                  ),
                ].slice(0, 50)
              : state.recentlyPlayedEntries,
          };
        }),
    }),
    {
      name: "vin-music-player-store",
      partialize: (state) => ({
        recentlyPlayed: state.recentlyPlayed,
        recentlyPlayedEntries: state.recentlyPlayedEntries,
        queue: state.queue,
        volume: state.volume,
        playbackMode: state.playbackMode,
        dockMode: state.dockMode,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.queue = state.queue.filter(
          (track) => Boolean(track?.id && track?.title),
        ).slice(0, 100);
        state.recentlyPlayed = state.recentlyPlayed.filter(Boolean).slice(0, 30);
        state.recentlyPlayedEntries = state.recentlyPlayedEntries
          .filter((entry) => Boolean(entry?.track?.id))
          .slice(0, 50);
        if (state.volume < 0 || state.volume > 1 || Number.isNaN(state.volume)) {
          state.volume = 0.75;
        }
      },
    },
  ),
);

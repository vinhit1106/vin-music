import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";

import type {
  BaseTrack,
  EnrichedTrackMetadata,
  TrackSnapshot,
} from "@/src/lib/tracks/types";
import { apiFetchJson } from "@/src/lib/query/client";
import { queryKeys } from "@/src/lib/query/keys";
import { trackToMusicCard } from "@/src/lib/query/mappers";
import type { MusicCardModel } from "@/lib/vin-music/types";
import type { SoundVideo, ImportResult } from "@/src/lib/tikwm/sound-entity";
import type { TrendingSoundsPage } from "@/lib/tikwm/trending-sounds";

type FavoriteRow = {
  id: string;
  user_id: string;
  track_id: string;
  track_data: TrackSnapshot;
  created_at: string;
};

type PlaylistRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

type PlaylistTrackRow = {
  id: string;
  playlist_id: string;
  track_id: string;
  track_data: TrackSnapshot;
  position: number;
  created_at: string;
};

type PlaylistDetail = {
  playlist: PlaylistRow;
  tracks: PlaylistTrackRow[];
};

type HistoryRow = {
  id: string;
  user_id: string;
  track_id: string;
  track_data: TrackSnapshot;
  played_at: string;
};

export function useSearchTracks(q: string) {
  const trimmed = q.trim();
  return useInfiniteQuery<{
    tracks: MusicCardModel[];
    nextCursor: number | null;
    hasMore: boolean;
  }>({
    queryKey: queryKeys.search(trimmed),
    initialPageParam: 0,
    queryFn: async ({ pageParam, signal }) => {
      if (!trimmed) {
        return {
          tracks: [] as MusicCardModel[],
          nextCursor: null,
          hasMore: false,
        };
      }
      const data = await apiFetchJson<{
        tracks: BaseTrack[];
        nextCursor: number | null;
        hasMore: boolean;
      }>(
        `/api/search?q=${encodeURIComponent(trimmed)}&count=20&cursor=${pageParam}`,
        { method: "GET", signal },
      );

      return {
        tracks: data.tracks.map(trackToMusicCard),
        nextCursor: data.nextCursor,
        hasMore: data.hasMore,
      };
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.nextCursor !== null
        ? lastPage.nextCursor
        : undefined,
    enabled: trimmed.length > 0,
    staleTime: 30_000,
  });
}

export function useFavorites(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.favorites,
    queryFn: () =>
      apiFetchJson<FavoriteRow[]>("/api/favorites", { method: "GET" }),
    enabled: options?.enabled,
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: { track: BaseTrack; isFavorited: boolean }) => {
      if (args.isFavorited) {
        return apiFetchJson<{ trackId: string }>(
          `/api/favorites/${args.track.id}`,
          {
            method: "DELETE",
          },
        );
      }
      return apiFetchJson<FavoriteRow>("/api/favorites", {
        method: "POST",
        body: JSON.stringify({ track: args.track }),
      });
    },
    onMutate: async (args) => {
      await qc.cancelQueries({ queryKey: queryKeys.favorites });
      const previous = qc.getQueryData<FavoriteRow[]>(queryKeys.favorites);
      const now = new Date().toISOString();

      if (!previous) return { previous };

      if (args.isFavorited) {
        qc.setQueryData<FavoriteRow[]>(
          queryKeys.favorites,
          previous.filter((r) => r.track_id !== args.track.id),
        );
      } else {
        qc.setQueryData<FavoriteRow[]>(queryKeys.favorites, [
          {
            id: `optimistic-${args.track.id}`,
            user_id: "me",
            track_id: args.track.id,
            // Provisional TrackSnapshot with undefined metadata
            track_data: {
              ...args.track,
              coverUrl: undefined,
              videoCount: undefined,
            } as TrackSnapshot,
            created_at: now,
          },
          ...previous,
        ]);
      }

      return { previous };
    },
    onError: (_err, args, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.favorites, ctx.previous);
      toast.error(
        args.isFavorited
          ? "Failed to remove favorite."
          : "Failed to favorite track.",
      );
    },
    onSuccess: (_data, args) => {
      toast.success(
        args.isFavorited ? "Removed from favorites." : "Saved to favorites.",
      );
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.favorites });
    },
  });
}

export function usePlaylists(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.playlists,
    queryFn: () =>
      apiFetchJson<PlaylistRow[]>("/api/playlists", { method: "GET" }),
    enabled: options?.enabled,
  });
}

export function useCreatePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description?: string }) =>
      apiFetchJson<PlaylistRow>("/api/playlists", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (playlist) => {
      toast.success("Playlist created.");
      qc.setQueryData<PlaylistRow[]>(queryKeys.playlists, (prev) =>
        prev && !prev.some((p) => p.id === playlist.id)
          ? [playlist, ...prev]
          : prev,
      );
      void qc.invalidateQueries({ queryKey: queryKeys.playlists });
    },
    onError: () => toast.error("Failed to create playlist."),
  });
}

export function useUpdatePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      playlistId: string;
      body: { name?: string; description?: string };
    }) =>
      apiFetchJson<PlaylistRow>(`/api/playlists/${args.playlistId}`, {
        method: "PATCH",
        body: JSON.stringify(args.body),
      }),
    onSuccess: (playlist, args) => {
      toast.success("Playlist updated.");
      qc.setQueryData<PlaylistRow[]>(queryKeys.playlists, (prev) =>
        prev?.map((p) => (p.id === playlist.id ? playlist : p)),
      );
      qc.setQueryData<PlaylistDetail>(
        queryKeys.playlist(args.playlistId),
        (prev) => (prev ? { ...prev, playlist } : prev),
      );
      void qc.invalidateQueries({ queryKey: queryKeys.playlists });
      void qc.invalidateQueries({ queryKey: queryKeys.playlist(args.playlistId) });
    },
    onError: () => toast.error("Failed to update playlist."),
  });
}

export function useDeletePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (playlistId: string) =>
      apiFetchJson<{ id: string }>(`/api/playlists/${playlistId}`, {
        method: "DELETE",
      }),
    onSuccess: (_data, playlistId) => {
      toast.success("Playlist deleted.");
      qc.setQueryData<PlaylistRow[]>(queryKeys.playlists, (prev) =>
        prev?.filter((p) => p.id !== playlistId),
      );
      qc.removeQueries({ queryKey: queryKeys.playlist(playlistId) });
      void qc.invalidateQueries({ queryKey: queryKeys.playlists });
    },
    onError: () => toast.error("Failed to delete playlist."),
  });
}

export function usePlaylist(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.playlist(id),
    queryFn: () =>
      apiFetchJson<PlaylistDetail>(`/api/playlists/${id}`, { method: "GET" }),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
}

export function usePlaylistDetails(playlistIds: string[], options?: { enabled?: boolean }) {
  const uniqueIds = React.useMemo(
    () => Array.from(new Set(playlistIds.filter(Boolean))).sort(),
    [playlistIds],
  );

  return useQuery({
    queryKey: ["api", "playlist-details", uniqueIds],
    queryFn: async () => {
      const details = await Promise.all(
        uniqueIds.map((id) =>
          apiFetchJson<PlaylistDetail>(`/api/playlists/${id}`, {
            method: "GET",
          }),
        ),
      );
      return details;
    },
    enabled: (options?.enabled ?? true) && uniqueIds.length > 0,
  });
}

export function useAddTrackToPlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { playlistId: string; track: BaseTrack }) =>
      apiFetchJson<PlaylistTrackRow>(
        `/api/playlists/${args.playlistId}/tracks`,
        {
          method: "POST",
          body: JSON.stringify({ track: args.track }),
        },
      ),
    onMutate: async (args) => {
      await qc.cancelQueries({ queryKey: queryKeys.playlist(args.playlistId) });
      const prev = qc.getQueryData<PlaylistDetail>(
        queryKeys.playlist(args.playlistId),
      );
      if (!prev) return { prev };

      const alreadyExists = prev.tracks.some((t) => t.track_id === args.track.id);
      const next: PlaylistDetail = alreadyExists
        ? prev
        : {
            ...prev,
            tracks: [
              ...prev.tracks,
              {
                id: `optimistic-${args.playlistId}-${args.track.id}`,
                playlist_id: args.playlistId,
                track_id: args.track.id,
                track_data: args.track,
                position: prev.tracks.length,
                created_at: new Date().toISOString(),
              } as PlaylistTrackRow,
            ],
          };
      qc.setQueryData(queryKeys.playlist(args.playlistId), next);
      return { prev };
    },
    onError: (_e, args, ctx) => {
      if (ctx?.prev)
        qc.setQueryData(queryKeys.playlist(args.playlistId), ctx.prev);
      toast.error("Failed to add track.");
    },
    onSuccess: () => toast.success("Added to playlist."),
    onSettled: (_d, _e, args) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.playlist(args.playlistId),
      });
      void qc.invalidateQueries({ queryKey: queryKeys.playlists });
      void qc.invalidateQueries({ queryKey: ["api", "playlist-details"] });
    },
  });
}

export function useRemoveTrackFromPlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { playlistId: string; trackId: string }) =>
      apiFetchJson<{ playlistId: string; trackId: string }>(
        `/api/playlists/${args.playlistId}/tracks/${args.trackId}`,
        { method: "DELETE" },
      ),
    onMutate: async (args) => {
      await qc.cancelQueries({ queryKey: queryKeys.playlist(args.playlistId) });
      const prev = qc.getQueryData<PlaylistDetail>(
        queryKeys.playlist(args.playlistId),
      );
      if (!prev) return { prev };
      qc.setQueryData<PlaylistDetail>(queryKeys.playlist(args.playlistId), {
        ...prev,
        tracks: prev.tracks.filter((t) => t.track_id !== args.trackId),
      });
      return { prev };
    },
    onError: (_e, args, ctx) => {
      if (ctx?.prev)
        qc.setQueryData(queryKeys.playlist(args.playlistId), ctx.prev);
      toast.error("Failed to remove track.");
    },
    onSuccess: () => toast.success("Removed from playlist."),
    onSettled: (_d, _e, args) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.playlist(args.playlistId),
      });
      void qc.invalidateQueries({ queryKey: queryKeys.playlists });
      void qc.invalidateQueries({ queryKey: ["api", "playlist-details"] });
    },
  });
}

export function useHistory(limit = 50, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.history(limit),
    queryFn: () =>
      apiFetchJson<HistoryRow[]>(`/api/history?limit=${limit}`, {
        method: "GET",
      }),
    enabled: options?.enabled,
  });
}

export function useAddHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (track: TrackSnapshot) =>
      apiFetchJson<HistoryRow>("/api/history", {
        method: "POST",
        body: JSON.stringify({ track }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["api", "history"] });
    },
  });
}

export function useTrackMetadata(
  trackId?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["track-metadata", trackId],
    queryFn: () =>
      apiFetchJson<EnrichedTrackMetadata>(`/api/tracks/${trackId}/metadata`, {
        method: "GET",
      }),
    enabled: Boolean(trackId) && (options?.enabled ?? true),
    staleTime: 24 * 60 * 60 * 1000,
  });
}

/**
 * Fetch trending/explore sounds. Calls /api/music/trending with a default
 * region so the home page always has real content.
 *
 * @param keyword  Cache namespace key (default: "trending")
 * @param page     Page offset 0–4; omit for a random initial cursor window.
 * @param refresh  Manual refresh token; bypasses the server cache when non-zero.
 * @param accessKey Cache key segment for random initial loads.
 */
export function useExploreTracks(
  keyword = "trending",
  page?: number,
  refresh = 0,
  accessKey = "",
) {
  return useQuery({
    queryKey: queryKeys.explore(keyword, page, refresh, accessKey),
    queryFn: async () => {
      const pageParam =
        page === undefined ? "" : `&page=${Math.max(0, Math.min(page, 4))}`;
      const refreshParam = refresh ? `&refresh=${refresh}` : "";
      const data = await apiFetchJson<TrendingSoundsPage>(
        `/api/music/trending?count=12${pageParam}${refreshParam}`,
        { method: "GET" },
      );

      return {
        tracks: data.sounds.map((sound) => ({
          id: sound.music_id,
          title: sound.title,
          artist: sound.author,
          audioUrl: sound.audioUrl,
          coverUrl: sound.cover || undefined,
          duration: sound.duration,
          original: /original\s+sound/i.test(sound.title),
          videoCount: sound.video_count,
          stats: {
            play_count: sound.total_plays,
            digg_count: sound.total_diggs,
            collect_count: 0,
            comment_count: sound.total_comments,
            share_count: sound.total_shares,
            video_count: sound.video_count,
            music_score: sound.trending_score,
          },
        })) satisfies TrackSnapshot[],
        region: data.region,
        page: data.page,
        generatedAt: data.generatedAt,
      };
    },
    staleTime: refresh ? 0 : 5 * 60 * 1000, // Manual refreshes are intentionally one-shot.
  });
}


/**
 * Fetch a single track's full data by its TikTok music ID.
 * Returns a TrackSnapshot from /api/music/[id] (real TikWM call).
 */
export function useTrackDetail(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.trackDetail(id ?? ""),
    queryFn: () =>
      apiFetchJson<TrackSnapshot>(`/api/music/${id}`, { method: "GET" }),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Mutation: POST a TikTok URL to /api/import to extract the real track data.
 * Returns ImportResult discriminated union: { type: 'track' | 'sound', data: ... }
 */
export function useImportTrack() {
  return useMutation({
    mutationFn: (url: string) =>
      apiFetchJson<ImportResult>("/api/import", {
        method: "POST",
        body: JSON.stringify({ url }),
      }),
    onError: () => {
      // Errors are handled by the calling component
    },
  });
}

// ---------------------------------------------------------------------------
// Sound System Hooks
// ---------------------------------------------------------------------------

/**
 * Fetch aggregated trending sounds from /api/music/trending.
 * Returns TrendingSoundsPage: sounds[], region, generatedAt.
 */
export function useTrendingSounds(region = "VN") {
  return useQuery({
    queryKey: queryKeys.trending(region),
    queryFn: () =>
      apiFetchJson<TrendingSoundsPage>(
        `/api/music/trending?region=${encodeURIComponent(region)}&count=12`,
        { method: "GET" },
      ),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch paginated videos using a specific sound.
 * Supports infinite scroll via useInfiniteQuery.
 */
export function useSoundPosts(musicId: string | undefined) {
  return useInfiniteQuery<{
    videos: SoundVideo[];
    nextCursor: number | null;
    hasMore: boolean;
  }>({
    queryKey: queryKeys.soundPosts(musicId ?? ""),
    initialPageParam: 0,
    queryFn: async ({ pageParam, signal }) => {
      return apiFetchJson<{
        videos: SoundVideo[];
        nextCursor: number | null;
        hasMore: boolean;
      }>(
        `/api/music/${musicId}/posts?count=12&cursor=${pageParam}`,
        { method: "GET", signal },
      );
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.nextCursor !== null
        ? lastPage.nextCursor
        : undefined,
    enabled: Boolean(musicId),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Fetch sound metadata (SoundEntity) for the sound header.
 * Uses the existing /api/music/[id] endpoint.
 */
export function useSoundContext(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.soundContext(id ?? ""),
    queryFn: () =>
      apiFetchJson<TrackSnapshot>(`/api/music/${id}`, { method: "GET" }),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

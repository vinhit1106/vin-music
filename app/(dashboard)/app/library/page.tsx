"use client";

import * as React from "react";
import { Music, Play, Pause } from "lucide-react";

import { EmptyState } from "@/components/vin-music/empty-state";
import { MusicCard } from "@/components/vin-music/music-card";
import { NowPlayingCard } from "@/components/vin-music/now-playing-card";
import { PageTransition } from "@/components/vin-music/page-transition";
import { SectionHeading } from "@/components/vin-music/section-heading";
import { CoverImage } from "@/components/vin-music/track-cover";
import { TrackActionsMenu } from "@/components/vin-music/track-actions-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthContext } from "@/src/lib/auth/hooks";
import { useFavorites, useHistory } from "@/src/lib/query/hooks";
import { trackToMusicCard } from "@/src/lib/query/mappers";
import { useVinMusicPlayerStore } from "@/store/vin-music-player-store";
import type { MusicCardModel } from "@/lib/vin-music/types";

type RecentHistoryItem = {
  id: string;
  trackId: string;
  playedAt: Date;
  track: MusicCardModel;
};

type RecentHistoryGroup = {
  label: string;
  items: RecentHistoryItem[];
};

function getStartOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getHistoryGroupLabel(playedAt: Date) {
  const today = getStartOfToday();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  if (playedAt >= today) return "Today";
  if (playedAt >= yesterday) return "Yesterday";
  if (playedAt >= sevenDaysAgo) return "Last 7 Days";
  return "Older";
}

function formatLastPlayed(playedAt: Date) {
  const diffMs = Date.now() - playedAt.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "just now";
  if (diffMs < hour) {
    const minutes = Math.max(1, Math.floor(diffMs / minute));
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  if (diffMs < 7 * day) {
    const days = Math.floor(diffMs / day);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return playedAt.toLocaleDateString();
}

function groupRecentHistory(items: RecentHistoryItem[]) {
  const groups = new Map<string, RecentHistoryItem[]>();
  for (const item of items) {
    const label = getHistoryGroupLabel(item.playedAt);
    groups.set(label, [...(groups.get(label) ?? []), item]);
  }

  return Array.from(groups.entries()).map<RecentHistoryGroup>(
    ([label, groupItems]) => ({
      label,
      items: groupItems,
    }),
  );
}

function RecentlyPlayedRow({
  item,
  playlist,
}: {
  item: RecentHistoryItem;
  playlist: MusicCardModel[];
}) {
  const currentTrack = useVinMusicPlayerStore((state) => state.currentTrack);
  const isPlaying = useVinMusicPlayerStore((state) => state.isPlaying);
  const playTrack = useVinMusicPlayerStore((state) => state.playTrack);
  const togglePlayback = useVinMusicPlayerStore((state) => state.togglePlayback);

  const isCurrent = currentTrack?.id === item.track.id;

  const handleClick = () => {
    if (isCurrent) {
      togglePlayback();
    } else {
      playTrack(item.track, playlist);
    }
  };

  return (
    <div
      className={`group flex w-full items-center gap-2 rounded-xl border p-2 text-left transition-colors ${
        isCurrent
          ? "border-primary/30 bg-primary/5 hover:bg-primary/8"
          : "border-border bg-card hover:bg-muted/30"
      }`}
    >
      <button
        type="button"
        onClick={handleClick}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/40 bg-muted">
          {item.track.cover ? (
            <CoverImage
              src={item.track.cover}
              alt={item.track.title}
              containerClassName="h-full w-full"
              className={`transition-opacity ${
                isCurrent ? "opacity-90" : "group-hover:opacity-50"
              }`}
              sizes="48px"
              showPlaceholder={false}
            />
          ) : (
            <Music className="h-5 w-5 text-muted-foreground" />
          )}
          {/* Play/Pause overlay: always on active, only on hover for inactive */}
          <span
            className={`absolute inset-0 flex items-center justify-center bg-black/40 text-white transition-opacity ${
              isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            {isCurrent && isPlaying ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm font-semibold font-heading ${
              isCurrent ? "text-primary" : "text-foreground"
            }`}
          >
            {item.track.title}
          </p>
          <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">
            {isCurrent
              ? isPlaying
                ? "Playing now"
                : "Paused"
              : item.track.author}
          </p>
        </div>
      </button>

      <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
        {formatLastPlayed(item.playedAt)}
      </span>
      <TrackActionsMenu track={item.track} />
    </div>
  );
}

export default function LibraryPage() {
  const { isLoading: isSessionLoading, user } = useAuthContext();
  const isReady = Boolean(user) && !isSessionLoading;
  const historyQuery = useHistory(50, { enabled: isReady });
  const favoritesQuery = useFavorites({ enabled: isReady });

  const recentItems = React.useMemo(() => {
    const deduped: RecentHistoryItem[] = [];
    let previousTrackId: string | null = null;

    for (const row of historyQuery.data ?? []) {
      if (row.track_id === previousTrackId) continue;

      previousTrackId = row.track_id;
      deduped.push({
        id: row.id,
        trackId: row.track_id,
        playedAt: new Date(row.played_at),
        track: trackToMusicCard(row.track_data),
      });
    }

    return deduped;
  }, [historyQuery.data]);

  const recentGroups = React.useMemo(
    () => groupRecentHistory(recentItems),
    [recentItems],
  );

  const recentPlaylist = React.useMemo(
    () => recentItems.map((item) => item.track),
    [recentItems],
  );

  const savedTracks = React.useMemo(
    () => (favoritesQuery.data ?? []).map((f) => trackToMusicCard(f.track_data)),
    [favoritesQuery.data],
  );

  const isLoading =
    isSessionLoading || historyQuery.isLoading || favoritesQuery.isLoading;

  return (
    <PageTransition>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
        <div className="space-y-6">
          <SectionHeading
            title="Library"
            subtitle="Everything you have listened to, saved, or collected."
          />

          {isLoading ? (
            <div className="grid gap-2 grid-cols-1 md:gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-[76px] rounded-xl" />
              ))}
            </div>
          ) : (
            <Tabs defaultValue="recent">
              <TabsList>
                <TabsTrigger value="recent">Recently Played</TabsTrigger>
                <TabsTrigger value="saved-tracks">Saved Tracks</TabsTrigger>
              </TabsList>

              <TabsContent value="recent">
                {recentGroups.length ? (
                  <div className="space-y-5">
                    {recentGroups.map((group) => (
                      <section key={group.label} className="space-y-2">
                        <h2 className="px-0.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {group.label}
                        </h2>
                        <div className="grid grid-cols-1 gap-2 md:gap-3">
                          {group.items.map((item) => (
                            <RecentlyPlayedRow
                              key={item.id}
                              item={item}
                              playlist={recentPlaylist}
                            />
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No listening history yet"
                    description="Play a track and your recent listening history will appear here."
                  />
                )}
              </TabsContent>

              <TabsContent value="saved-tracks">
                {savedTracks.length ? (
                  <div className="grid gap-2 grid-cols-1 md:gap-3">
                    {savedTracks.map((music) => (
                      <MusicCard key={music.id} music={music} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No saved tracks yet"
                    description="Collect tracks you love and they'll appear here."
                  />
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
        <NowPlayingCard />
      </div>
    </PageTransition>
  );
}

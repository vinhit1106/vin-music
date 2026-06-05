"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bookmark, Clapperboard, Pause, Play, RefreshCw } from "lucide-react";

import { EmptyState } from "@/components/vin-music/empty-state";
import { MusicCard } from "@/components/vin-music/music-card";
import { NowPlayingCard } from "@/components/vin-music/now-playing-card";
import { PageTransition } from "@/components/vin-music/page-transition";
import { SectionHeading } from "@/components/vin-music/section-heading";
import { CoverImage } from "@/components/vin-music/track-cover";
import { TrackActionsMenu } from "@/components/vin-music/track-actions-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useExploreTracks,
  useFavorites,
  useHistory,
} from "@/src/lib/query/hooks";
import { trackToMusicCard } from "@/src/lib/query/mappers";
import { formatCount } from "@/lib/vin-music/format";
import { useVinMusicPlayerStore } from "@/store/vin-music-player-store";
import { useAuthContext } from "@/src/lib/auth/hooks";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Freshness label: derives a deterministic update time from generatedAt.
// No timer or polling; computed once when data arrives.
// ---------------------------------------------------------------------------
function useFreshnessLabel(generatedAt: string | undefined): string | null {
  return useMemo(() => {
    if (!generatedAt) return null;
    return `Updated ${new Date(generatedAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }, [generatedAt]);
}

// ---------------------------------------------------------------------------
// Page rotation: pick a random page index != current to guarantee variety.
// Pages 0–4 each map to a different TikWM cursor window.
// ---------------------------------------------------------------------------
const EXPLORE_PAGES = [0, 1, 2, 3, 4] as const;

function pickNextPage(current: number | undefined): number {
  const candidates = EXPLORE_PAGES.filter((p) => p !== current);
  return candidates[Math.floor(Math.random() * candidates.length)]!;
}

export default function VinVibeHomePage() {
  const { user, isLoading: isSessionLoading } = useAuthContext();
  const isReady = Boolean(user) && !isSessionLoading;
  const exploreAccessKey = useId();

  // --- Explore state ---
  const [explorePage, setExplorePage] = useState<number | undefined>(undefined);
  const [exploreRefresh, setExploreRefresh] = useState(0);
  const pendingExploreQueueRefreshRef = useRef(0);
  const lastAutoRefreshTrackRef = useRef<string | null>(null);
  const exploreQuery = useExploreTracks(
    "trending",
    explorePage,
    exploreRefresh,
    exploreAccessKey,
  );

  // --- Other data ---
  // Fetch more than 4 so deduplication still yields 4 unique tracks
  const historyQuery = useHistory(20, { enabled: isReady });
  const favoritesQuery = useFavorites({ enabled: isReady });

  // --- Derived explore data ---
  const exploreTracks = useMemo(
    () => (exploreQuery.data?.tracks ?? []).map(trackToMusicCard),
    [exploreQuery.data],
  );

  const exploreTotalPlays = useMemo(
    () =>
      exploreTracks.reduce(
        (sum, item) => sum + (item.stats.play_count ?? 0),
        0,
      ),
    [exploreTracks],
  );

  const freshnessLabel = useFreshnessLabel(exploreQuery.data?.generatedAt);
  const displayedExplorePage = exploreQuery.data?.page ?? explorePage;

  // --- Discover More handler ---
  // Picks a random page != current and bypasses the server cache for fresh data.
  function handleDiscoverMore() {
    setExplorePage((current) => pickNextPage(current));
    setExploreRefresh(Date.now());
  }

  // --- Recently played (deduplicated) ---
  // keep only the first (most-recent) occurrence per track_id
  const recentTracks = useMemo(
    () =>
      (historyQuery.data ?? [])
        .filter(
          (h, i, arr) => arr.findIndex((x) => x.track_id === h.track_id) === i,
        )
        .slice(0, 4)
        .map((h) => trackToMusicCard(h.track_data)),
    [historyQuery.data],
  );

  const savedTracks = useMemo(
    () =>
      (favoritesQuery.data ?? [])
        .slice(0, 4)
        .map((f) => trackToMusicCard(f.track_data)),
    [favoritesQuery.data],
  );

  const currentTrack = useVinMusicPlayerStore((state) => state.currentTrack);
  const isPlaying = useVinMusicPlayerStore((state) => state.isPlaying);
  const playbackMode = useVinMusicPlayerStore((state) => state.playbackMode);
  const playTrack = useVinMusicPlayerStore((state) => state.playTrack);
  const setQueue = useVinMusicPlayerStore((state) => state.setQueue);
  const togglePlayback = useVinMusicPlayerStore(
    (state) => state.togglePlayback,
  );

  useEffect(() => {
    if (playbackMode !== "autoplay-next") return;
    if (!currentTrack || !exploreTracks.length) return;
    if (exploreQuery.isFetching) return;

    const lastExploreTrack = exploreTracks.at(-1);
    if (!lastExploreTrack || currentTrack.id !== lastExploreTrack.id) return;
    if (lastAutoRefreshTrackRef.current === currentTrack.id) return;

    const refreshToken = Date.now();
    lastAutoRefreshTrackRef.current = currentTrack.id;
    pendingExploreQueueRefreshRef.current = refreshToken;
    setExplorePage((current) => pickNextPage(current));
    setExploreRefresh(refreshToken);
  }, [currentTrack, exploreQuery.isFetching, exploreTracks, playbackMode]);

  useEffect(() => {
    if (!pendingExploreQueueRefreshRef.current) return;
    if (pendingExploreQueueRefreshRef.current !== exploreRefresh) return;
    if (exploreQuery.isFetching || exploreQuery.isLoading) return;

    pendingExploreQueueRefreshRef.current = 0;

    if (exploreQuery.isError || !exploreTracks.length) return;

    const nextTracks = exploreTracks.filter(
      (track) => track.id !== currentTrack?.id,
    );
    const [nextTrack, ...remainingTracks] = nextTracks;

    if (
      playbackMode === "autoplay-next" &&
      currentTrack &&
      !isPlaying &&
      lastAutoRefreshTrackRef.current === currentTrack.id &&
      nextTrack
    ) {
      playTrack(nextTrack, nextTracks);
      setQueue(remainingTracks);
      return;
    }

    setQueue(nextTracks);
  }, [
    currentTrack?.id,
    currentTrack,
    exploreQuery.isError,
    exploreQuery.isFetching,
    exploreQuery.isLoading,
    exploreRefresh,
    exploreTracks,
    isPlaying,
    playbackMode,
    playTrack,
    setQueue,
  ]);

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* Hero: Search + Now Playing */}
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_320px]">
          <section className="rounded-lg border border-border/70 bg-card/85 p-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-bold">
                  TikTok sound discovery
                </div>
                <h1 className="font-heading text-xl font-black tracking-tight md:text-2xl leading-tight">
                  Search songs or paste a TikTok link
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                  Find trending sounds, extract audio from TikTok videos, and
                  save them to your collections.
                </p>
              </div>

              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  const q = (data.get("q") as string).trim();
                  if (q) {
                    if (q.includes("tiktok.com") || q.includes("vm.tiktok")) {
                      window.location.href = `/app/import?url=${encodeURIComponent(q)}`;
                    } else {
                      window.location.href = `/app/search?q=${encodeURIComponent(q)}`;
                    }
                  }
                }}
              >
                <input
                  name="q"
                  type="text"
                  placeholder="Search songs, artists, or paste a TikTok URL…"
                  className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-ring transition-all font-heading"
                  autoComplete="off"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="h-9 px-4 font-bold cursor-pointer"
                >
                  Search
                </Button>
              </form>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <Link
                  href="/app/search"
                  className="inline-flex items-center gap-1 rounded-md border border-border/70 px-2 py-1 hover:bg-muted transition-colors"
                >
                  <Play className="size-3" />
                  Browse all sounds
                </Link>
                <Link
                  href="/app/import"
                  className="inline-flex items-center gap-1 rounded-md border border-border/70 px-2 py-1 hover:bg-muted transition-colors"
                >
                  <Clapperboard className="size-3" />
                  Import TikTok link
                </Link>
                <Link
                  href="/app/collections"
                  className="inline-flex items-center gap-1 rounded-md border border-border/70 px-2 py-1 hover:bg-muted transition-colors"
                >
                  <Bookmark className="size-3" />
                  Your collections
                </Link>
              </div>
            </div>
          </section>

          <NowPlayingCard />
        </div>

        {/* Recently Played */}
        <section id="continue-listening" className="space-y-2.5">
          <SectionHeading
            title="Recently Played"
            subtitle="Your most recent listening activity, picked from your history."
            action={
              <Link
                href="/app/history"
                className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                View All History
              </Link>
            }
          />
          {isSessionLoading || historyQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-2 transition-opacity duration-200">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton
                  key={`recent-skeleton-${index}`}
                  className="h-[52px] rounded-xl"
                />
              ))}
            </div>
          ) : recentTracks.length ? (
            <div className="grid grid-cols-1 gap-2 transition-opacity duration-200">
              {recentTracks.map((track) => {
                const active = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    className={`group flex items-center gap-2.5 rounded-xl border px-2.5 py-2 transition-colors ${
                      active
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/60 bg-card hover:bg-muted/40"
                    }`}
                  >
                    {/* Thumbnail with play/pause overlay */}
                    <button
                      type="button"
                      onClick={() => {
                        if (active) {
                          togglePlayback();
                        } else {
                          playTrack(track, recentTracks);
                        }
                      }}
                      className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-border/30 bg-muted cursor-pointer"
                      aria-label={active && isPlaying ? "Pause" : "Play"}
                    >
                      <CoverImage
                        src={track.cover}
                        alt={track.title}
                        containerClassName="h-full w-full"
                        sizes="36px"
                        showPlaceholder
                        placeholderSeed={track.title}
                      />
                      <span
                        className={`absolute inset-0 flex items-center justify-center bg-black/45 text-white transition-opacity ${
                          active
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        {active && isPlaying ? (
                          <Pause className="size-3.5 fill-current" />
                        ) : (
                          <Play className="size-3.5 fill-current translate-x-px" />
                        )}
                      </span>
                    </button>

                    {/* Text info */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-[12.5px] font-semibold leading-tight ${active ? "text-primary" : "text-foreground"}`}
                      >
                        {track.title || "Untitled"}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground leading-tight mt-0.5">
                        {active
                          ? isPlaying
                            ? "Playing now"
                            : "Paused"
                          : track.author || "Unknown artist"}
                      </p>
                    </div>

                    {/* Actions */}
                    <TrackActionsMenu track={track} />
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Nothing in your listening history yet"
              description="Start playing a track and VinVibe will keep your history here."
            />
          )}
        </section>

        <div className="space-y-5">
          {/* Explore Sounds */}
          <section className="space-y-2.5">
            <SectionHeading
              title="Explore Sounds"
              subtitle="Trending TikTok sounds ready to preview, save, or inspect."
              action={
                <div className="flex items-center gap-2.5">
                  {/* Freshness indicator — no timer, computed once from generatedAt */}
                  {freshnessLabel && !exploreQuery.isLoading && (
                    <span className="hidden sm:inline text-[11px] text-muted-foreground/60 font-medium select-none">
                      {freshnessLabel}
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDiscoverMore}
                    disabled={exploreQuery.isFetching}
                    className="h-7 gap-1.5 text-[11px] font-semibold cursor-pointer px-2.5"
                  >
                    <RefreshCw
                      className={cn(
                        "size-3 shrink-0",
                        exploreQuery.isFetching && "animate-spin",
                      )}
                    />
                    Discover More
                  </Button>
                </div>
              }
            />

            {/* isLoading = first fetch, no data yet → show skeletons.
                isFetching (but not isLoading) = background refetch → keep existing tracks visible. */}
            {exploreQuery.isLoading ? (
              <div className="grid grid-cols-1 gap-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton
                    key={`explore-skeleton-${index}`}
                    className="h-[72px] rounded-xl"
                  />
                ))}
              </div>
            ) : exploreQuery.isError ? (
              <div className="space-y-3">
                <EmptyState
                  title="No sounds available right now"
                  description="TikTok sound data is temporarily unavailable."
                />
                <div className="flex justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDiscoverMore}
                    disabled={exploreQuery.isFetching}
                    className="gap-1.5 cursor-pointer"
                  >
                    <RefreshCw
                      className={cn(
                        "size-3",
                        exploreQuery.isFetching && "animate-spin",
                      )}
                    />
                    Try Again
                  </Button>
                </div>
              </div>
            ) : exploreTracks.length ? (
              <div className="space-y-2">
                <div
                  className={cn(
                    "grid grid-cols-1 gap-2 transition-opacity duration-200",
                    // Subtle fade while a background refetch is in-flight
                    exploreQuery.isFetching && "opacity-60 pointer-events-none",
                  )}
                >
                  {exploreTracks.map((music) => (
                    <MusicCard
                      key={music.id}
                      music={music}
                      playContext={exploreTracks}
                      queueContextOnAutoplay
                    />
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                  <span className="rounded-md border border-border/70 px-2 py-1">
                    {exploreQuery.data?.region ?? "VN"} trending
                  </span>
                  {exploreTotalPlays > 0 ? (
                    <span className="rounded-md border border-border/70 px-2 py-1">
                      {formatCount(exploreTotalPlays)} plays represented
                    </span>
                  ) : null}
                  <span className="rounded-md border border-border/70 px-2 py-1 tabular-nums">
                    {displayedExplorePage === undefined
                      ? "Random batch"
                      : `Page ${displayedExplorePage + 1} of ${EXPLORE_PAGES.length}`}
                  </span>
                </div>
              </div>
            ) : (
              // Loaded but empty (edge case)
              <div className="space-y-3">
                <EmptyState
                  title="No sounds available right now"
                  description="Trending data returned no sounds. Try a different batch."
                />
                <div className="flex justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDiscoverMore}
                    disabled={exploreQuery.isFetching}
                    className="gap-1.5 cursor-pointer"
                  >
                    <RefreshCw
                      className={cn(
                        "size-3",
                        exploreQuery.isFetching && "animate-spin",
                      )}
                    />
                    Try Another Batch
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* Saved Tracks */}
          <section className="space-y-2.5">
            <SectionHeading
              title="Saved Tracks"
              subtitle="Sounds you have favorited and saved to your library."
            />
            {isSessionLoading || favoritesQuery.isLoading ? (
              <div className="grid gap-2 grid-cols-1">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton
                    key={`saved-skeleton-${index}`}
                    className="h-[72px] rounded-xl"
                  />
                ))}
              </div>
            ) : !user ? (
              <EmptyState
                title="Sign in to see your saved tracks"
                description="Log in to access your favorites and personal library."
              />
            ) : savedTracks.length ? (
              <div className="grid gap-2 grid-cols-1">
                {savedTracks.map((music) => (
                  <MusicCard key={music.id} music={music} compact />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No saved tracks yet"
                description="Tap the heart icon on any track to save it here."
              />
            )}
          </section>
        </div>
      </div>
    </PageTransition>
  );
}

"use client";

import { FolderHeart, Play, Share2, TrendingUp, Heart, ChevronDown, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import * as React from "react";

import { EmptyState } from "@/components/vin-music/empty-state";
import { NowPlayingCard } from "@/components/vin-music/now-playing-card";
import { PageTransition } from "@/components/vin-music/page-transition";
import { CoverImage } from "@/components/vin-music/track-cover";
import { TrackActionsMenu } from "@/components/vin-music/track-actions-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCount, formatDuration } from "@/lib/vin-music/format";
import { useTrackDetail, useSoundPosts } from "@/src/lib/query/hooks";
import { trackToMusicCard } from "@/src/lib/query/mappers";
import { useCollectionsStore } from "@/store/collections-store";
import { useVinMusicPlayerStore } from "@/store/vin-music-player-store";
import type { SoundVideo } from "@/src/lib/tikwm/sound-entity";

// ---------------------------------------------------------------------------
// Video card for the "Videos using this sound" grid
// ---------------------------------------------------------------------------

function SoundVideoCard({ video }: { video: SoundVideo }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/80 hover:border-primary/40 hover:bg-card transition-all duration-200">
      {/* Thumbnail */}
      <div className="relative aspect-[9/16] overflow-hidden bg-muted">
        {video.cover ? (
          <CoverImage
            src={video.cover}
            alt={video.title}
            containerClassName="h-full w-full transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Play className="size-8 text-muted-foreground/50" />
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        {/* Stats overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-white/90 text-xs">
            <Play className="size-3 fill-white/80" />
            <span>{formatCount(video.play_count)}</span>
          </div>
          <div className="flex items-center gap-1 text-white/90 text-xs">
            <Heart className="size-3 fill-pink-400 text-pink-400" />
            <span>{formatCount(video.digg_count)}</span>
          </div>
        </div>
      </div>
      {/* Info */}
      <div className="p-3 space-y-1">
        <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight">
          {video.title || "Untitled"}
        </p>
        <p className="text-[11px] text-muted-foreground truncate">@{video.author}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton for video card
// ---------------------------------------------------------------------------

function SoundVideoSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card/80 overflow-hidden">
      <Skeleton className="aspect-[9/16] w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function MusicDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  // Sound metadata
  const detailQuery = useTrackDetail(id);
  // Paginated videos using this sound
  const postsQuery = useSoundPosts(id);

  const playTrack = useVinMusicPlayerStore((state) => state.playTrack);
  const openCollectionPicker = useCollectionsStore(
    (state) => state.openCollectionPicker,
  );
  const isTrackInAnyCollection = useCollectionsStore(
    (state) => state.isTrackInAnyCollection,
  );

  if (detailQuery.isLoading) {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
        <div className="space-y-6">
          <Skeleton className="h-56 animate-pulse rounded-xl" />
          <Skeleton className="h-36 animate-pulse rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <SoundVideoSkeleton key={i} />
            ))}
          </div>
        </div>
        <NowPlayingCard />
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <EmptyState
        title="Music detail unavailable"
        description="The track could not be loaded right now. Try another sound or reload the page."
      />
    );
  }

  const snapshot = detailQuery.data;
  const detail = trackToMusicCard(snapshot);
  const isSaved = isTrackInAnyCollection(detail.id);

  // Flatten infinite pages into a flat video array
  const allVideos: SoundVideo[] = postsQuery.data?.pages.flatMap((p) => p.videos) ?? [];

  return (
    <PageTransition>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
        <div className="space-y-8">

          {/* ── Sound Header ── */}
          <section className="grid gap-5 rounded-xl border border-border/70 bg-card/85 p-5 md:grid-cols-[180px_1fr]">
            {detail.cover ? (
              <CoverImage
                src={detail.cover}
                alt={detail.title}
                containerClassName="h-48 w-full rounded-xl shadow-lg md:h-full"
                className="rounded-xl"
                sizes="180px"
              />
            ) : (
              <div className="h-48 w-full rounded-xl bg-muted md:h-full flex items-center justify-center shadow-inner">
                <Play className="size-10 text-muted-foreground" />
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                    <TrendingUp className="size-2.5 mr-1" />
                    TikTok Sound
                  </Badge>
                </div>
                <h1 className="font-(--font-heading) text-3xl font-semibold tracking-tight">
                  {detail.title || "Untitled"}
                </h1>
                <p className="text-muted-foreground">
                  {detail.author || "Unknown artist"}
                </p>
              </div>

              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                <div>
                  <div className="text-xs uppercase tracking-wide">Duration</div>
                  <div className="mt-1 text-foreground font-medium">
                    {formatDuration(detail.duration)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide">Video Count</div>
                  <div className="mt-1 text-foreground font-medium">
                    {formatCount(detail.stats.video_count ?? 0)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide">Plays</div>
                  <div className="mt-1 text-foreground font-medium">
                    {formatCount(detail.stats.play_count ?? 0)}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => playTrack(detail)}>
                  <Play className="mr-2 size-4" />
                  Play
                </Button>
                <TrackActionsMenu
                  track={detail}
                  triggerClassName="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-sm hover:bg-muted"
                  iconClassName="size-4"
                />
                <Button
                  variant={isSaved ? "default" : "outline"}
                  onClick={() => openCollectionPicker(detail)}
                >
                  <FolderHeart className="mr-2 size-4" />
                  {isSaved ? "Saved" : "Save to Collection"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/app/music/${detail.id}`;
                    void navigator.clipboard.writeText(shareUrl);
                  }}
                >
                  <Share2 className="mr-2 size-4" />
                  Share
                </Button>
              </div>
            </div>
          </section>

          {/* ── Engagement Stats ── */}
          <section className="grid gap-4 grid-cols-2 md:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Plays</div>
                <div className="mt-1 text-lg font-semibold text-foreground">
                  {formatCount(detail.stats.play_count ?? 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Likes</div>
                <div className="mt-1 text-lg font-semibold text-foreground">
                  {formatCount(detail.stats.digg_count ?? 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Saves</div>
                <div className="mt-1 text-lg font-semibold text-foreground">
                  {formatCount(detail.stats.collect_count ?? 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Shares</div>
                <div className="mt-1 text-lg font-semibold text-foreground">
                  {formatCount(detail.stats.share_count ?? 0)}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ── Videos Using This Sound ── */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">Videos using this sound</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {allVideos.length > 0
                    ? `${allVideos.length} videos loaded${postsQuery.hasNextPage ? " — scroll for more" : ""}`
                    : "Loading videos…"}
                </p>
              </div>
              {detail.stats.video_count > 0 && (
                <Badge variant="outline" className="text-xs">
                  {formatCount(detail.stats.video_count)} total
                </Badge>
              )}
            </div>

            {postsQuery.isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SoundVideoSkeleton key={i} />
                ))}
              </div>
            ) : postsQuery.isError ? (
              <EmptyState
                title="Videos unavailable"
                description="Could not load videos for this sound right now."
              />
            ) : allVideos.length === 0 ? (
              <EmptyState
                title="No videos found"
                description="No TikTok videos found using this sound."
              />
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {allVideos.map((video) => (
                    <SoundVideoCard key={video.id} video={video} />
                  ))}
                  {/* Loading skeletons for next page */}
                  {postsQuery.isFetchingNextPage &&
                    Array.from({ length: 4 }).map((_, i) => (
                      <SoundVideoSkeleton key={`loading-${i}`} />
                    ))}
                </div>

                {/* Load more button */}
                {postsQuery.hasNextPage && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      onClick={() => void postsQuery.fetchNextPage()}
                      disabled={postsQuery.isFetchingNextPage}
                      className="gap-2"
                    >
                      {postsQuery.isFetchingNextPage ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                      {postsQuery.isFetchingNextPage ? "Loading…" : "Load more videos"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        <NowPlayingCard />
      </div>
    </PageTransition>
  );
}

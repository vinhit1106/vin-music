"use client";

import Link from "next/link";
import * as React from "react";
import {
  Bookmark,
  Clapperboard,
  FolderHeart,
  Heart,
  ListPlus,
  MoreHorizontal,
  Play,
  Pause,
  SquareArrowOutUpRight,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { TrackActionsMenu } from "@/components/vin-music/track-actions-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrackCover } from "@/components/vin-music/track-cover";
import { formatCount, formatDuration } from "@/lib/vin-music/format";
import { getTrackDisplayTitle } from "@/lib/vin-music/display";
import type { MusicCardModel } from "@/lib/vin-music/types";
import { useCollectionsStore } from "@/store/collections-store";
import { useVinMusicPlayerStore } from "@/store/vin-music-player-store";
import { useAuthContext } from "@/src/lib/auth/hooks";
import { useFavorites } from "@/src/lib/query/hooks";

type MusicCardProps = {
  music: MusicCardModel;
  compact?: boolean; // Maintained for signature compatibility
  onOpenDetails?: (music: MusicCardModel) => void;
  playContext?: MusicCardModel[];
  queueContextOnAutoplay?: boolean;
};

function PlayingEqualizer({
  isPlaying,
  className,
}: {
  isPlaying: boolean;
  className?: string;
}) {
  return (
    <span
      className={`flex h-3.5 items-end gap-0.5 ${className ?? ""}`}
      aria-label={isPlaying ? "Playing" : "Current track"}
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={`h-full w-0.5 rounded-full bg-current ${isPlaying ? "vin-eq-bar" : ""}`}
          style={{ animationDelay: `${index * 120}ms` }}
        />
      ))}
    </span>
  );
}

export function MusicCard({
  music,
  onOpenDetails,
  playContext,
  queueContextOnAutoplay = false,
}: MusicCardProps) {
  const playTrack = useVinMusicPlayerStore((state) => state.playTrack);
  const playNextTrack = useVinMusicPlayerStore((state) => state.playNextTrack);
  const addToQueue = useVinMusicPlayerStore((state) => state.addToQueue);
  const setQueue = useVinMusicPlayerStore((state) => state.setQueue);
  const currentTrack = useVinMusicPlayerStore((state) => state.currentTrack);
  const isPlaying = useVinMusicPlayerStore((state) => state.isPlaying);
  const playbackMode = useVinMusicPlayerStore((state) => state.playbackMode);
  const togglePlayback = useVinMusicPlayerStore(
    (state) => state.togglePlayback,
  );

  const openCollectionPicker = useCollectionsStore(
    (state) => state.openCollectionPicker,
  );
  const { user } = useAuthContext();
  const favoritesQuery = useFavorites({ enabled: Boolean(user) });

  const isSaved = (favoritesQuery.data ?? []).some(
    (f) => f.track_id === music.id,
  );
  const isCurrent = currentTrack?.id === music.id;
  const displayTitle = getTrackDisplayTitle(music);
  const openDetails = () => onOpenDetails?.(music);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCurrent) {
      togglePlayback();
    } else {
      const playlist = playContext?.length ? playContext : undefined;
      playTrack(music, playlist);

      if (
        queueContextOnAutoplay &&
        playbackMode === "autoplay-next" &&
        playlist?.length
      ) {
        const currentIndex = playlist.findIndex((track) => track.id === music.id);
        setQueue(currentIndex >= 0 ? playlist.slice(currentIndex + 1) : []);
      }
    }
  };

  const activeClasses = isCurrent
    ? "border-primary/35 bg-primary/5"
    : "border-border bg-card hover:bg-muted/30";

  return (
    <TooltipProvider delay={120}>
      {/* 
        Responsive Redesigned Card:
        - Mobile (< md): A compact, neat card for tight touchscreens.
        - Desktop (>= md): A highly dense, ultra-scannable horizontal row.
      */}
      <Card className={`group relative @container overflow-visible rounded-xl border p-2 transition-colors duration-150 md:p-2.5 ${activeClasses}`}>
        {/* Mobile View */}
        <div className="flex items-center gap-3 md:hidden">
          {/* Cover Art */}
          <div className="relative">
            <TrackCover
              src={music.cover}
              alt={displayTitle}
              sizeClassName="h-16 w-16"
            />
            <button
              onClick={handlePlayClick}
              className={`absolute inset-0 flex items-center justify-center transition-all cursor-pointer border-0 ${
                isCurrent
                  ? "bg-black/40 text-white opacity-100"
                  : "bg-black/45 text-white opacity-0 group-hover:opacity-100"
              }`}
            >
              {isCurrent && isPlaying ? (
                <Pause className="size-4.5 fill-current" />
              ) : (
                <Play className="size-4.5 fill-current" />
              )}
            </button>
          </div>

          {/* Details & Info */}
          <div className="min-w-0 flex-1 space-y-1">
            {onOpenDetails ? (
              <button
                type="button"
                onClick={openDetails}
                className="hover:underline inline-block max-w-full cursor-pointer text-left"
              >
                <div className="truncate text-sm font-semibold text-foreground leading-tight font-heading">
                  {displayTitle}
                </div>
              </button>
            ) : (
              <Link
                href={`/app/music/${music.id}`}
                className="hover:underline inline-block max-w-full"
              >
                <div className="truncate text-sm font-semibold text-foreground leading-tight font-heading">
                  {displayTitle}
                </div>
              </Link>
            )}
            <div className="truncate text-[11px] text-muted-foreground leading-none font-medium">
              <span className="inline-flex max-w-full items-center gap-1.5">
                {isCurrent ? (
                  <PlayingEqualizer isPlaying={isPlaying} className="text-primary" />
                ) : null}
                <span className="truncate">{music.author}</span>
              </span>
            </div>

            {/* Mobile Stats (Compact single line) */}
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground flex-wrap select-none mt-1.5 font-medium">
              {music.stats.play_count !== undefined && (
                <span>▶ {formatCount(music.stats.play_count)}</span>
              )}
              {music.stats.digg_count !== undefined && (
                <span>• ♥ {formatCount(music.stats.digg_count)}</span>
              )}
              {music.stats.video_count !== undefined && (
                <span>• 🎬 {formatCount(music.stats.video_count)}</span>
              )}
            </div>
          </div>

          {/* Mobile Right actions */}
          <div className="flex items-center gap-1.5 shrink-0 pl-1">
            <span className="text-[10px] font-bold text-muted-foreground bg-muted border border-border/30 px-1 py-0.5 rounded">
              {formatDuration(music.duration)}
            </span>
            <TrackActionsMenu track={music} />
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden md:flex items-center justify-between gap-4 h-14 select-none">
          {/* Left Block: Cover Art, Title, Artist */}
          <div className="flex items-center gap-3 min-w-0 max-w-[360px] flex-1">
            <div className="relative">
              <TrackCover
                src={music.cover}
                alt={displayTitle}
                sizeClassName="h-14 w-14"
              />
              <button
                onClick={handlePlayClick}
                className={`absolute inset-0 flex items-center justify-center transition-all cursor-pointer border-0 ${
                  isCurrent
                    ? "bg-black/40 text-white opacity-100"
                    : "bg-black/40 text-white opacity-0 group-hover:opacity-100"
                }`}
              >
                {isCurrent && isPlaying ? (
                  <Pause className="size-4.5 fill-current" />
                ) : (
                  <Play className="size-4.5 fill-current" />
                )}
              </button>
            </div>

            <div className="min-w-0 flex-1 flex flex-col justify-center">
              {onOpenDetails ? (
                <button
                  type="button"
                  onClick={openDetails}
                  className="hover:underline hover:text-primary transition-colors inline-block max-w-full cursor-pointer text-left"
                >
                  <div className="truncate text-sm font-semibold text-foreground leading-snug font-heading">
                    {displayTitle}
                  </div>
                </button>
              ) : (
                <Link
                  href={`/app/music/${music.id}`}
                  className="hover:underline hover:text-primary transition-colors inline-block max-w-full"
                >
                  <div className="truncate text-sm font-semibold text-foreground leading-snug font-heading">
                    {displayTitle}
                  </div>
                </Link>
              )}
              <div className="truncate text-[11.5px] text-muted-foreground leading-none font-medium mt-1">
                <span className="inline-flex max-w-full items-center gap-1.5">
                  {isCurrent ? (
                    <PlayingEqualizer isPlaying={isPlaying} className="text-primary" />
                  ) : null}
                  <span className="truncate">{music.author}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Center Block: Aligned Stats (Single line, extremely scan-efficient) */}
          <div className="hidden @3xl:flex items-center gap-4 flex-1 justify-center max-w-[400px]">
            <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground select-none font-medium bg-muted/40 border border-border/30 rounded-full px-3.5 py-1">
              {music.stats.play_count !== undefined && (
                <span className="flex items-center gap-1.5" title="Plays">
                  <Play className="size-3 text-muted-foreground/60 fill-current" />
                  {formatCount(music.stats.play_count)}
                </span>
              )}
              {music.stats.digg_count !== undefined && (
                <>
                  <span className="text-muted-foreground/30">•</span>
                  <span className="flex items-center gap-1.5" title="Likes">
                    <Heart className="size-3 text-muted-foreground/60 fill-current" />
                    {formatCount(music.stats.digg_count)}
                  </span>
                </>
              )}
              {music.stats.collect_count !== undefined && (
                <>
                  <span className="text-muted-foreground/30">•</span>
                  <span className="flex items-center gap-1.5" title="Saves">
                    <Bookmark className="size-3 text-muted-foreground/60 fill-current" />
                    {formatCount(music.stats.collect_count)}
                  </span>
                </>
              )}
              {music.stats.video_count !== undefined && (
                <>
                  <span className="text-muted-foreground/30">•</span>
                  <span
                    className="flex items-center gap-1.5"
                    title="TikTok Videos"
                  >
                    <Clapperboard className="size-3 text-muted-foreground/60" />
                    {formatCount(music.stats.video_count)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right Block: Album, Duration, Actions */}
          <div className="flex items-center justify-end gap-5 shrink-0 pl-2">
            {/* Album */}
            <span className="hidden @xl:inline text-[11.5px] text-muted-foreground/80 max-w-[100px] truncate font-medium select-none">
              {music.album || "Single"}
            </span>

            {/* Duration */}
            <span className="text-[11px] font-bold text-muted-foreground bg-muted border border-border/30 px-2 py-0.5 rounded select-none shrink-0">
              {formatDuration(music.duration)}
            </span>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Tooltip>
                <TooltipTrigger
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenDetails) {
                      openDetails();
                      return;
                    }
                    window.open(`/app/music/${music.id}`, "_self");
                  }}
                  className="inline-flex items-center justify-center size-7 rounded-lg cursor-pointer transition-colors border border-border bg-background hover:bg-muted hover:text-foreground text-muted-foreground shrink-0"
                >
                  <SquareArrowOutUpRight className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent>View Details</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!user) {
                      window.location.href = "/login";
                      return;
                    }
                    openCollectionPicker(music);
                  }}
                  className={`inline-flex items-center justify-center size-7 rounded-lg cursor-pointer transition-colors border ${
                    isSaved
                      ? "bg-primary text-primary-foreground border-transparent hover:bg-primary/80"
                      : "border-border bg-background hover:bg-muted hover:text-foreground text-muted-foreground"
                  }`}
                >
                  <FolderHeart className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent>Save to Collection</TooltipContent>
              </Tooltip>
              <TrackActionsMenu track={music} />
            </div>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}

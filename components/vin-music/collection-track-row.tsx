"use client";

import { Play, Pause, Trash2, Music } from "lucide-react";
import { formatDuration } from "@/lib/vin-music/format";
import type { MusicCardModel } from "@/lib/vin-music/types";
import { useVinMusicPlayerStore } from "@/store/vin-music-player-store";
import { CoverImage } from "@/components/vin-music/track-cover";
import { TrackActionsMenu } from "@/components/vin-music/track-actions-menu";
import { cn } from "@/lib/utils";

function PlayingIndicator({ active }: { active: boolean }) {
  return (
    <span
      className="flex h-3.5 items-end justify-center gap-0.5 text-primary"
      aria-label={active ? "Playing" : "Current track"}
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={cn(
            "h-full w-0.5 rounded-full bg-current",
            active && "vin-eq-bar",
          )}
          style={{ animationDelay: `${index * 120}ms` }}
        />
      ))}
    </span>
  );
}

type CollectionTrackRowProps = {
  track: MusicCardModel;
  index: number;
  playlist: MusicCardModel[];
  onRemove?: () => void;
  showRemove?: boolean;
};

export function CollectionTrackRow({
  track,
  index,
  playlist,
  onRemove,
  showRemove = true,
}: CollectionTrackRowProps) {
  const currentTrack = useVinMusicPlayerStore((state) => state.currentTrack);
  const isPlaying = useVinMusicPlayerStore((state) => state.isPlaying);
  const playTrack = useVinMusicPlayerStore((state) => state.playTrack);
  const togglePlayback = useVinMusicPlayerStore((state) => state.togglePlayback);

  const isCurrent = currentTrack?.id === track.id;

  const handlePlayClick = () => {
    if (isCurrent) {
      togglePlayback();
    } else {
      playTrack(track, playlist);
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg p-1.5 transition-all hover:bg-muted/40 border border-transparent hover:border-border/20",
        isCurrent && "bg-primary/5 hover:bg-primary/8 border-primary/10 hover:border-primary/15"
      )}
    >
      <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
        {isCurrent ? <PlayingIndicator active={isPlaying} /> : index + 1}
      </span>

      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md overflow-hidden bg-muted border border-border/40">
        {track.cover?.trim() ? (
          <CoverImage
            src={track.cover}
            alt={track.title}
            containerClassName="h-full w-full"
            className="transition-opacity duration-300 group-hover:opacity-40"
            sizes="36px"
          />
        ) : (
          <Music className="h-4.5 w-4.5 text-muted-foreground group-hover:opacity-40" />
        )}

        <button
          onClick={handlePlayClick}
          className={cn(
            "absolute inset-0 flex items-center justify-center text-white transition-all cursor-pointer border-0",
            isCurrent
              ? "bg-black/40 text-white opacity-100"
              : "bg-black/45 text-white opacity-0 group-hover:opacity-100"
          )}
        >
          {isCurrent && isPlaying ? (
            <Pause className="h-3.5 w-3.5 fill-current" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current" />
          )}
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-semibold transition-colors font-heading leading-tight",
            isCurrent ? "text-primary" : "text-foreground"
          )}
        >
          {track.title}
        </p>
        <p className="truncate text-[11px] text-muted-foreground mt-0.5 leading-none">{track.author}</p>
      </div>

      <div className="hidden md:block min-w-0 flex-1 truncate text-xs text-muted-foreground">
        {track.album || "Single"}
      </div>

      <div className="text-xs font-semibold text-muted-foreground w-12 text-right mr-1">
        {formatDuration(track.duration)}
      </div>

      <div className="flex items-center gap-1">
        <TrackActionsMenu track={track} />
        {showRemove && onRemove ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 p-1 rounded-md transition-all cursor-pointer border-0 bg-transparent"
            title="Remove from collection"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

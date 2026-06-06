"use client";

import { Play } from "lucide-react";

import { CoverImage } from "@/components/vin-music/track-cover";
import { getTrackDisplayTitle } from "@/lib/vin-music/display";
import { formatCount } from "@/lib/vin-music/format";
import { useVinMusicPlayerStore } from "@/store/vin-music-player-store";

export function NowPlayingCard() {
  const currentTrack = useVinMusicPlayerStore((state) => state.currentTrack);
  const isPlaying = useVinMusicPlayerStore((state) => state.isPlaying);
  const displayTitle = currentTrack ? getTrackDisplayTitle(currentTrack) : "";
  return (
    <section className="h-fit rounded-lg border border-border/70 bg-card/85 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Now Playing
          </div>
          <div className="mt-1 text-sm font-medium text-foreground">
            {currentTrack ? displayTitle : "Nothing playing"}
          </div>
          <div className="text-xs text-muted-foreground">
            {currentTrack ? currentTrack.author : "Pick a track to resume"}
          </div>
        </div>
        <span className="rounded-full border border-border/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {isPlaying ? "Playing" : "Paused"}
        </span>
      </div>

      {currentTrack ? (
        <>
          <div className="mt-3 flex items-center gap-3">
            <div className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-full shadow-lg ring-2 ring-inset ring-white/20 bg-zinc-900 border border-zinc-800 flex items-center justify-center vin-disc-rotate ${isPlaying ? "" : "pause"}`}>
              {currentTrack.cover?.trim() ? (
                <CoverImage
                  src={currentTrack.cover}
                  alt={displayTitle}
                  containerClassName="h-full w-full rounded-full"
                  className="rounded-full"
                  sizes="64px"
                  showPlaceholder={false}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-850 to-zinc-950">
                  <div className="size-16 rounded-full border border-zinc-800/60 flex items-center justify-center">
                    <div className="size-12 rounded-full border border-zinc-800/65 flex items-center justify-center">
                      <div className="size-7 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                        <div className="size-2 rounded-full bg-zinc-950" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="truncate text-sm font-medium text-foreground">
                {displayTitle}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {currentTrack.author}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {currentTrack.album || "Single"}
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
            <div className="rounded-md border border-border/70 px-2 py-1.5">
              Plays
              <div className="mt-0.5 text-xs font-medium text-foreground">
                {formatCount(currentTrack.stats?.play_count ?? 0)}
              </div>
            </div>
            <div className="rounded-md border border-border/70 px-2 py-1.5">
              Likes
              <div className="mt-0.5 text-xs font-medium text-foreground">
                {formatCount(currentTrack.stats?.digg_count ?? 0)}
              </div>
            </div>
            <div className="rounded-md border border-border/70 px-2 py-1.5">
              Collects
              <div className="mt-0.5 text-xs font-medium text-foreground">
                {formatCount(currentTrack.stats?.collect_count ?? 0)}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="py-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border/70 bg-card/85 text-muted-foreground">
            <Play className="h-7 w-7" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Nothing playing
          </p>
        </div>
      )}
    </section>
  );
}

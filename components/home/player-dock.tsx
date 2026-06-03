"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Music2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  Volume2,
  X,
  XIcon,
  Minimize,
  Minimize2Icon,
  Minus,
} from "lucide-react";

import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AudioProgressSlider } from "./audio-progress-slider";
import type { TikTokTrack } from "./data";
import { formatPlaybackTime } from "./format";
import { CardFrame } from "./shared";
import type { PlaybackMode } from "@/store/vin-music-player-store";

export type PlayerDockMode = "mini" | "expanded" | "hidden";

export type PlayerDockTrack = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  duration: number;
};

export function tikTokTrackToDockTrack(track: TikTokTrack): PlayerDockTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    coverUrl: track.avatarUrl ?? "",
    duration: track.auditionDuration,
  };
}

function resolveCoverUrl(url: string | null | undefined): string | null {
  if (url == null || typeof url !== "string") return null;
  const trimmed = url.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function TrackThumbnail({
  trackId,
  coverUrl,
  artist,
  sizeClass = "size-9",
}: {
  trackId: string;
  coverUrl: string | null | undefined;
  artist: string;
  sizeClass?: string;
}) {
  const resolvedSrc = resolveCoverUrl(coverUrl);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasError = !resolvedSrc || failedSrc === resolvedSrc;

  const initials = useMemo(() => {
    const parts = artist.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
    }
    return artist.trim().slice(0, 2).toUpperCase() || "♪";
  }, [artist]);

  return (
    <div
      className={`relative ${sizeClass} shrink-0 overflow-hidden rounded-md border border-black/5 bg-muted shadow-[0_6px_16px_rgba(17,17,17,0.06)]`}
    >
      <div className="flex size-full items-center justify-center bg-gradient-to-br from-violet-500/20 via-indigo-500/10 to-slate-500/20 text-[9px] font-bold text-violet-700/80 select-none uppercase">
        {initials}
      </div>
      {!hasError && resolvedSrc ? (
        <Image
          key={`${trackId}:${resolvedSrc}`}
          src={resolvedSrc}
          alt=""
          fill
          unoptimized
          referrerPolicy="no-referrer"
          className="absolute inset-0 size-full object-cover"
          onError={() => setFailedSrc(resolvedSrc)}
        />
      ) : null}
    </div>
  );
}

type PlayerDockProps = {
  track: PlayerDockTrack | null;
  activeSource: string;
  isPlaying: boolean;
  dockMode: PlayerDockMode;
  currentTime: number;
  duration: number;
  volume: number;
  playbackMode: PlaybackMode;
  isCurrentTrackSaved: boolean;
  onToggleDockExpanded: () => void;
  onHideDock: () => void;
  onShowDock: () => void;
  onPlayPrevious: () => void;
  onTogglePlayback: () => void;
  onPlayNext: () => void;
  onPlaybackModeChange: (nextMode: PlaybackMode) => void;
  onToggleSaveCurrentTrack: () => void;
  onSeek: (nextTime: number) => void;
  onVolumeChange: (nextVolume: number) => void;
  queue: PlayerDockTrack[];
  onRemoveFromQueue: (trackId: string) => void;
  onClearQueue: () => void;
  onMoveQueueItem: (trackId: string, direction: "up" | "down") => void;
};

const playbackModeButtons: Array<{
  mode: PlaybackMode;
  label: string;
  tooltip: string;
}> = [
  { mode: "normal", label: "Normal playback", tooltip: "Normal playback" },
  { mode: "repeat-all", label: "Repeat all", tooltip: "Repeat playlist" },
  {
    mode: "repeat-one",
    label: "Repeat current track",
    tooltip: "Repeat current sound",
  },
  { mode: "shuffle", label: "Shuffle", tooltip: "Shuffle discoveries" },
  {
    mode: "autoplay-next",
    label: "Autoplay next discovery",
    tooltip: "Continuous exploration",
  },
];

const dockShellClass =
  "mx-auto w-full max-w-3xl overflow-hidden !border-border/40 !bg-card/90 !text-foreground shadow-2xl backdrop-blur-2xl transition-colors duration-200 group-hover/dock:!border-border/60 hover:shadow-3xl";

const dockInteractiveClass =
  "cursor-pointer rounded-[inherit] outline-none transition-colors hover:!bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

const controlButtonClass =
  "inline-flex size-7 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-all duration-200 hover:border-border hover:bg-muted hover:text-foreground cursor-pointer";

const playButtonClass =
  "inline-flex size-8 items-center justify-center rounded-full border border-transparent bg-foreground text-background shadow-md transition-all duration-200 hover:bg-foreground/90 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";

const saveButtonClass =
  "inline-flex size-7 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-all duration-200 hover:border-border hover:bg-muted cursor-pointer";

const subtleTextClass = "text-muted-foreground";

function stopControlClick(event: React.MouseEvent) {
  event.stopPropagation();
}

export function PlayerDock({
  track,
  activeSource,
  isPlaying,
  dockMode,
  currentTime,
  duration,
  volume,
  playbackMode,
  isCurrentTrackSaved,
  onToggleDockExpanded,
  onHideDock,
  onShowDock,
  onPlayPrevious,
  onTogglePlayback,
  onPlayNext,
  onPlaybackModeChange,
  onToggleSaveCurrentTrack,
  onSeek,
  onVolumeChange,
  queue,
  onRemoveFromQueue,
  onClearQueue,
  onMoveQueueItem,
}: PlayerDockProps) {
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const openTimeoutRef = useRef<number | null>(null);

  if (!track) {
    return null;
  }

  const totalDuration = duration || track.duration;

  const resolveSliderValue = (value: number | readonly number[]) =>
    Array.isArray(value) ? (value[0] ?? 0) : value;

  const cancelCloseVolume = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const scheduleOpenVolume = () => {
    cancelCloseVolume();

    if (isVolumeOpen || openTimeoutRef.current) {
      return;
    }

    openTimeoutRef.current = window.setTimeout(() => {
      setIsVolumeOpen(true);
      openTimeoutRef.current = null;
    }, 260);
  };

  const cancelOpenVolume = () => {
    if (openTimeoutRef.current) {
      window.clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
  };

  const scheduleCloseVolume = () => {
    cancelOpenVolume();
    cancelCloseVolume();
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsVolumeOpen(false);
      closeTimeoutRef.current = null;
    }, 180);
  };

  if (dockMode === "hidden") {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onShowDock}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-md backdrop-blur-xl transition hover:bg-muted cursor-pointer"
          aria-label="Show player"
        >
          <Music2 className="size-3.5 text-primary" />
          <span className="max-w-[140px] truncate">{track.title}</span>
          <ChevronUp className="size-3.5 text-muted-foreground" />
        </button>
      </div>
    );
  }

  const isMini = dockMode === "mini";

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4"
      data-player-dock-mode={dockMode}
    >
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <CardFrame className={`group/dock ${dockShellClass}`}>
          <motion.div
            layout
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`relative ${dockInteractiveClass} ${isMini ? "px-3 py-2" : "px-3 py-2.5 sm:px-4 sm:py-3"}`}
            onClick={onToggleDockExpanded}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onToggleDockExpanded();
              }
            }}
            role="button"
            tabIndex={0}
            title={
              isMini
                ? "Click to expand player controls"
                : "Click to collapse to mini player"
            }
            aria-label={
              isMini ? "Expand player controls" : "Collapse player controls"
            }
          >
            {isMini ? (
              <div className="flex items-center gap-2.5">
                <TrackThumbnail
                  trackId={track.id}
                  coverUrl={track.coverUrl}
                  artist={track.artist}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-tight text-foreground">
                    {track.title}
                  </p>
                  <p className="flex items-center gap-1 truncate text-xs leading-tight text-muted-foreground">
                    <span className="truncate">{track.artist}</span>
                    <span className="hidden shrink-0 text-[10px] text-primary/80 group-hover/dock:inline sm:inline">
                      · Expand
                    </span>
                  </p>
                </div>

                <TooltipProvider delay={300}>
                  <Tooltip>
                    <TooltipTrigger>
                      <button
                        type="button"
                        onClick={(event) => {
                          stopControlClick(event);
                          onToggleDockExpanded();
                        }}
                        className={`${controlButtonClass} text-primary`}
                        aria-label="Expand player controls"
                      >
                        <ChevronUp className="size-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      sideOffset={8}
                      className="rounded-md border border-border bg-popover text-popover-foreground px-2 py-1 text-[10px] font-medium"
                    >
                      Expand controls
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <button
                  type="button"
                  onClick={(event) => {
                    stopControlClick(event);
                    onTogglePlayback();
                  }}
                  disabled={!activeSource}
                  className={playButtonClass}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="size-3.5" />
                  ) : (
                    <Play className="size-3.5 translate-x-px fill-current" />
                  )}
                </button>

                <TooltipProvider delay={300}>
                  <Tooltip>
                    <TooltipTrigger>
                      <button
                        type="button"
                        onClick={(event) => {
                          stopControlClick(event);
                          onHideDock();
                        }}
                        className={controlButtonClass}
                        aria-label="Hide player"
                      >
                        <ChevronDown className="size-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      sideOffset={8}
                      className="rounded-md border border-border bg-popover text-popover-foreground px-2 py-1 text-[10px] font-medium"
                    >
                      Hide player
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                  <TrackThumbnail
                    trackId={track.id}
                    coverUrl={track.coverUrl}
                    artist={track.artist}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {track.title}
                    </p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <span className="truncate">{track.artist}</span>
                      <span className="hidden shrink-0 text-[10px] text-primary/80 group-hover/dock:inline sm:inline">
                        · Collapse
                      </span>
                    </p>
                  </div>
                  <TooltipProvider delay={300}>
                    <Tooltip>
                      <TooltipTrigger
                        type="button"
                        onClick={(event) => {
                          stopControlClick(event);
                          onToggleDockExpanded();
                        }}
                        className={controlButtonClass}
                        aria-label="Collapse to mini player"
                      >
                        <ChevronDown className="size-3.5" />
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        sideOffset={8}
                        className="rounded-md border border-border bg-popover text-popover-foreground px-2 py-1 text-[10px] font-medium"
                      >
                        Collapse to mini
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider delay={300}>
                    <Tooltip>
                      <TooltipTrigger
                        type="button"
                        onClick={(event) => {
                          stopControlClick(event);
                          onHideDock();
                        }}
                        className={`${controlButtonClass} opacity-70`}
                        aria-label="Hide player"
                      >
                        <Minus className="size-3.5" />
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        sideOffset={8}
                        className="rounded-md border border-border bg-popover text-popover-foreground px-2 py-1 text-[10px] font-medium"
                      >
                        Hide player
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div
                  className="flex flex-wrap items-center gap-2"
                  onClick={stopControlClick}
                >
                  <button
                    type="button"
                    onClick={onPlayPrevious}
                    className={controlButtonClass}
                    aria-label="Previous track"
                  >
                    <SkipBack className="size-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={onTogglePlayback}
                    disabled={!activeSource}
                    className={playButtonClass}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="size-3.5" />
                    ) : (
                      <Play className="size-3.5 translate-x-px fill-current" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onPlayNext}
                    className={controlButtonClass}
                    aria-label="Next track"
                  >
                    <SkipForward className="size-3.5" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <AudioProgressSlider
                      audioUrl={activeSource}
                      currentTime={currentTime}
                      duration={totalDuration}
                      onSeek={onSeek}
                      showFooter={false}
                      noFrame
                    />
                  </div>

                  <div
                    className={`hidden min-w-16 text-right text-[11px] tabular-nums sm:block ${subtleTextClass}`}
                  >
                    {formatPlaybackTime(currentTime)} /{" "}
                    {formatPlaybackTime(totalDuration)}
                  </div>

                  <TooltipProvider delay={0}>
                    <Tooltip>
                      <TooltipTrigger
                        type="button"
                        onClick={onToggleSaveCurrentTrack}
                        aria-label={
                          isCurrentTrackSaved
                            ? "Remove saved track"
                            : "Save track"
                        }
                        aria-pressed={isCurrentTrackSaved}
                        className={`inline-flex size-7 items-center justify-center rounded-full border transition-all duration-200 cursor-pointer ${
                          isCurrentTrackSaved
                            ? "border-border/60 bg-foreground text-background"
                            : saveButtonClass
                        }`}
                      >
                        <Bookmark
                          className="size-3.5"
                          fill={isCurrentTrackSaved ? "currentColor" : "none"}
                        />
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        sideOffset={8}
                        className="rounded-full border border-border bg-popover text-popover-foreground px-2.5 py-1 text-[10px] font-medium shadow-md"
                      >
                        {isCurrentTrackSaved ? "Saved sound" : "Save sound"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <AnimatePresence initial={false} mode="popLayout">
                  <motion.div
                    key="expanded-controls"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="overflow-hidden"
                    onClick={stopControlClick}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Popover
                        open={isVolumeOpen}
                        onOpenChange={setIsVolumeOpen}
                      >
                        <div className="relative">
                          <PopoverTrigger
                            type="button"
                            className="inline-flex size-7 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-muted cursor-pointer"
                            aria-label="Volume"
                            onPointerEnter={scheduleOpenVolume}
                            onPointerLeave={scheduleCloseVolume}
                          >
                            <Volume2 className="size-3.5" />
                          </PopoverTrigger>
                          <PopoverContent
                            side="top"
                            align="center"
                            sideOffset={8}
                            className="w-9 rounded-[16px] border border-border bg-popover text-popover-foreground px-1.5 py-2.5 shadow-lg backdrop-blur-xl"
                            onPointerEnter={cancelCloseVolume}
                            onPointerLeave={scheduleCloseVolume}
                          >
                            <div className="flex h-32 items-center justify-center py-2">
                              <Slider
                                orientation="vertical"
                                min={0}
                                max={1}
                                step={0.01}
                                value={[volume]}
                                onValueChange={(value) =>
                                  onVolumeChange(resolveSliderValue(value))
                                }
                                className="group/volume h-24 cursor-pointer **:data-[slot=slider-control]:min-h-0 **:data-[slot=slider-control]:h-full **:data-[slot=slider-track]:w-0.5 **:data-[slot=slider-track]:bg-muted **:data-[slot=slider-range]:bg-foreground **:data-[slot=slider-thumb]:size-2.5 **:data-[slot=slider-thumb]:border-foreground **:data-[slot=slider-thumb]:bg-background"
                                aria-label="Volume"
                              />
                            </div>
                          </PopoverContent>
                        </div>
                      </Popover>

                      <TooltipProvider delay={0}>
                        <div className="flex items-center rounded-full border border-border bg-muted/40 p-0.5 shadow-sm">
                          {playbackModeButtons.map(
                            ({ mode, label, tooltip }) => {
                              const isActive = mode === playbackMode;
                              const Icon =
                                mode === "repeat-all"
                                  ? Repeat
                                  : mode === "repeat-one"
                                    ? Repeat1
                                    : mode === "shuffle"
                                      ? Shuffle
                                      : mode === "autoplay-next"
                                        ? Sparkles
                                        : ChevronDown;

                              return (
                                <Tooltip key={mode}>
                                  <TooltipTrigger
                                    type="button"
                                    aria-label={label}
                                    aria-pressed={isActive}
                                    onClick={() => onPlaybackModeChange(mode)}
                                    className={`inline-flex size-7 items-center justify-center rounded-full border transition-colors cursor-pointer ${
                                      isActive
                                        ? "border-primary/20 bg-primary/10 text-primary"
                                        : "border-transparent bg-transparent text-muted-foreground hover:border-border hover:bg-background hover:text-foreground"
                                    }`}
                                  >
                                    <Icon
                                      className="size-3.5"
                                      fill={isActive ? "currentColor" : "none"}
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="top"
                                    sideOffset={8}
                                    className="rounded-full border border-border bg-popover text-popover-foreground px-2.5 py-1 text-[10px] font-medium shadow-md"
                                  >
                                    {tooltip}
                                  </TooltipContent>
                                </Tooltip>
                              );
                            },
                          )}
                        </div>
                      </TooltipProvider>
                    </div>
                    {/* Queue — always visible when expanded; empty-state explains the feature */}
                    <div className="mt-2 rounded-xl border border-border/60 bg-muted/40 p-2">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setIsQueueOpen((v) => !v)}
                          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                        >
                          <span>Queue</span>
                          {queue.length > 0 && (
                            <span className="rounded-full bg-foreground px-1.5 py-0.5 text-[9px] font-bold text-background leading-none">
                              {queue.length}
                            </span>
                          )}
                          <span className="text-[10px] opacity-50">
                            {isQueueOpen ? "▲" : "▼"}
                          </span>
                        </button>
                        {queue.length > 0 && (
                          <button
                            type="button"
                            onClick={onClearQueue}
                            className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-background hover:text-foreground cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      {isQueueOpen &&
                        (queue.length > 0 ? (
                          <div className="max-h-32 space-y-1 overflow-y-auto pr-1">
                            {queue.map((item, index) => (
                              <div
                                key={`${item.id}-${index}`}
                                className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5"
                              >
                                <TrackThumbnail
                                  trackId={item.id}
                                  coverUrl={item.coverUrl}
                                  artist={item.artist}
                                  sizeClass="size-7"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[11px] font-semibold text-foreground">
                                    {item.title}
                                  </p>
                                  <p className="truncate text-[10px] text-muted-foreground">
                                    {item.artist}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onMoveQueueItem(item.id, "up")}
                                  disabled={index === 0}
                                  className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:opacity-30 cursor-pointer"
                                  aria-label="Move up"
                                >
                                  <ArrowUp className="size-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onMoveQueueItem(item.id, "down")
                                  }
                                  disabled={index === queue.length - 1}
                                  className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:opacity-30 cursor-pointer"
                                  aria-label="Move down"
                                >
                                  <ArrowDown className="size-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onRemoveFromQueue(item.id)}
                                  className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground cursor-pointer"
                                  aria-label="Remove from queue"
                                >
                                  <X className="size-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-border bg-card px-3 py-4 text-center">
                            <p className="text-[11px] font-semibold text-foreground mb-1">
                              Queue is empty
                            </p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                              Use &ldquo;Add to queue&rdquo; or &ldquo;Play
                              next&rdquo; on any track to build your queue.
                              Otherwise tracks from your current playlist play
                              sequentially.
                            </p>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </CardFrame>
      </motion.div>
    </div>
  );
}

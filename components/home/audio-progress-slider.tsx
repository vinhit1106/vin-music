"use client";

import { useMemo } from "react";

import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type AudioProgressSliderProps = {
  audioUrl: string;
  currentTime: number;
  duration: number;
  onSeek: (nextTime: number) => void;
  compact?: boolean;
  showFooter?: boolean;
  /** When true, skips the outer card frame and renders just the bare slider.
   *  Use inside the player dock control row to avoid layout overflow. */
  noFrame?: boolean;
  className?: string;
};

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const resolveSliderValue = (value: number | readonly number[]) =>
  Array.isArray(value) ? (value[0] ?? 0) : value;

export function AudioProgressSlider({
  audioUrl,
  currentTime,
  duration,
  onSeek,
  compact = false,
  showFooter = true,
  noFrame = false,
  className,
}: AudioProgressSliderProps) {
  const hasAudioUrl = audioUrl.trim().length > 0;
  const totalDuration = duration > 0 ? duration : 0;
  const sliderValue = Math.min(currentTime, totalDuration || currentTime);

  const timeLabel = useMemo(() => formatTime(currentTime), [currentTime]);
  const durationLabel = useMemo(
    () => formatTime(totalDuration),
    [totalDuration],
  );

  const sliderNode = (
    <Slider
      min={0}
      max={Math.max(totalDuration, 1)}
      step={0.01}
      value={[sliderValue]}
      onValueChange={(value) => onSeek(resolveSliderValue(value))}
      thumbAlignment="center"
      className={cn(
        "w-full cursor-ew-resize",
        "**:data-[slot=slider-control]:min-h-0",
        "**:data-[slot=slider-control]:cursor-ew-resize",
        "**:data-[slot=slider-track]:h-1.25",
        "**:data-[slot=slider-track]:rounded-full",
        "**:data-[slot=slider-track]:bg-muted",
        "**:data-[slot=slider-track]:backdrop-blur-sm",
        "**:data-[slot=slider-track]:transition-colors",
        "group-hover:**:data-[slot=slider-track]:bg-muted/80",
        "**:data-[slot=slider-range]:rounded-full",
        "**:data-[slot=slider-range]:bg-foreground",
        "**:data-[slot=slider-range]:shadow-[0_0_14px_rgba(17,17,17,0.08)]",
        "**:data-[slot=slider-range]:transition-[background-color,box-shadow]",
        "group-hover:**:data-[slot=slider-range]:bg-foreground",
        "**:data-[slot=slider-thumb]:size-3.5",
        "**:data-[slot=slider-thumb]:border-border",
        "**:data-[slot=slider-thumb]:bg-background",
        "**:data-[slot=slider-thumb]:shadow-sm",
        "**:data-[slot=slider-thumb]:transition-all",
        "**:data-[slot=slider-thumb]:cursor-ew-resize",
        "group-hover:**:data-[slot=slider-thumb]:scale-[1.03]",
      )}
      aria-label="Audio progress"
      disabled={!totalDuration}
    />
  );

  // Frameless mode: just the slider, no outer card wrapper — for use inside player dock.
  if (noFrame) {
    return (
      <div className={cn("w-full", className)}>
        {sliderNode}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden border border-border bg-card/85 shadow-md backdrop-blur-2xl",
        "rounded-[18px]",
        compact ? "px-2.5 py-2" : "px-3 py-2.5 sm:px-4 sm:py-3",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_64%)]" />

      <div
        className={cn(
          "relative rounded-[14px] border border-border bg-muted/40 px-2.5 py-2 backdrop-blur-[2px] transition-colors duration-200",
          "group-hover:border-border/80 group-hover:bg-muted/50",
        )}
      >
        {sliderNode}
      </div>

      {showFooter ? (
        <div className="relative mt-2 flex items-center justify-between text-[10.5px] tracking-[0.02em] text-muted-foreground">
          <span>
            {hasAudioUrl ? (currentTime > 0 ? "Playing" : "Ready") : "Idle"}
          </span>
          <div className="ml-auto flex items-center gap-2 text-muted-foreground/80">
            <span className="tabular-nums text-foreground">{timeLabel}</span>
            <span className="text-muted-foreground/30">/</span>
            <span className="tabular-nums">{durationLabel}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

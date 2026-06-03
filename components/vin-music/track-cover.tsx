"use client";

import Image from "next/image";
import * as React from "react";
import { Album, Disc3, Music2 } from "lucide-react";

import { cn } from "@/lib/utils";

type CoverVariant = "music" | "disc" | "album";

const coverGradientByVariant: Record<CoverVariant, string> = {
  music: "from-violet-500/20 via-indigo-500/10 to-slate-500/20",
  disc: "from-cyan-500/20 via-sky-500/10 to-slate-500/20",
  album: "from-fuchsia-500/20 via-rose-500/10 to-slate-500/20",
};

function pickCoverVariant(seed: string): CoverVariant {
  if (!seed) return "music";
  const sum = Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const mod = sum % 3;
  if (mod === 1) return "disc";
  if (mod === 2) return "album";
  return "music";
}

type CoverImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  containerClassName?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  rounded?: string;
  showPlaceholder?: boolean;
  placeholderSeed?: string;
  onLoad?: () => void;
  onError?: () => void;
};

export function CoverImage({
  src,
  alt,
  className,
  containerClassName,
  fill = true,
  width,
  height,
  sizes,
  priority,
  rounded,
  showPlaceholder = true,
  placeholderSeed,
  onLoad,
  onError,
}: CoverImageProps) {
  const [loadedSrc, setLoadedSrc] = React.useState<string | null>(null);
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);
  const resolved = src?.trim() || null;
  const hasError = !resolved || failedSrc === resolved;
  const isLoaded = Boolean(resolved && loadedSrc === resolved && !hasError);

  const variant = React.useMemo(
    () => pickCoverVariant(placeholderSeed ?? alt),
    [placeholderSeed, alt],
  );
  const PlaceholderIcon =
    variant === "disc" ? Disc3 : variant === "album" ? Album : Music2;

  const imageNode =
    !hasError && resolved ? (
      <Image
        src={resolved}
        alt={alt}
        fill={fill}
        width={fill ? undefined : (width ?? 64)}
        height={fill ? undefined : (height ?? 64)}
        sizes={sizes ?? (fill ? "128px" : undefined)}
        priority={priority}
        referrerPolicy="no-referrer"
        unoptimized
        onLoad={() => {
          setLoadedSrc(resolved);
          onLoad?.();
        }}
        onError={() => {
          setFailedSrc(resolved);
          onError?.();
        }}
        className={cn(
          "object-cover transition-opacity duration-300",
          fill && "absolute inset-0 h-full w-full",
          isLoaded ? "opacity-100" : "opacity-0",
          className,
        )}
      />
    ) : null;

  if (!showPlaceholder) {
    if (!imageNode) return null;
    return (
      <div
        className={cn("relative overflow-hidden", containerClassName, rounded)}
      >
        {imageNode}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        containerClassName,
        rounded,
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br",
          coverGradientByVariant[variant],
        )}
      />
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/75">
        <PlaceholderIcon className="size-5" />
      </div>
      {imageNode}
    </div>
  );
}

type TrackCoverProps = {
  src?: string;
  alt: string;
  sizeClassName: string;
};

export const TrackCover = React.memo(function TrackCover({
  src,
  alt,
  sizeClassName,
}: TrackCoverProps) {
  return (
    <CoverImage
      src={src}
      alt={alt}
      showPlaceholder
      placeholderSeed={alt}
      containerClassName={cn(
        sizeClassName,
        "aspect-square shrink-0 rounded-lg border border-border/40 select-none",
      )}
      sizes="80px"
    />
  );
});

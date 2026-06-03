"use client";

import { BadgeCheck, Clapperboard, Clock3, Music2, Sparkles } from "lucide-react";
import { formatCount, formatDuration } from "@/lib/vin-music/format";
import type { MusicCardModel } from "@/lib/vin-music/types";
import { CoverImage } from "@/components/vin-music/track-cover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrackMetadata } from "@/src/lib/query/hooks";

type TrackDetailSheetProps = {
  track: MusicCardModel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function inferOriginal(title: string): boolean {
  return /original\s+sound/i.test(title);
}

export function TrackDetailSheet({
  track,
  open,
  onOpenChange,
}: TrackDetailSheetProps) {
  const metadataQuery = useTrackMetadata(track?.id, { enabled: open && Boolean(track) });
  const coverUrl = metadataQuery.data?.coverUrl || track?.cover || undefined;
  const isOriginal = track ? inferOriginal(track.title) : false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="left-auto right-0 w-full max-w-md border-l border-r-0 p-5">
        {!track ? null : (
          <>
            <SheetHeader>
              <SheetTitle className="text-base font-semibold">Track Details</SheetTitle>
              <SheetDescription>
                Metadata is fetched on demand and cached for future saves.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4">
              <div className="rounded-xl border border-border/50 bg-card/70 p-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-border/40 bg-gradient-to-br from-violet-500/20 via-indigo-500/10 to-slate-500/20">
                    {coverUrl ? (
                      <CoverImage
                        src={coverUrl}
                        alt={track.title}
                        containerClassName="h-full w-full"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/75">
                        <Music2 className="size-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{track.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{track.author}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                  <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock3 className="size-3.5" />
                    Duration
                  </div>
                  <div className="font-semibold">{formatDuration(track.duration)}</div>
                </div>
                <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                  <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clapperboard className="size-3.5" />
                    Video Count
                  </div>
                  {metadataQuery.isLoading ? (
                    <Skeleton className="h-5 w-16" />
                  ) : (
                    <div className="font-semibold">
                      {formatCount(metadataQuery.data?.videoCount ?? 0)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {isOriginal ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-primary">
                    <BadgeCheck className="size-3.5" />
                    Original Sound
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-muted-foreground">
                    <Sparkles className="size-3.5" />
                    Reused Sound
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

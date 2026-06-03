"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Folder, FolderOpen, Play, Ellipsis } from "lucide-react";
import type { Collection } from "@/lib/vin-music/collections-types";
import { useVinMusicPlayerStore } from "@/store/vin-music-player-store";
import { CoverImage } from "@/components/vin-music/track-cover";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CollectionCardProps = {
  collection: Collection;
};

export function CollectionCard({ collection }: CollectionCardProps) {
  const { id, name, description, items, isSystem, updatedAt } = collection;
  const trackCount = items.length;
  const firstItemCover = items[0]?.musicSnapshot?.cover;
  const playTrack = useVinMusicPlayerStore((state) => state.playTrack);
  const router = useRouter();

  const handlePlayCollection = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (items.length > 0) {
      const playlist = items.map((item) => item.musicSnapshot);
      playTrack(playlist[0]!, playlist);
    }
  };

  const renderCover = () => {
    if (trackCount === 0) {
      return (
        <div className="relative w-full h-24 rounded-lg bg-muted/40 flex items-center justify-center border border-border/40 select-none">
          <Folder className="size-6 text-muted-foreground/45" />
        </div>
      );
    }

    return (
      <div className="relative w-full h-24 rounded-lg overflow-hidden bg-muted border border-border/40 select-none">
        {firstItemCover?.trim() ? (
          <CoverImage
            src={firstItemCover}
            alt={name}
            containerClassName="h-full w-full transition-transform duration-500 hover:scale-105"
            sizes="240px"
          />
        ) : null}
      </div>
    );
  };

  return (
    <Card className="flex flex-col h-full bg-card/80 border-border/70 p-3 hover:shadow-md transition-shadow">
      <div className="flex-1 space-y-3">
        {/* Cover image preview box */}
        <Link href={`/app/collections/${id}`}>
          {renderCover()}
        </Link>

        {/* Title & Description row */}
        <div className="flex items-start justify-between gap-3 px-0.5">
          <div className="min-w-0 flex-1">
            <Link href={`/app/collections/${id}`}>
              <h3 className="truncate font-bold text-foreground hover:text-primary text-sm font-heading leading-tight transition-colors">
                {name}
              </h3>
            </Link>
            <p className="truncate text-[11.5px] text-muted-foreground mt-0.5 font-medium leading-normal">
              {description || (isSystem ? "Your collected tracks" : "No description")}
            </p>
          </div>

          {/* Quick Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center h-6 w-6 rounded-md cursor-pointer shrink-0 text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors">
              <Ellipsis className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => router.push(`/app/collections/${id}`)}>
                <FolderOpen className="mr-2 size-4" />
                Open Crate
              </DropdownMenuItem>
              <DropdownMenuItem disabled={trackCount === 0} onSelect={() => handlePlayCollection()}>
                <Play className="mr-2 size-4" />
                Play All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Footer Meta Details */}
      <div className="flex items-center justify-between text-[10.5px] text-muted-foreground/70 border-t border-border/40 pt-2 select-none mt-3.5 font-semibold">
        <span>{trackCount} track{trackCount !== 1 ? "s" : ""}</span>
        <span>Updated {new Date(updatedAt).toLocaleDateString()}</span>
      </div>
    </Card>
  );
}

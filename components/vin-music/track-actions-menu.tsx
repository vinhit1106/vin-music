"use client";

import { ListPlus, MoreHorizontal, Play, FolderHeart, Info } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MusicCardModel } from "@/lib/vin-music/types";
import { useVinMusicPlayerStore } from "@/store/vin-music-player-store";
import { useCollectionsStore } from "@/store/collections-store";
import { useAuthContext } from "@/src/lib/auth/hooks";
import { cn } from "@/lib/utils";

type TrackActionsMenuProps = {
  track: MusicCardModel;
  triggerClassName?: string;
  iconClassName?: string;
  align?: "start" | "end";
};

const defaultTriggerClassName =
  "inline-flex items-center justify-center size-10 md:size-7 rounded-lg cursor-pointer transition-all active:scale-95 duration-200 border border-border bg-background hover:bg-muted hover:text-foreground text-muted-foreground shrink-0";

export function TrackActionsMenu({
  track,
  triggerClassName,
  iconClassName = "size-3.5 md:size-3.5", // slightly scalable
  align = "end",
}: TrackActionsMenuProps) {
  const router = useRouter();
  const { user } = useAuthContext();
  const openCollectionPicker = useCollectionsStore((state) => state.openCollectionPicker);
  
  const playTrack = useVinMusicPlayerStore((state) => state.playTrack);
  const playNextTrack = useVinMusicPlayerStore((state) => state.playNextTrack);
  const addToQueue = useVinMusicPlayerStore((state) => state.addToQueue);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(defaultTriggerClassName, triggerClassName)}
        onClick={(event) => event.stopPropagation()}
        title="Track actions"
      >
        <MoreHorizontal className={iconClassName} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        <DropdownMenuItem onSelect={() => playTrack(track)}>
          <Play className="mr-2 size-3.5 fill-current" />
          Play now
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => playNextTrack(track)}>
          <ListPlus className="mr-2 size-3.5" />
          Play next
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => addToQueue(track)}>
          <ListPlus className="mr-2 size-3.5" />
          Add to queue
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            if (!user) {
              router.push("/login");
              return;
            }
            openCollectionPicker(track);
          }}
        >
          <FolderHeart className="mr-2 size-3.5" />
          Save to Crate
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push(`/app/music/${track.id}`)}>
          <Info className="mr-2 size-3.5" />
          View Details
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

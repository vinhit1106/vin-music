"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Folder,
  Play,
  Pause,
  User,
  FolderPlus
} from "lucide-react";

import { VinIcon, VinWordmark } from "./vin-logo";

import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/vin-music/track-cover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { vinMusicNavItems } from "@/components/vin-music/navigation";
import { useCollectionsStore } from "@/store/collections-store";
import { useVinMusicPlayerStore } from "@/store/vin-music-player-store";
import { useAuthContext } from "@/src/lib/auth/hooks";
import { usePlaylistDetails, usePlaylists } from "@/src/lib/query/hooks";

const visibleCollectionLimit = 6;

export function AppSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const setCreateModalOpen = useCollectionsStore((state) => state.setCreateModalOpen);
  const { isLoading: isSessionLoading, user } = useAuthContext();
  const playlistsQuery = usePlaylists({
    enabled: Boolean(user) && !isSessionLoading,
  });
  const visiblePlaylists = (playlistsQuery.data ?? []).slice(
    0,
    visibleCollectionLimit,
  );
  const playlistDetailsQuery = usePlaylistDetails(
    visiblePlaylists.map((playlist) => playlist.id),
    { enabled: visiblePlaylists.length > 0 },
  );
  const playlistCounts = new Map(
    (playlistDetailsQuery.data ?? []).map((detail) => [
      detail.playlist.id,
      detail.tracks.length,
    ]),
  );

  const currentTrack = useVinMusicPlayerStore((s) => s.currentTrack);
  const isPlaying = useVinMusicPlayerStore((s) => s.isPlaying);
  const togglePlayback = useVinMusicPlayerStore((s) => s.togglePlayback);

  const discoverItems = vinMusicNavItems.filter((item) => item.group === "Discover");
  const libraryItems = vinMusicNavItems.filter((item) => item.group === "Library");
  const systemItems = vinMusicNavItems.filter((item) => item.group === "System");

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="hidden border-r border-border bg-card/45 xl:flex xl:flex-col h-screen sticky top-0"
    >
      {/* Branding Header */}
      <div className={cn("flex h-12 items-center justify-between px-3 select-none relative", collapsed && "justify-center")}>
        <Link href="/app" className="flex items-center min-w-0">
          {collapsed ? (
            <VinIcon size={28} />
          ) : (
            <VinWordmark iconSize={28} showTagline={true} />
          )}
        </Link>
        {collapsed ? (
          <Button
            variant="outline"
            size="icon-xs"
            onClick={onToggle}
            className="absolute -right-3 top-3 z-40 h-6 w-6 cursor-pointer border border-border bg-background shadow-sm hover:bg-muted text-muted-foreground hover:text-foreground rounded-full flex items-center justify-center"
            aria-label="Expand sidebar"
          >
            <ChevronLeft className="size-3.5 rotate-180" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onToggle}
            className="h-6 w-6 cursor-pointer text-muted-foreground hover:text-foreground rounded-md"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
        )}
      </div>

      <Separator className="opacity-80" />

      {/* Navigation Links Scrollable */}
      <ScrollArea className="flex-1 px-2 py-2">
        <div className="space-y-4">
          
          {/* Section: Discover */}
          <div className="space-y-0.5">
            {!collapsed && (
              <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60 px-2.5 mb-1.5 select-none">
                Discover
              </div>
            )}
            {discoverItems.map((item) => {
              const Icon = item.icon;
              const active =
                (item.href as string) === "/app"
                  ? pathname === "/app"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex h-8 items-center rounded-lg px-2.5 text-[13px] font-semibold transition-colors",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {!collapsed && <span className="ml-3 truncate">{item.title}</span>}
                </Link>
              );
            })}
          </div>

          {/* Section: Library */}
          <div className="space-y-0.5">
            {!collapsed && (
              <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60 px-2.5 mb-1.5 select-none">
                Library
              </div>
            )}
            {libraryItems.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/app/collections"
                  ? pathname === "/app/collections"
                  : (item.href as string) === "/app"
                  ? pathname === "/app"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex h-8 items-center rounded-lg px-2.5 text-[13px] font-semibold transition-colors",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {!collapsed && <span className="ml-3 truncate">{item.title}</span>}
                </Link>
              );
            })}
          </div>

          <Separator className="mx-1 opacity-70" />

          {/* Primary CTA: New Collection */}
          <div className="px-1">
            <Button
              onClick={() => setCreateModalOpen(true)}
              variant="outline"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-foreground cursor-pointer h-8 rounded-lg font-semibold text-[12px] border-dashed border-border"
            >
              <FolderPlus className="size-3.5 mr-2 shrink-0" />
              {!collapsed ? "New Collection" : ""}
            </Button>
          </div>

          <Separator className="mx-1 opacity-70" />

          {/* Section: User Collections */}
          <div className="space-y-0.5">
            {!collapsed && (
              <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60 px-2.5 mb-1.5 select-none">
                Collections
              </div>
            )}
            <div className="space-y-0.5 max-h-[160px] overflow-y-auto pr-0.5 scrollbar-thin">
              {visiblePlaylists.length ? (
                visiblePlaylists.map((collection) => {
                  const active = pathname === `/app/collections/${collection.id}`;
                  return (
                    <Link
                      key={collection.id}
                      href={`/app/collections/${collection.id}`}
                      className={cn(
                        "group flex h-8 items-center rounded-lg px-2.5 text-[12.5px] font-medium transition-colors justify-between",
                        active
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Folder className="size-3.5 shrink-0 text-muted-foreground/80 group-hover:text-foreground transition-colors" />
                        {!collapsed && <span className="truncate">{collection.name}</span>}
                      </div>
                      {!collapsed && (
                        <span className="text-[10px] text-muted-foreground/50 font-bold px-1 group-hover:text-muted-foreground transition-colors">
                          {playlistCounts.get(collection.id) ?? 0}
                        </span>
                      )}
                    </Link>
                  );
                })
              ) : !collapsed && !playlistsQuery.isLoading ? (
                <div className="px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground/70">
                  No collections yet
                </div>
              ) : null}

              {!collapsed &&
                (playlistsQuery.data ?? []).length > visibleCollectionLimit && (
                  <Link
                    href="/app/collections"
                    className={cn(
                      "group flex h-8 items-center rounded-lg px-2.5 text-[12.5px] font-semibold transition-colors",
                      pathname === "/app/collections"
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                    )}
                  >
                    View all collections
                  </Link>
                )}
            </div>
          </div>

          <Separator className="mx-1 opacity-70" />

          {/* Section: System */}
          <div className="space-y-0.5">
            {systemItems.map((item) => {
              const Icon = item.icon;
              const active =
                (item.href as string) === "/app"
                  ? pathname === "/app"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex h-8 items-center rounded-lg px-2.5 text-[13px] font-semibold transition-colors",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {!collapsed && <span className="ml-3 truncate">{item.title}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </ScrollArea>

      <Separator className="opacity-80" />

      {/* Sidebar Footer: Compact Now Playing widget & User Badge */}
      <div className="flex flex-col gap-1.5 p-2 bg-muted/10 shrink-0">
        {/* Now Playing Widget */}
        {currentTrack && (
          <div className={cn(
            "p-1.5 rounded-lg border border-border bg-card flex items-center justify-between gap-2 shadow-sm select-none transition-all",
            collapsed && "justify-center p-1"
          )}>
            <div className="flex items-center gap-2 min-w-0">
              {currentTrack.cover?.trim() ? (
                <CoverImage
                  src={currentTrack.cover}
                  alt={currentTrack.title}
                  containerClassName="h-8 w-8 shrink-0 rounded-md border border-border/40"
                  sizes="32px"
                />
              ) : (
                <div className="h-8 w-8 shrink-0 rounded-md border border-border/40 bg-muted" />
              )}
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-[11.5px] font-bold text-foreground truncate leading-tight">
                    {currentTrack.title}
                  </p>
                  <p className="text-[9.5px] text-muted-foreground truncate leading-none mt-0.5 font-medium">
                    {currentTrack.author}
                  </p>
                </div>
              )}
            </div>
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayback();
                }}
                className="h-6 w-6 cursor-pointer shrink-0 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                {isPlaying ? <Pause className="size-3" /> : <Play className="size-3 fill-current" />}
              </Button>
            )}
          </div>
        )}

        {/* User Profile Badge */}
        <div className={cn(
          "flex items-center gap-2.5 p-1 rounded-lg border border-transparent select-none",
          collapsed && "justify-center"
        )}>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground border border-border/40">
            <User className="size-3.5" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-foreground leading-none truncate">
                Guest User
              </p>
              <p className="text-[9.5px] text-muted-foreground leading-none mt-0.5 truncate font-medium">
                guest@vinmusic.com
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Folder, Plus, Music4 } from "lucide-react";
import { createPortal } from "react-dom";

import { vinMusicNavItems } from "@/components/vin-music/navigation";
import { useCollectionsStore } from "@/store/collections-store";
import { usePlaylistDetails, usePlaylists } from "@/src/lib/query/hooks";
import { useAuthContext } from "@/src/lib/auth/hooks";
import { cn } from "@/lib/utils";

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  const pathname = usePathname();
  const setCreateModalOpen = useCollectionsStore((s) => s.setCreateModalOpen);
  const { isLoading: isSessionLoading, user } = useAuthContext();

  const playlistsQuery = usePlaylists({
    enabled: Boolean(user) && !isSessionLoading,
  });
  const visiblePlaylists = (playlistsQuery.data ?? []).slice(0, 8);
  const playlistDetailsQuery = usePlaylistDetails(
    visiblePlaylists.map((p) => p.id),
    { enabled: visiblePlaylists.length > 0 },
  );
  const playlistCounts = new Map(
    (playlistDetailsQuery.data ?? []).map((d) => [d.playlist.id, d.tracks.length]),
  );

  // Body scroll lock
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Close drawer on route change
  const prevPathRef = useRef(pathname);
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  const discoverItems = vinMusicNavItems.filter((i) => i.group === "Discover");
  const libraryItems = vinMusicNavItems.filter((i) => i.group === "Library");
  const systemItems = vinMusicNavItems.filter((i) => i.group === "System");

  function NavLink({ item }: { item: (typeof vinMusicNavItems)[number] }) {
    const Icon = item.icon;
    const active =
      item.href === "/app/collections"
        ? pathname === "/app/collections"
        : (item.href as string) === "/app"
          ? pathname === "/app"
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link
        href={item.href}
        className={cn(
          "flex h-10 items-center gap-3 rounded-xl px-3 text-[13.5px] font-semibold transition-colors",
          active
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
      >
        <Icon className="size-4 shrink-0" />
        <span className="truncate">{item.title}</span>
      </Link>
    );
  }

  const content = (
    <>
      {/* Backdrop overlay — z-40, blocks all interaction with content below */}
      <div
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      {/* Drawer panel — z-50, slides in from left */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col bg-card shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <Link href="/app" className="flex items-center gap-2.5">
            <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Music4 className="size-3.5" />
            </span>
            <div className="flex flex-col justify-center">
              <span className="font-heading text-[13.5px] font-bold tracking-tight text-foreground leading-none">
                Vin Music
              </span>
              <span className="text-[9px] text-muted-foreground font-semibold leading-none mt-0.5 tracking-wide">
                Discover TikTok Sounds
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable nav content */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {/* Discover */}
          <div className="space-y-0.5">
            <div className="px-3 mb-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60 select-none">
              Discover
            </div>
            {discoverItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>

          {/* Library */}
          <div className="space-y-0.5">
            <div className="px-3 mb-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60 select-none">
              Library
            </div>
            {libraryItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>

          {/* Collections */}
          <div className="space-y-0.5">
            <div className="px-3 mb-1 flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60 select-none">
              <span>Collections</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setCreateModalOpen(true);
                }}
                className="flex items-center gap-0.5 text-primary hover:text-primary/80 transition-colors cursor-pointer normal-case tracking-normal font-bold text-[10px]"
              >
                <Plus className="size-3" />
                New
              </button>
            </div>

            {visiblePlaylists.length > 0 ? (
              <div className="space-y-0.5">
                {visiblePlaylists.map((collection) => {
                  const active = pathname === `/app/collections/${collection.id}`;
                  const count = playlistCounts.get(collection.id) ?? 0;
                  return (
                    <Link
                      key={collection.id}
                      href={`/app/collections/${collection.id}`}
                      className={cn(
                        "flex h-10 items-center justify-between gap-3 rounded-xl px-3 text-[13px] font-semibold transition-colors",
                        active
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Folder className="size-3.5 shrink-0 text-muted-foreground/70" />
                        <span className="truncate">{collection.name}</span>
                      </div>
                      <span className="shrink-0 text-[10.5px] font-bold text-muted-foreground/50 tabular-nums">
                        {count}
                      </span>
                    </Link>
                  );
                })}
                {(playlistsQuery.data ?? []).length > 8 && (
                  <Link
                    href="/app/collections"
                    className="flex h-9 items-center rounded-xl px-3 text-[12.5px] font-semibold text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
                  >
                    View all collections →
                  </Link>
                )}
              </div>
            ) : !playlistsQuery.isLoading ? (
              <div className="px-3 py-2 text-[12px] text-muted-foreground/60 font-medium">
                No collections yet. Create one above.
              </div>
            ) : (
              <div className="space-y-1.5 px-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-9 rounded-xl bg-muted/40 animate-pulse" />
                ))}
              </div>
            )}
          </div>

          {/* System */}
          <div className="space-y-0.5">
            <div className="px-3 mb-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60 select-none">
              System
            </div>
            {systemItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        </div>
      </div>
    </>
  );

  // Render via portal so it's a direct child of <body>, escaping all stacking contexts
  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}

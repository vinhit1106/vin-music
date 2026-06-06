"use client";

import { Suspense, useEffect, useMemo, useState } from "react";

import { AppSidebar } from "@/components/vin-music/app-sidebar";
import { CollectionPickerModal } from "@/components/vin-music/collection-picker-modal";
import { CreateCollectionModal } from "@/components/vin-music/create-collection-modal";
import { GlobalPlayerDock } from "@/components/vin-music/global-player-dock";
import { MobileNavDrawer } from "@/components/vin-music/mobile-nav-drawer";
import { TopBar } from "@/components/vin-music/top-bar";
import { getTrackDisplayTitle } from "@/lib/vin-music/display";
import { useVinMusicPlayerStore } from "@/store/vin-music-player-store";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/src/lib/auth/hooks";
import { useFavorites } from "@/src/lib/query/hooks";
import { trackToMusicCard } from "@/src/lib/query/mappers";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const dockMode = useVinMusicPlayerStore((s) => s.dockMode);
  const currentTrack = useVinMusicPlayerStore((s) => s.currentTrack);
  const hasTrack = currentTrack != null;
  const queue = useVinMusicPlayerStore((s) => s.queue);
  const { user } = useAuthContext();
  const favoritesQuery = useFavorites({ enabled: Boolean(user) });

  const savedCurrentTrack = useMemo(() => {
    if (!currentTrack) return null;
    const favorite = (favoritesQuery.data ?? []).find(
      (item) => item.track_id === currentTrack.id,
    );
    return favorite ? trackToMusicCard(favorite.track_data) : null;
  }, [currentTrack, favoritesQuery.data]);

  useEffect(() => {
    const defaultTitle = "VinVibe - Sound archive";
    if (!currentTrack) {
      document.title = defaultTitle;
      return;
    }

    document.title = `${getTrackDisplayTitle(savedCurrentTrack ?? currentTrack)} | VinVibe`;

    return () => {
      document.title = defaultTitle;
    };
  }, [currentTrack, savedCurrentTrack]);

  // Bottom padding must clear the player dock.
  // Expanded dock with non-empty queue can reach ~220px on small screens.
  const mainBottomPadding =
    !hasTrack || dockMode === "hidden"
      ? "pb-4"
      : dockMode === "expanded"
        ? queue.length > 0
          ? "pb-[280px] md:pb-[240px] xl:pb-[200px]"
          : "pb-[180px] md:pb-[160px] xl:pb-[140px]"
        : "pb-[4.75rem] md:pb-[4.5rem]";

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="flex min-h-screen min-w-0">
        {/* Desktop sidebar — only xl+ */}
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
        />

        <Suspense fallback={<div className="h-12" />}>
          <div
            className={cn(
              "flex min-h-screen min-w-0 flex-1 flex-col transition-[padding] duration-200",
              mainBottomPadding,
            )}
          >
            <TopBar onMobileNavOpen={() => setMobileNavOpen(true)} />
            <main className="min-w-0 flex-1 overflow-x-clip px-3 py-4 md:px-5 md:py-5">
              <div className="mx-auto w-full max-w-[1280px] min-w-0">{children}</div>
            </main>
          </div>
        </Suspense>
      </div>

      {/*
        Player dock — z-30 so it sits BELOW the mobile drawer overlay (z-40)
        and the drawer panel (z-50), but above the page content.
      */}
      <div className="relative z-30">
        <GlobalPlayerDock />
      </div>

      {/*
        Mobile nav drawer — portal-rendered directly into <body>,
        outside any stacking context. Overlay is z-40, panel is z-50.
      */}
      <MobileNavDrawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      <CollectionPickerModal />
      <CreateCollectionModal />
    </div>
  );
}

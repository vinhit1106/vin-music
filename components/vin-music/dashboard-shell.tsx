"use client";

import { Suspense, useState } from "react";

import { AppSidebar } from "@/components/vin-music/app-sidebar";
import { CollectionPickerModal } from "@/components/vin-music/collection-picker-modal";
import { CreateCollectionModal } from "@/components/vin-music/create-collection-modal";
import { GlobalPlayerDock } from "@/components/vin-music/global-player-dock";
import { MobileNavDrawer } from "@/components/vin-music/mobile-nav-drawer";
import { TopBar } from "@/components/vin-music/top-bar";
import { useVinMusicPlayerStore } from "@/store/vin-music-player-store";
import { cn } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const dockMode = useVinMusicPlayerStore((s) => s.dockMode);
  const hasTrack = useVinMusicPlayerStore((s) => s.currentTrack != null);
  const queue = useVinMusicPlayerStore((s) => s.queue);

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
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto flex min-h-screen">
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
            <main className="flex-1 px-3 py-4 md:px-5 md:py-5">
              <div className="mx-auto w-full max-w-[1280px]">{children}</div>
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

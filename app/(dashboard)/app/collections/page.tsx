"use client";

import * as React from "react";
import { FolderPlus } from "lucide-react";
import { EmptyState } from "@/components/vin-music/empty-state";
import { SectionHeading } from "@/components/vin-music/section-heading";
import { NowPlayingCard } from "@/components/vin-music/now-playing-card";
import { PageTransition } from "@/components/vin-music/page-transition";
import { useCollectionsStore } from "@/store/collections-store";
import { BackendCollectionCard } from "@/components/vin-music/backend-collection-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthContext } from "@/src/lib/auth/hooks";
import { usePlaylists } from "@/src/lib/query/hooks";

export default function CollectionsPage() {
  const setCreateModalOpen = useCollectionsStore((state) => state.setCreateModalOpen);
  const { isLoading: isSessionLoading, user } = useAuthContext();
  const playlistsQuery = usePlaylists({ enabled: Boolean(user) && !isSessionLoading });

  return (
    <PageTransition>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <SectionHeading
              title="Collections"
              subtitle="Crates of creator-used sound tracks, playlist assets, and saved TikTok audio files."
            />
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="gap-2 bg-primary text-primary-foreground font-semibold rounded-lg px-3 py-1.5 transition-colors cursor-pointer border-0 shadow-sm"
            >
              <FolderPlus className="h-4 w-4" />
              Create Collection
            </Button>
          </div>

          {isSessionLoading || playlistsQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={`collection-skeleton-${index}`} className="h-[172px] rounded-xl" />
              ))}
            </div>
          ) : !user ? (
            <EmptyState
              title="Sign in to manage collections"
              description="Log in to create collections and organize your saved sounds."
            />
          ) : playlistsQuery.isError ? (
            <EmptyState
              title="Could not load collections"
              description="Your collections are temporarily unavailable. Try refreshing the page."
            />
          ) : (playlistsQuery.data ?? []).length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
              {(playlistsQuery.data ?? []).map((pl) => (
                <BackendCollectionCard
                  key={pl.id}
                  playlist={{
                    id: pl.id,
                    name: pl.name,
                    description: pl.description,
                    updated_at: pl.updated_at,
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No collections yet"
              description="Create your first collection to organize sounds by mood, project, or set."
            />
          )}
        </div>

        <NowPlayingCard />
      </div>
    </PageTransition>
  );
}

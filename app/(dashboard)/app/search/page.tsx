"use client";

import { Search } from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { EmptyState } from "@/components/vin-music/empty-state";
import { MusicCard } from "@/components/vin-music/music-card";
import { NowPlayingCard } from "@/components/vin-music/now-playing-card";
import { PageTransition } from "@/components/vin-music/page-transition";
import { SectionHeading } from "@/components/vin-music/section-heading";
import { TrackDetailSheet } from "@/components/vin-music/track-detail-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchTracks } from "@/src/lib/query/hooks";
import type { MusicCardModel } from "@/lib/vin-music/types";

const recentSearchStorageKey = "vin-music-recent-searches";

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageWithParams />
    </Suspense>
  );
}

function SearchPageWithParams() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  return <SearchPageInner key={initialQ} initialQuery={initialQ} />;
}

function SearchPageInner({ initialQuery }: { initialQuery: string }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState<string>(() => initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState<string>(() => initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }
    const cached = window.localStorage.getItem(recentSearchStorageKey);
    if (!cached) {
      return [];
    }
    try {
      const parsed = JSON.parse(cached) as string[];
      return parsed.slice(0, 6);
    } catch {
      return [];
    }
  });
  const [isFocused, setIsFocused] = useState(false);
  const [detailTrack, setDetailTrack] = useState<MusicCardModel | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && document.activeElement !== inputRef.current) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const addRecentSearch = useCallback((value: string) => {
    const normalized = value.trim();
    if (!normalized) {
      return;
    }

    setRecentSearches((previous) => {
      const next = [
        normalized,
        ...previous.filter((item) => item !== normalized),
      ].slice(0, 6);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          recentSearchStorageKey,
          JSON.stringify(next),
        );
      }
      return next;
    });
  }, []);

  const lastSuccessfulQueryRef = useRef<string>("");
  const searchQuery = useSearchTracks(debouncedQuery);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!searchQuery.data || searchQuery.isError) return;
    const normalized = debouncedQuery.trim();
    if (!normalized) return;
    if (lastSuccessfulQueryRef.current === normalized) return;
    lastSuccessfulQueryRef.current = normalized;
    addRecentSearch(normalized);
  }, [addRecentSearch, debouncedQuery, searchQuery.data, searchQuery.isError]);

  const cards = useMemo<MusicCardModel[]>(() => {
    const pages = searchQuery.data?.pages ?? [];
    if (!pages.length) return [];

    const deduped = new Map<string, MusicCardModel>();
    for (const page of pages) {
      for (const track of page.tracks) {
        if (!deduped.has(track.id)) {
          deduped.set(track.id, track);
        }
      }
    }
    return Array.from(deduped.values());
  }, [searchQuery.data?.pages]);

  useEffect(() => {
    const node = loadMoreRef.current;
    const hasQuery = debouncedQuery.trim().length > 0;
    if (!node || !hasQuery) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (!searchQuery.hasNextPage || searchQuery.isFetchingNextPage) return;
        void searchQuery.fetchNextPage();
      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [
    debouncedQuery,
    searchQuery.fetchNextPage,
    searchQuery.hasNextPage,
    searchQuery.isFetchingNextPage,
    searchQuery,
  ]);

  return (
    <PageTransition>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
        <div className="space-y-6">
          <SectionHeading
            title="Search Sounds"
            subtitle="Find tracks by title, creator, artist, or album from TikTok video extraction."
          />

          <div className="rounded-lg border border-border/70 bg-card/80 p-4 md:p-5">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                className={`h-11 rounded-lg pl-10 text-base transition-shadow ${isFocused ? "ring-2 ring-ring/40" : ""}`}
                placeholder="Search TikTok sounds, artists, or songs"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    addRecentSearch(query);
                  }
                }}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {recentSearches.length ? (
                recentSearches.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="rounded-full border border-border/70 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    onClick={() => setQuery(item)}
                  >
                    {item}
                  </button>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">
                  Recent searches will appear here for faster discovery.
                </span>
              )}
            </div>
          </div>

          {searchQuery.isLoading ? (
            <div className="grid gap-2 grid-cols-1 md:gap-3">
              {Array.from({ length: 9 }).map((_, index) => (
                <Skeleton key={index} className="h-[76px] rounded-xl" />
              ))}
            </div>
          ) : searchQuery.isError ? (
            <EmptyState
              title="Search is taking a break"
              description="We could not load TikTok sound results right now. Try again in a few seconds."
            />
          ) : cards.length === 0 ? (
            <EmptyState
              title="No sounds matched your search"
              description="Search TikTok sounds, artists, or songs to discover tracks with creator performance signals."
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground font-semibold">
                  {cards.length} sound{cards.length !== 1 ? "s" : ""} found
                </p>
                <Button variant="outline" size="sm" onClick={() => setQuery("")} className="h-8 text-xs font-semibold cursor-pointer">
                  Clear search
                </Button>
              </div>
              <div className="grid gap-2 grid-cols-1 md:gap-3">
                {cards.map((music) => (
                  <MusicCard
                    key={music.id}
                    music={music}
                    onOpenDetails={(track) => {
                      setDetailTrack(track);
                      setIsDetailOpen(true);
                    }}
                  />
                ))}
              </div>
              <div ref={loadMoreRef} className="h-6 w-full" aria-hidden />
              {searchQuery.isFetchingNextPage ? (
                <div className="grid gap-2 grid-cols-1 md:gap-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-[76px] rounded-xl" />
                  ))}
                </div>
              ) : null}
              {!searchQuery.hasNextPage ? (
                <p className="text-center text-xs text-muted-foreground">
                  No more results.
                </p>
              ) : null}
            </>
          )}
        </div>
        <NowPlayingCard />
      </div>
      <TrackDetailSheet
        track={detailTrack}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </PageTransition>
  );
}

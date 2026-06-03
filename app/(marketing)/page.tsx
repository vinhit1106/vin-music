"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Clapperboard,
  Clock,
  Compass,
  Folder,
  FolderHeart,
  ListPlus,
  Music2,
  Pause,
  Play,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Volume2,
} from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
  );
}

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MusicCard } from "@/components/vin-music/music-card";
import { ThemeToggle } from "@/components/vin-music/theme-toggle";
import { GlobalPlayerDock } from "@/components/vin-music/global-player-dock";
import { CollectionPickerModal } from "@/components/vin-music/collection-picker-modal";
import { CreateCollectionModal } from "@/components/vin-music/create-collection-modal";
import { useAuthContext } from "@/src/lib/auth/hooks";
import { useExploreTracks } from "@/src/lib/query/hooks";
import { trackToMusicCard } from "@/src/lib/query/mappers";
import { formatCount } from "@/lib/vin-music/format";

// ---------------------------------------------------------------------------
// Freshness label: derives "Updated X min ago" from generatedAt timestamp.
// ---------------------------------------------------------------------------
function useFreshnessLabel(generatedAt: string | undefined): string | null {
  return useMemo(() => {
    if (!generatedAt) return null;
    const diff = Math.floor(
      (Date.now() - new Date(generatedAt).getTime()) / 60_000,
    );
    if (diff < 1) return "Updated just now";
    if (diff === 1) return "Updated 1 min ago";
    return `Updated ${diff} min ago`;
  }, [generatedAt]);
}

const EXPLORE_PAGES = [0, 1, 2, 3, 4] as const;

export default function RebuiltLandingPage() {
  const { user, isLoading: isSessionLoading } = useAuthContext();

  const [scrolled, setScrolled] = useState(false);
  const [explorePage, setExplorePage] = useState(0);
  const [exploreTab, setExploreTab] = useState<"trending" | "random" | "recent">("trending");
  const [showcaseTab, setShowcaseTab] = useState<"search" | "collections" | "history" | "player">("search");

  // Fetch live explore data using query hooks
  const exploreQuery = useExploreTracks("trending", explorePage);

  const rawTracks = useMemo(
    () => (exploreQuery.data?.tracks ?? []).map(trackToMusicCard),
    [exploreQuery.data],
  );

  // Derive filtered explore tracks based on selected tab
  const exploreTracks = useMemo(() => {
    if (exploreTab === "random") {
      // Deterministic pseudo-shuffle based on track ID length/character codes to prevent constant layout shifting on every render
      return [...rawTracks].sort((a, b) => {
        const scoreA = a.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const scoreB = b.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        return (scoreA % 7) - (scoreB % 7);
      });
    }
    if (exploreTab === "recent") {
      // Return reversed list to simulate recently discovered
      return [...rawTracks].reverse();
    }
    return rawTracks;
  }, [rawTracks, exploreTab]);

  const freshnessLabel = useFreshnessLabel(exploreQuery.data?.generatedAt);

  // Monitor scroll for header background
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleDiscoverMore() {
    setExplorePage((current) => {
      const candidates = EXPLORE_PAGES.filter((p) => p !== current);
      return candidates[Math.floor(Math.random() * candidates.length)]!;
    });
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background font-sans text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Sleek Grid Background */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* HEADER */}
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? "border-border/60 bg-background/80 backdrop-blur-md"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-foreground text-background">
              <Music2 className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-widest uppercase text-foreground leading-none">
                Vin Music
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 select-none font-medium">
                TikTok Sound discovery
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <a
              href="#how-it-works"
              className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              Workflow
            </a>
            <a
              href="#explore"
              className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              Live Explore
            </a>
            <a
              href="#showcase"
              className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              Showcase
            </a>
            <a
              href="#features"
              className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <GithubIcon className="size-4.5" />
            </a>

            {isSessionLoading ? (
              <Skeleton className="h-9 w-28 rounded-lg" />
            ) : user ? (
              <Link
                href="/app"
                className={cn(buttonVariants({ size: "sm" }), "h-9 px-4 font-bold cursor-pointer")}
              >
                Open Dashboard
                <ArrowRight className="size-4" />
              </Link>
            ) : (
              <Link
                href="/login"
                className={cn(buttonVariants({ size: "sm" }), "h-9 px-4 font-bold cursor-pointer")}
              >
                Get Started
                <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* HERO SECTION */}
        <section className="pt-32 pb-16 md:pt-40 md:pb-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/60 px-3.5 py-1.5 text-xs text-muted-foreground font-semibold mb-6">
            <Sparkles className="size-3.5 text-primary animate-pulse" />
            TikTok Sound Discovery & Library
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl leading-[1.05] bg-gradient-to-b from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            Search, Save, and Organize TikTok Audio
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base md:text-lg leading-relaxed text-muted-foreground">
            Vin Music is a lightweight, product-first discovery and organization tool built specifically for TikTok sound culture. Preview tracks instantly and catalog them into custom collections.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {isSessionLoading ? (
              <Skeleton className="h-10 w-36 rounded-lg mx-auto sm:mx-0" />
            ) : (
              <Link
                href={user ? "/app" : "/login"}
                className={cn(buttonVariants({ variant: "default" }), "h-10 px-6 font-bold cursor-pointer")}
              >
                Open Dashboard
              </Link>
            )}
            <a
              href="#features"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-10 px-6 font-bold bg-card/30 border-border/70 hover:bg-muted/40 cursor-pointer"
              )}
            >
              View Features
            </a>
          </div>

          {/* Real Dashboard UI Mockup */}
          <div className="mt-14 md:mt-20 overflow-hidden rounded-2xl border border-border/60 bg-card/45 shadow-2xl backdrop-blur-xs">
            {/* Title Bar */}
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="size-3 rounded-full bg-red-500/80" />
                <span className="size-3 rounded-full bg-yellow-500/80" />
                <span className="size-3 rounded-full bg-green-500/80" />
              </div>
              <div className="text-[11px] font-semibold text-muted-foreground tracking-wider select-none font-mono">
                vin-music-dashboard.app
              </div>
              <div className="w-12" /> {/* Spacer */}
            </div>

            {/* Simulated Dashboard content */}
            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] md:grid-cols-[200px_1fr] h-[340px] md:h-[480px] text-left overflow-hidden bg-background/50">
              {/* Sidebar */}
              <div className="hidden sm:flex border-r border-border/40 bg-muted/20 p-3 flex-col justify-between select-none">
                <div className="space-y-4">
                  <div className="px-2 text-[9px] uppercase tracking-widest text-muted-foreground font-bold">
                    Discover
                  </div>
                  <div className="space-y-1">
                    {[
                      { icon: Compass, label: "Explore" },
                      { icon: Search, label: "Search" },
                      { icon: Clapperboard, label: "Import URL" },
                    ].map((item, idx) => (
                      <div
                        key={item.label}
                        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold ${
                          idx === 0
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                        }`}
                      >
                        <item.icon className="size-4 shrink-0" />
                        <span className="hidden sm:inline">{item.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="px-2 pt-2 text-[9px] uppercase tracking-widest text-muted-foreground font-bold">
                    Your Library
                  </div>
                  <div className="space-y-1">
                    {[
                      { icon: FolderHeart, label: "Favorites" },
                      { icon: Clock, label: "History" },
                      { icon: Folder, label: "Collections" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                      >
                        <item.icon className="size-4 shrink-0" />
                        <span className="hidden sm:inline">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-card/60 p-2 border border-border/40 text-[10px] space-y-1 hidden sm:block">
                  <p className="font-semibold truncate">Logged out</p>
                  <p className="text-muted-foreground text-[9px] leading-tight">
                    Login to backup library.
                  </p>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="p-4 md:p-6 overflow-y-auto space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-base md:text-xl font-bold tracking-tight font-heading">
                      Welcome to Vin Music
                    </h2>
                    <p className="text-xs text-muted-foreground max-w-md">
                      Extract audio from TikTok links and organize them into curated collections.
                    </p>
                  </div>

                  {/* Simulated Search bar */}
                  <div className="flex h-9 rounded-lg border border-input bg-background/50 px-3 items-center text-xs text-muted-foreground gap-2 max-w-lg select-none">
                    <Search className="size-3.5" />
                    <span>Search songs, artists, or paste a TikTok URL…</span>
                  </div>

                  {/* Simulated Tracks List */}
                  <div className="space-y-2 max-w-2xl">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Featured Sounds
                    </div>
                    {[
                      { title: "Midnight Drive", artist: "Aurora Lane", duration: "3:24", stats: "2.4M plays" },
                      { title: "Afterglow", artist: "Neon Coast", duration: "2:58", stats: "890K plays" },
                      { title: "Lost Signals", artist: "Atlas Echo", duration: "3:11", stats: "1.1M plays" },
                    ].map((track, i) => (
                      <div
                        key={track.title}
                        className="flex items-center justify-between rounded-lg border border-border/40 bg-card/50 p-2 text-xs hover:border-border/80 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex size-8 items-center justify-center rounded bg-muted/60 text-muted-foreground select-none font-bold text-[10px]">
                            {i + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-foreground">{track.title}</div>
                            <div className="truncate text-[10px] text-muted-foreground">{track.artist}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[9px] text-muted-foreground select-none hidden sm:inline">{track.stats}</span>
                          <span className="rounded bg-muted border border-border/20 px-1 py-0.5 text-[9px] text-muted-foreground font-bold select-none">{track.duration}</span>
                          <button className="flex size-6 items-center justify-center rounded-full bg-foreground text-background cursor-pointer">
                            <Play className="size-2.5 fill-current translate-x-px" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated Floating Player Dock */}
                <div className="rounded-lg border border-border/40 bg-card/80 p-2.5 flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="size-8 rounded bg-muted flex items-center justify-center text-muted-foreground">
                      <Music2 className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold leading-tight">Afterglow</p>
                      <p className="truncate text-[9px] text-muted-foreground">Neon Coast</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button className="size-7 rounded-full bg-muted border border-border/20 flex items-center justify-center text-muted-foreground">
                      <SlidersHorizontal className="size-3" />
                    </button>
                    <button className="size-8 rounded-full bg-foreground text-background flex items-center justify-center">
                      <Pause className="size-3 fill-current" />
                    </button>
                    <div className="w-16 h-1 bg-muted rounded-full overflow-hidden hidden sm:block">
                      <div className="w-2/5 h-full bg-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-16 md:py-24 border-t border-border/40">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs uppercase tracking-widest text-primary font-bold">Workflow</span>
            <h2 className="text-3xl font-extrabold tracking-tight font-heading">
              Discover and Archive in 3 Steps
            </h2>
            <p className="text-sm text-muted-foreground">
              A workflow designed to help you organize sounds fast without distraction.
            </p>
          </div>

          <div className="grid gap-8 mt-12 md:grid-cols-3">
            {/* Step 1 */}
            <div className="rounded-xl border border-border/60 bg-card/30 p-6 flex flex-col justify-between gap-6">
              <div className="space-y-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                  1
                </div>
                <h3 className="text-lg font-bold">Search or Import</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Find trending sounds, query by keyword, or extract audio instantly from any TikTok video by pasting its link.
                </p>
              </div>
              {/* Step 1 UI Visual */}
              <div className="rounded-lg border border-border/40 bg-background/50 p-3 space-y-2">
                <div className="flex h-8 rounded-md border border-input bg-card px-2.5 items-center text-[10px] text-muted-foreground gap-1.5 select-none">
                  <Search className="size-3" />
                  <span>https://www.tiktok.com/@creator/video/7136...</span>
                </div>
                <Button size="sm" className="h-7 w-full text-[10px] font-bold">
                  Extract Audio
                </Button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-xl border border-border/60 bg-card/30 p-6 flex flex-col justify-between gap-6">
              <div className="space-y-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                  2
                </div>
                <h3 className="text-lg font-bold">Preview Tracks</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Audition hooks instantly. No long buffering, no distractions. The persistent player keeps playing as you explore.
                </p>
              </div>
              {/* Step 2 UI Visual */}
              <div className="rounded-lg border border-border/40 bg-background/50 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded bg-primary/10 flex items-center justify-center text-primary font-semibold text-[9px] animate-pulse">
                    EQ
                  </div>
                  <div>
                    <div className="text-[10px] font-bold leading-tight">Midnight Drive</div>
                    <div className="text-[8px] text-muted-foreground">Aurora Lane</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-muted-foreground bg-muted border border-border/30 px-1 py-0.5 rounded">0:23</span>
                  <div className="size-6 rounded-full bg-foreground text-background flex items-center justify-center">
                    <Pause className="size-2 fill-current" />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-xl border border-border/60 bg-card/30 p-6 flex flex-col justify-between gap-6">
              <div className="space-y-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                  3
                </div>
                <h3 className="text-lg font-bold">Save & Categorize</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Build your collection. Group sounds into folders, favorite tracks, and retrieve them on the web dashboard.
                </p>
              </div>
              {/* Step 3 UI Visual */}
              <div className="rounded-lg border border-border/40 bg-background/50 p-2.5 space-y-1.5">
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Save to Collection</div>
                {[
                  { name: "Late Night Coding", count: "14 tracks", checked: true },
                  { name: "Weekend Drive", count: "9 tracks", checked: false },
                ].map((col) => (
                  <div
                    key={col.name}
                    className={`flex items-center justify-between p-1.5 rounded border text-[10px] ${
                      col.checked
                        ? "bg-primary/5 border-primary/20 text-primary"
                        : "bg-card border-border/40 text-foreground"
                    }`}
                  >
                    <span>{col.name} ({col.count})</span>
                    <span className="size-3.5 rounded border flex items-center justify-center text-[8px]">
                      {col.checked ? "✓" : "+"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* EXPLORE SOUNDS SHOWCASE */}
        <section id="explore" className="py-16 md:py-24 border-t border-border/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-primary font-bold">Discover</span>
              <h2 className="text-3xl font-extrabold tracking-tight font-heading">
                Explore TikTok Sounds
              </h2>
              <p className="text-sm text-muted-foreground">
                Live sounds from TikTok trending regions. Preview instantly, tap rows to play.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Rotation buttons */}
              {freshnessLabel && !exploreQuery.isLoading && (
                <span className="text-[11px] text-muted-foreground font-medium select-none mr-2">
                  {freshnessLabel}
                </span>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleDiscoverMore}
                disabled={exploreQuery.isFetching}
                className="h-8 gap-1.5 text-xs font-semibold cursor-pointer border-border/60 bg-card/30"
              >
                <RefreshCw className={`size-3 shrink-0 ${exploreQuery.isFetching ? "animate-spin" : ""}`} />
                Discover More
              </Button>
            </div>
          </div>

          {/* Tabs to rotate layout datasets */}
          <div className="mt-8 flex border-b border-border/40 gap-1.5 pb-px select-none">
            {[
              { id: "trending", label: "Trending Sounds" },
              { id: "random", label: "Random Picks" },
              { id: "recent", label: "Recently Discovered" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setExploreTab(tab.id as typeof exploreTab)}
                className={`relative pb-3 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer px-2 ${
                  exploreTab === tab.id
                    ? "text-primary border-b border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Grid of real dashboard MusicCard elements */}
          {exploreQuery.isLoading ? (
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 mt-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={`explore-skeleton-${index}`} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : exploreQuery.isError ? (
            <div className="py-12 text-center rounded-xl border border-border/40 bg-card/20 mt-6">
              <p className="text-sm text-muted-foreground">Trending sounds data is currently unavailable.</p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDiscoverMore}
                className="mt-4 gap-1.5"
              >
                <RefreshCw className="size-3" />
                Retry loading
              </Button>
            </div>
          ) : exploreTracks.length ? (
            <div className="mt-6 space-y-4">
              <div
                className={`grid gap-3 grid-cols-1 md:grid-cols-2 transition-opacity duration-200 ${
                  exploreQuery.isFetching ? "opacity-60 pointer-events-none" : ""
                }`}
              >
                {exploreTracks.map((music) => (
                  <MusicCard key={music.id} music={music} />
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none pt-2">
                <span className="rounded-md border border-border/60 bg-card/45 px-2 py-1">
                  {exploreQuery.data?.region ?? "VN"} region
                </span>
                <span className="rounded-md border border-border/60 bg-card/45 px-2 py-1">
                  Page {explorePage + 1} of {EXPLORE_PAGES.length}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No sounds available. Try another page batch.
            </div>
          )}
        </section>

        {/* DASHBOARD SHOWCASE TABS */}
        <section id="showcase" className="py-16 md:py-24 border-t border-border/40">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="text-xs uppercase tracking-widest text-primary font-bold">Interactive Showcase</span>
            <h2 className="text-3xl font-extrabold tracking-tight font-heading">
              Experience the Real Application
            </h2>
            <p className="text-sm text-muted-foreground">
              Toggle between the tabs below to explore the core product workflow screens.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[220px_1fr] items-start">
            {/* Showcase selector */}
            <div className="flex flex-col gap-1.5 border border-border/40 rounded-xl p-2 bg-card/25 select-none">
              {[
                { id: "search", label: "Search Feed", desc: "Filter sounds & grab hooks" },
                { id: "collections", label: "Collections", desc: "Group tracks into folders" },
                { id: "history", label: "Listening History", desc: "Revisit what you've heard" },
                { id: "player", label: "Expanded Player", desc: "Manage queues & modes" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setShowcaseTab(tab.id as typeof showcaseTab)}
                  className={`flex flex-col text-left px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    showcaseTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted/40 text-foreground"
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider">{tab.label}</span>
                  <span className={`text-[10px] mt-0.5 leading-none ${showcaseTab === tab.id ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                    {tab.desc}
                  </span>
                </button>
              ))}
            </div>

            {/* Showcase visual container */}
            <div className="rounded-xl border border-border/60 bg-card/45 p-6 min-h-[300px] flex flex-col justify-between">
              {showcaseTab === "search" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Search and Filter Feed</h3>
                    <span className="text-[10px] text-muted-foreground">Results matching &quot;midnight&quot;</span>
                  </div>
                  <div className="flex h-9 rounded-lg border border-input bg-background/50 px-3 items-center text-xs text-muted-foreground gap-2 max-w-lg">
                    <Search className="size-3.5 text-primary" />
                    <span className="text-foreground font-semibold">midnight</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { title: "Static Dreams", artist: "Velvet District", duration: "3:05", plays: "3.2M plays" },
                      { title: "Golden Hour", artist: "Skyline Theory", duration: "2:47", plays: "1.8M plays" },
                    ].map((item) => (
                      <div key={item.title} className="flex items-center justify-between rounded-lg border border-border/30 bg-background/40 p-2 text-xs">
                        <div>
                          <div className="font-semibold">{item.title}</div>
                          <div className="text-[10px] text-muted-foreground">{item.artist}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] text-muted-foreground">{item.plays}</span>
                          <span className="rounded bg-muted border border-border/20 px-1 py-0.5 text-[9px] font-bold text-muted-foreground">{item.duration}</span>
                          <button className="flex size-6 items-center justify-center rounded-full bg-foreground text-background">
                            <Play className="size-2 fill-current translate-x-px" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showcaseTab === "collections" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Custom Collections</h3>
                    <span className="text-[10px] text-muted-foreground">Total: 3 folders</span>
                  </div>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                    {[
                      { name: "Deep Focus", count: 18, desc: "Ambient textures for concentrated work" },
                      { name: "Creative Flow", count: 11, desc: "Instrumental beats for makers" },
                      { name: "Electronic Essentials", count: 34, desc: "Curated synth, house & future bass" },
                    ].map((col) => (
                      <div key={col.name} className="rounded-xl border border-border/30 bg-background/40 p-4 space-y-2 hover:border-primary/45 transition-colors select-none">
                        <Folder className="size-6 text-primary" />
                        <div className="font-bold text-xs truncate">{col.name}</div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 leading-snug">{col.desc}</p>
                        <div className="text-[9px] font-bold text-muted-foreground uppercase pt-1">{col.count} tracks</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showcaseTab === "history" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Listening History</h3>
                    <span className="text-[10px] text-muted-foreground">Automatically saved locally</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { title: "City Lights", artist: "Echo Harbor", when: "Played 5 min ago", plays: "2.1M plays" },
                      { title: "Parallel Hearts", artist: "Nova Bloom", when: "Played 1 hour ago", plays: "745K plays" },
                      { title: "Digital Sunset", artist: "Future Motel", when: "Yesterday", plays: "3.6M plays" },
                    ].map((item) => (
                      <div key={item.title} className="flex items-center justify-between rounded-lg border border-border/30 bg-background/40 p-2 text-xs">
                        <div className="min-w-0 flex-1 pr-4">
                          <div className="font-semibold truncate">{item.title}</div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                            <span>{item.artist}</span>
                            <span>•</span>
                            <span className="text-primary/75 font-semibold">{item.when}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[9px] text-muted-foreground hidden sm:inline">{item.plays}</span>
                          <button className="flex size-6 items-center justify-center rounded-full bg-foreground text-background">
                            <Play className="size-2 fill-current translate-x-px" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showcaseTab === "player" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Playback controls and Queue</h3>
                    <span className="text-[10px] text-muted-foreground">Active player dock expanded</span>
                  </div>

                  <div className="rounded-lg border border-border/30 bg-background/50 p-4 space-y-4 max-w-xl mx-auto">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                          EQ
                        </div>
                        <div>
                          <p className="text-xs font-semibold">Satellite Love</p>
                          <p className="text-[10px] text-muted-foreground">Horizon Club</p>
                        </div>
                      </div>
                      <span className="rounded bg-muted border border-border/20 px-1 py-0.5 text-[9px] font-bold text-muted-foreground">Autoplay Next</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button className="size-7 rounded-full bg-muted border border-border/20 flex items-center justify-center text-muted-foreground">
                        <SlidersHorizontal className="size-3" />
                      </button>
                      <button className="size-8 rounded-full bg-foreground text-background flex items-center justify-center">
                        <Pause className="size-3 fill-current" />
                      </button>
                      <div className="flex-1 text-[10px] text-muted-foreground flex items-center gap-2">
                        <span>0:45</span>
                        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                          <div className="w-1/3 h-full bg-primary" />
                        </div>
                        <span>2:30</span>
                      </div>
                      <button className="size-7 rounded-full bg-muted border border-border/20 flex items-center justify-center text-muted-foreground">
                        <Volume2 className="size-3" />
                      </button>
                    </div>

                    {/* Sim Queue List */}
                    <div className="border-t border-border/30 pt-3 space-y-2">
                      <div className="text-[9px] font-bold text-muted-foreground uppercase">Up Next in Queue (2 tracks)</div>
                      {[
                        { title: "Afterglow", artist: "Neon Coast" },
                        { title: "Midnight Drive", artist: "Aurora Lane" },
                      ].map((item) => (
                        <div key={item.title} className="flex items-center justify-between text-[10px] text-muted-foreground p-1 bg-muted/20 rounded">
                          <span>{item.title} — {item.artist}</span>
                          <span className="text-[9px] opacity-75 font-semibold">Queue item</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* FEATURE GRID */}
        <section id="features" className="py-16 md:py-24 border-t border-border/40">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="text-xs uppercase tracking-widest text-primary font-bold">Capabilities</span>
            <h2 className="text-3xl font-extrabold tracking-tight font-heading">
              Everything you need to catalog sound culture
            </h2>
            <p className="text-sm text-muted-foreground">
              Vin Music implements core library utilities to aggregate and save TikTok sounds without unnecessary bloat.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Search,
                title: "Search TikTok Sounds",
                desc: "Browse and index TikTok audio files by keywords, trending pages, or specific creator handles.",
              },
              {
                icon: Clapperboard,
                title: "Import Video Links",
                desc: "Paste any TikTok URL to parse and extract the sound clip. Saves the file directly to your catalog.",
              },
              {
                icon: Folder,
                title: "Custom Collections",
                desc: "Create and edit playlist folders to catalog sounds by moods, genres, study sessions, or gyms.",
              },
              {
                icon: FolderHeart,
                title: "Save Favorites",
                desc: "Save tracks with a single tap. Favorite list automatically aggregates to your primary library.",
              },
              {
                icon: Clock,
                title: "Listening History",
                desc: "Your playback sessions are recorded automatically so you can resume listening and retrieve tracks instantly.",
              },
              {
                icon: ListPlus,
                title: "Queue System",
                desc: "Stack up tracks to play sequentially. Reorder, skip, or clear the play queue anytime.",
              },
              {
                icon: SlidersHorizontal,
                title: "Persistent Player Dock",
                desc: "A floating bottom player containing advanced controls like volume slider, repeat modes, and shuffle.",
              },
              {
                icon: Sparkles,
                title: "Fast Audio Previews",
                desc: "Lightning-fast audio streaming that fetches TikWM links directly. Minimal latency playback.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border/60 bg-card/20 p-5 space-y-3 hover:border-border transition-all"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="size-4.5" />
                </div>
                <h3 className="text-sm font-bold">{feature.title}</h3>
                <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* WHY VIN MUSIC */}
        <section className="py-16 md:py-24 border-t border-border/40">
          <div className="grid gap-8 md:grid-cols-[1fr_1.5fr] items-start">
            <div className="space-y-4">
              <span className="text-xs uppercase tracking-widest text-primary font-bold">Concept</span>
              <h2 className="text-3xl font-extrabold tracking-tight font-heading leading-tight">
                Built specifically for internet sound curators
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                TikTok is the biggest source of musical trends, but it lacks library tools. We built a solution designed to solve this gap.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {[
                {
                  title: "Not a Streaming Service",
                  desc: "We do not replicate Spotify or Apple Music. Vin Music is purely a workflow tool to capture, inspect, and organize sound bytes.",
                },
                {
                  title: "Lightning-Fast Auditioning",
                  desc: "Zero-latency previews mean you can verify and preview sound quality in seconds without navigating feeds.",
                },
                {
                  title: "Flexible Collections",
                  desc: "Create and edit custom collections. Export audio sources whenever needed for video editing or soundboard usage.",
                },
                {
                  title: "Local & Sync Modes",
                  desc: "Works natively in your browser. Log in with Google to back up your personal library to our Supabase database.",
                },
              ].map((item) => (
                <div key={item.title} className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                  <p className="text-[11.5px] leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-16 md:py-24 text-center border-t border-border/40 max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl font-heading">
            Ready to build your TikTok sound library?
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Get started immediately. Free to use, search sounds, import links, and manage your discovery boards.
          </p>
          <div className="flex justify-center pt-2">
            {isSessionLoading ? (
              <Skeleton className="h-11 w-40 rounded-lg" />
            ) : (
              <Link
                href={user ? "/app" : "/login"}
                className={cn(buttonVariants({ size: "lg", variant: "default" }), "h-11 px-8 font-bold cursor-pointer")}
              >
                Open Dashboard
              </Link>
            )}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border/40 bg-card/20 py-12 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2 max-w-md">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded bg-foreground text-background">
                <Music2 className="size-4" />
              </div>
              <p className="text-xs font-bold tracking-widest uppercase text-foreground">
                Vin Music
              </p>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              A premium discoverability portal for internet sound culture. Catalog sounds, bypass the chaos.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-muted-foreground select-none">
            <Link href="/app" className="hover:text-foreground transition-colors">Dashboard</Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* GLOBAL PORTALS FOR PLAYBACK & COLLECTION PICKERS */}
      <GlobalPlayerDock />
      <CollectionPickerModal />
      <CreateCollectionModal />
    </div>
  );
}

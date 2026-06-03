"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LogIn, Music2, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthContext } from "@/src/lib/auth/hooks";
import { sanitizePostAuthRedirect } from "@/src/lib/auth/safe-redirect";
import { AppSidebar } from "@/components/vin-music/app-sidebar";
import { MusicCard } from "@/components/vin-music/music-card";
import { PlayerDock } from "@/components/home/player-dock";
import type { MusicCardModel } from "@/lib/vin-music/types";

// Type-compliant mockup track list to feed into the reused MusicCard component
const mockTracks: MusicCardModel[] = [
  {
    id: "7639368120095755029",
    title: "original sound - minh y ✈️",
    author: "minh y ✈️",
    duration: 193,
    album: "Single",
    play: "",
    cover: "https://p16-common-sign.tiktokcdn.com/tos-alisg-avt-0068/b387cc090cc16dfd973f35b94297fdfb~tplv-tiktokx-cropcenter:100:100.webp",
    stats: {
      play_count: 5991,
      digg_count: 1200,
      collect_count: 320,
      comment_count: 24,
      share_count: 15,
      video_count: 450,
      music_score: 10000,
    },
  },
  {
    id: "7136445672676411393",
    title: "Cute",
    author: "Aurel Surya Lie",
    duration: 30,
    album: "Cute",
    play: "",
    cover: "https://p16-sg.tiktokcdn.com/aweme/100x100/tos-alisg-v-2774/oQ2DAtMQeSQM6CtWAPg0l8QvXaFzFAvoeMfPAQ.jpeg",
    stats: {
      play_count: 17580150,
      digg_count: 560000,
      collect_count: 124000,
      comment_count: 45000,
      share_count: 89000,
      video_count: 12000,
      music_score: 950000,
    },
  },
];

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(
    () => sanitizePostAuthRedirect(searchParams.get("next")),
    [searchParams],
  );
  const { signInWithGoogle, isLoading, user } = useAuthContext();
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(nextPath);
    }
  }, [isLoading, nextPath, router, user]);

  const onLogin = async () => {
    try {
      setIsPending(true);
      await signInWithGoogle(nextPath);
    } catch {
      toast.error("Google sign in failed. Please try again.");
      setIsPending(false);
    }
  };

  // 1. Branded Loading State: prevents generic spinners and avoids login flash
  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground space-y-4 select-none">
        <div className="flex size-12 items-center justify-center rounded-xl bg-foreground text-background">
          <Music2 className="size-6 animate-pulse" />
        </div>
        <div className="text-center space-y-1">
          <h1 className="font-heading text-[15px] font-bold tracking-widest uppercase">
            Vin Music
          </h1>
          <p className="text-[11px] text-muted-foreground animate-pulse font-semibold">
            Loading...
          </p>
        </div>
      </main>
    );
  }

  // If already authenticated, render nothing and let redirect take effect
  if (user) {
    return null;
  }

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-background overflow-hidden px-4 animate-in fade-in duration-300">
      
      {/* 2. BACKGROUND DASHBOARD PREVIEW LAYER
          Rendered using the actual components from the application. 
          Pointer-events-none and select-none to act purely as a background. */}
      <div className="pointer-events-none select-none absolute inset-0 z-0 flex h-full w-full opacity-35 blur-[1.2px] scale-[1.01] transition-all">
        <div className="flex w-full h-full">
          {/* Sidebar */}
          <AppSidebar collapsed={false} onToggle={() => undefined} />

          {/* Main Area */}
          <div className="flex flex-1 flex-col">
            {/* Mock top bar */}
            <div className="h-12 border-b border-border bg-card/45 px-5 flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground tracking-wide">
                Vin Music Preview
              </span>
              <div className="h-7 w-7 rounded-full bg-muted border border-border/40" />
            </div>

            {/* Mock page content utilizing real components */}
            <div className="flex-1 p-5 space-y-6">
              <div className="space-y-2">
                <h1 className="font-heading text-lg font-bold tracking-tight">
                  Search songs or paste a TikTok link
                </h1>
                <div className="flex max-w-md items-center gap-2 rounded-lg border border-input bg-background/50 px-3 py-2 text-xs text-muted-foreground">
                  <Search className="size-3.5" />
                  <span>Search songs, artists, or paste a TikTok URL…</span>
                </div>
              </div>

              <div className="space-y-3 max-w-3xl">
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  Trending Sounds
                </h2>
                <div className="grid gap-2 grid-cols-1">
                  {mockTracks.map((track) => (
                    <MusicCard key={track.id} music={track} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Player Mockup utilizing the actual PlayerDock */}
        <PlayerDock
          track={{
            id: "7136445672676411393",
            title: "Cute",
            artist: "Aurel Surya Lie",
            coverUrl: "https://p16-sg.tiktokcdn.com/aweme/100x100/tos-alisg-v-2774/oQ2DAtMQeSQM6CtWAPg0l8QvXaFzFAvoeMfPAQ.jpeg",
            duration: 30,
          }}
          activeSource=""
          isPlaying={false}
          dockMode="mini"
          currentTime={12}
          duration={30}
          volume={0.8}
          playbackMode="normal"
          isCurrentTrackSaved={false}
          onToggleDockExpanded={() => undefined}
          onHideDock={() => undefined}
          onShowDock={() => undefined}
          onPlayPrevious={() => undefined}
          onTogglePlayback={() => undefined}
          onPlayNext={() => undefined}
          onPlaybackModeChange={() => undefined}
          onToggleSaveCurrentTrack={() => undefined}
          onSeek={() => undefined}
          onVolumeChange={() => undefined}
          queue={[]}
          onRemoveFromQueue={() => undefined}
          onClearQueue={() => undefined}
          onMoveQueueItem={() => undefined}
        />
      </div>

      {/* Dark overlay to keep text on auth card readable */}
      <div className="absolute inset-0 bg-black/50 z-1 pointer-events-none" />

      {/* 3. CENTERED PREMIUM AUTH CARD */}
      <Card className="relative z-10 w-full max-w-[480px] border border-border/50 bg-card/85 backdrop-blur-sm shadow-2xl rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header Block */}
        <div className="flex flex-col items-center space-y-2">
          <div className="flex size-10 items-center justify-center rounded-lg bg-foreground text-background mb-1">
            <Music2 className="size-5" />
          </div>
          <h1 className="font-heading text-xl font-bold tracking-tight">
            Vin Music
          </h1>
          <p className="text-[10px] font-bold tracking-widest uppercase text-primary">
            Build Your TikTok Sound Library
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs pt-1">
            Search, save, organize, and revisit TikTok sounds from one place.
          </p>
          <p className="text-[11px] text-muted-foreground/60 font-semibold tracking-wide pt-0.5 select-none">
            Organize sounds before they disappear.
          </p>
        </div>

        {/* Action button */}
        <Button
          onClick={onLogin}
          disabled={isPending || isLoading}
          size="lg"
          className="w-full cursor-pointer font-bold h-10 select-none text-xs gap-2 shadow-lg hover:shadow-xl hover:translate-y-[-1px] active:translate-y-[1px] focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200"
        >
          {isPending || isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <LogIn className="size-4" />
              Continue with Google
            </>
          )}
        </Button>

        {/* Trust Signals Block */}
        <div className="w-full space-y-3 pt-1">
          <div className="flex items-center gap-2">
            <div className="h-px bg-border/40 flex-1" />
            <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/60 select-none">
              Everything stays synced to your account
            </span>
            <div className="h-px bg-border/40 flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10.5px] text-muted-foreground/80 font-bold select-none text-left pl-2">
            <div className="flex items-center gap-1.5">
              <span className="text-primary text-xs leading-none">✓</span> Collections
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-primary text-xs leading-none">✓</span> Saved Tracks
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-primary text-xs leading-none">✓</span> Listening History
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-primary text-xs leading-none">✓</span> Queue Persistence
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
}

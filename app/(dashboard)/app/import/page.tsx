"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Link as LinkIcon,
  Loader2,
  Music,
  AlertCircle,
  ArrowRight,
  Video,
  Music2,
} from "lucide-react";

import { PageTransition } from "@/components/vin-music/page-transition";
import { SectionHeading } from "@/components/vin-music/section-heading";
import { MusicCard } from "@/components/vin-music/music-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NowPlayingCard } from "@/components/vin-music/now-playing-card";
import { useImportTrack } from "@/src/lib/query/hooks";
import { importResultToMusicCard } from "@/src/lib/query/mappers";
import { ApiError } from "@/src/lib/api/errors";
import type { ImportResult } from "@/src/lib/tikwm/sound-entity";
import type { MusicCardModel } from "@/lib/vin-music/types";

// ---------------------------------------------------------------------------
// Audio preview strip — only shown for music URL imports with a play URL
// ---------------------------------------------------------------------------

function AudioPreviewStrip({ src }: { src: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/40 px-4 py-3">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Audio preview
      </p>
      <audio controls className="w-full h-8" src={src} preload="none">
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Source badge helpers
// ---------------------------------------------------------------------------

function SourceBadge({ type }: { type: "track" | "sound" }) {
  if (type === "sound") {
    return (
      <Badge variant="secondary" className="gap-1 text-[10px] uppercase tracking-wider">
        <Music2 className="size-2.5" />
        Music link
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-[10px] uppercase tracking-wider">
      <Video className="size-2.5" />
      Video link
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Outer page (prerendering guard)
// ---------------------------------------------------------------------------

export default function ImportLinkPage() {
  return (
    <Suspense fallback={null}>
      <ImportLinkPageWithParams />
    </Suspense>
  );
}

function ImportLinkPageWithParams() {
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get("url") || "";

  return <ImportLinkPageInner key={initialUrl} initialUrl={initialUrl} />;
}

// ---------------------------------------------------------------------------
// Inner page — all state lives here
// ---------------------------------------------------------------------------

function ImportLinkPageInner({ initialUrl }: { initialUrl: string }) {
  const [url, setUrl] = React.useState(() => initialUrl);
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const importMutation = useImportTrack();
  const autoImportedRef = React.useRef(false);

  function handleImport(targetUrl?: string) {
    const importUrl = (targetUrl ?? url).trim();
    if (!importUrl) return;

    setError(null);
    setResult(null);

    importMutation.mutate(importUrl, {
      onSuccess: (res) => setResult(res),
      onError: (err: unknown) => {
        if (err instanceof ApiError || err instanceof Error) {
          setError(err.message);
        } else {
          setError(
            "Failed to extract music from this link. Paste a valid TikTok video or music URL.",
          );
        }
      },
    });
  }

  React.useEffect(() => {
    if (!initialUrl || autoImportedRef.current) return;
    autoImportedRef.current = true;
    const timer = window.setTimeout(() => {
      setError(null);
      setResult(null);
      importMutation.mutate(initialUrl, {
        onSuccess: (res) => setResult(res),
        onError: (err: unknown) => {
          if (err instanceof ApiError || err instanceof Error) {
            setError(err.message);
          } else {
            setError(
              "Failed to extract music from this link. Paste a valid TikTok video or music URL.",
            );
          }
        },
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialUrl, importMutation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleImport();
  };

  const isLoading = importMutation.isPending;

  // Normalise result → MusicCardModel (same type MusicCard always uses)
  const card: MusicCardModel | null = result ? importResultToMusicCard(result) : null;
  // For music URL imports, surface an audio preview strip
  const audioPreviewUrl =
    result?.type === "sound" ? result.data.play : null;

  return (
    <PageTransition>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
        <div className="space-y-6">
          <SectionHeading
            title="Import TikTok Link"
            subtitle="Paste a TikTok video or music URL to extract its sound."
          />

          {/* ── Input Card ── */}
          <div className="rounded-xl border border-border/70 bg-card/80 p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <LinkIcon className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Paste a TikTok URL</p>
                <p className="text-xs text-muted-foreground">
                  Supports video links and music/sound links
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                id="import-url-input"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@user/video/… or /music/…"
                className="flex-1 h-10 rounded-lg border border-input bg-background px-4 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-ring transition-all font-heading"
                autoComplete="off"
                autoFocus
              />
              <Button
                id="import-submit-btn"
                type="submit"
                disabled={!url.trim() || isLoading}
                className="h-10 px-5 font-bold cursor-pointer gap-2"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowRight className="size-4" />
                )}
                {isLoading ? "Extracting…" : "Import"}
              </Button>
            </form>

            <p className="text-[11px] text-muted-foreground">
              We extract sound metadata only — no audio is downloaded or stored.
            </p>
          </div>

          {/* ── Loading State ── */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted border border-border mb-4">
                <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
              </div>
              <p className="text-sm font-semibold text-foreground">Extracting sound…</p>
              <p className="text-xs text-muted-foreground mt-1">
                Detecting URL type and fetching metadata
              </p>
            </div>
          )}

          {/* ── Error State ── */}
          {error && !isLoading && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <AlertCircle className="size-4 text-destructive mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-destructive">Import failed</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
            </div>
          )}

          {/* ── Result: standard MusicCard for both video & music imports ── */}
          {card && !isLoading && result && (
            <div className="space-y-3">
              {/* Header row with source badge */}
              <div className="flex items-center gap-2">
                <Music className="size-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Extracted Sound</h2>
                <SourceBadge type={result.type} />
              </div>

              {/* The exact same MusicCard used everywhere else in the app */}
              <MusicCard music={card} />

              {/* Audio preview strip only for music URL imports */}
              {audioPreviewUrl && (
                <AudioPreviewStrip src={audioPreviewUrl} />
              )}
            </div>
          )}

          {/* ── Examples ── */}
          {!isLoading && !result && !error && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Supported formats
              </p>
              <div className="space-y-1.5">
                {[
                  {
                    label: "Video link",
                    example: "https://www.tiktok.com/@username/video/7123456789012345678",
                  },
                  {
                    label: "Short link",
                    example: "https://vm.tiktok.com/AbCdEfGhI/",
                  },
                  {
                    label: "Music link",
                    example: "https://www.tiktok.com/music/Sound-name-7123456789012345678",
                  },
                ].map(({ label, example }) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setUrl(example)}
                    className="block w-full text-left rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary/70 mr-2">
                      {label}
                    </span>
                    <span className="font-mono">{example}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <NowPlayingCard />
      </div>
    </PageTransition>
  );
}

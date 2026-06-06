"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Play, Pencil, Trash2, ArrowLeft, Music, Sparkles, Shuffle } from "lucide-react";
import { NowPlayingCard } from "@/components/vin-music/now-playing-card";
import { PageTransition } from "@/components/vin-music/page-transition";
import { useVinMusicPlayerStore } from "@/store/vin-music-player-store";
import { CollectionTrackRow } from "@/components/vin-music/collection-track-row";
import { CoverImage } from "@/components/vin-music/track-cover";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useDeletePlaylist,
  useFavorites,
  usePlaylist,
  useRemoveTrackFromPlaylist,
  useToggleFavorite,
  useUpdatePlaylist,
  useUpdateFavoriteTrackName,
  useUpdatePlaylistTrackName,
} from "@/src/lib/query/hooks";
import { musicCardToTrackSnapshot, trackToMusicCard } from "@/src/lib/query/mappers";
import { useAuthContext } from "@/src/lib/auth/hooks";

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, isLoading: isSessionLoading } = useAuthContext();
  const isReady = Boolean(user) && !isSessionLoading;

  const playTrack = useVinMusicPlayerStore((s) => s.playTrack);

  const isSavedTracks = id === "saved-tracks";
  const favoritesQuery = useFavorites({
    enabled: isSavedTracks && isReady,
  });
  const playlistQuery = usePlaylist(id, { enabled: !isSavedTracks && isReady });
  const updatePlaylist = useUpdatePlaylist();
  const deletePlaylist = useDeletePlaylist();
  const removeTrack = useRemoveTrackFromPlaylist();
  const toggleFavorite = useToggleFavorite();
  const updateFavoriteTrackName = useUpdateFavoriteTrackName();
  const updatePlaylistTrackName = useUpdatePlaylistTrackName();

  const rows = React.useMemo(() => {
    if (isSavedTracks) {
      return (favoritesQuery.data ?? []).map((f) => ({
        key: f.id,
        track: trackToMusicCard(f.track_data),
      }));
    }
    const seen = new Set<string>();
    return (playlistQuery.data?.tracks ?? []).flatMap((t) => {
      if (seen.has(t.track_id)) return [];
      seen.add(t.track_id);
      return [{ key: t.id, track: trackToMusicCard(t.track_data) }];
    });
  }, [favoritesQuery.data, playlistQuery.data, isSavedTracks]);
  const cards = React.useMemo(() => rows.map((row) => row.track), [rows]);

  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState("");
  const [editDesc, setEditDesc] = React.useState("");

  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!isSavedTracks && playlistQuery.isError) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-muted-foreground border border-border mb-4">
            <Music className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Collection Not Found</h2>
          <p className="text-xs text-muted-foreground mb-6">The collection you are looking for does not exist or has been deleted.</p>
          <Button onClick={() => router.push("/app/collections")} variant="outline" className="gap-2 rounded-xl border border-border h-9">
            <ArrowLeft className="h-4 w-4" />
            Back to Collections
          </Button>
        </div>
      </PageTransition>
    );
  }

  const name = isSavedTracks ? "Saved Tracks" : playlistQuery.data?.playlist.name ?? "Collection";
  const description = isSavedTracks
    ? "Your collected sounds and music"
    : playlistQuery.data?.playlist.description ?? "";
  const isSystem = isSavedTracks;
  const trackCount = cards.length;
  const firstItemCover = cards[0]?.cover;
  const tracks = cards;

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0]!, tracks);
    }
  };

  const handleShuffle = () => {
    if (!tracks.length) return;
    const shuffled = [...tracks];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [
        shuffled[swapIndex]!,
        shuffled[index]!,
      ];
    }
    playTrack(shuffled[0]!, shuffled);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    updatePlaylist.mutate(
      {
        playlistId: id,
        body: {
          name: editName.trim(),
          description: editDesc.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      },
    );
  };

  const handleDelete = () => {
    deletePlaylist.mutate(id, {
      onSuccess: () => {
        setIsDeleting(false);
        router.push("/app/collections");
      },
    });
  };

  return (
    <PageTransition>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
        <div className="space-y-5">
          {/* Back Navigation */}
          <button
            onClick={() => router.push("/app/collections")}
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-0 p-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Collections
          </button>

          {/* Header Section */}
          <div className="flex flex-col md:flex-row gap-5 p-4 rounded-xl bg-card border border-border/80 shadow-sm">
            {/* Cover photo */}
            <div className="relative h-24 w-24 md:h-28 md:w-28 shrink-0 rounded-xl overflow-hidden bg-muted border border-border flex items-center justify-center shadow-inner">
              {firstItemCover ? (
                <CoverImage
                  src={firstItemCover}
                  alt={name}
                  containerClassName="h-full w-full"
                  sizes="112px"
                />
              ) : (
                <Music className="h-8 w-8 text-muted-foreground" />
              )}
            </div>

            {/* Details */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/15">
                    {isSystem ? "System Crate" : "Collection"}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/40">
                    {trackCount} track{trackCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight truncate font-heading leading-tight">
                  {name}
                </h1>
                <p className="text-xs text-muted-foreground font-medium line-clamp-2 leading-relaxed">
                  {description || "No description provided."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-3 pt-1">
                <Button
                  onClick={handlePlayAll}
                  disabled={trackCount === 0}
                  className="gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold rounded-xl px-4 py-2 cursor-pointer border-0 shadow-sm transition-colors h-9 text-xs"
                >
                  <Play className="size-4 fill-current" />
                  Play All
                </Button>
                <Button
                  onClick={handleShuffle}
                  disabled={trackCount === 0}
                  variant="outline"
                  className="gap-2 rounded-xl px-4 py-2 font-semibold h-9 text-xs"
                >
                  <Shuffle className="size-4" />
                  Shuffle
                </Button>

                {!isSystem && (
                  <>
                    <button
                      onClick={() => {
                        setEditName(name);
                        setEditDesc(description || "");
                        setIsEditing(true);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted border border-border/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Edit Collection"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setIsDeleting(true)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted border border-border/80 text-muted-foreground hover:text-red-650 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete Collection"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Track List Section */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-0.5">Tracks</h2>

            {trackCount > 0 ? (
              <div className="space-y-0.5 bg-muted/15 p-1 rounded-xl border border-border/30">
                {rows.map(({ key, track }, idx) => (
                  <CollectionTrackRow
                    key={key}
                    track={track}
                    index={idx}
                    playlist={tracks}
                    onRemove={() => {
                      if (isSavedTracks) {
                        toggleFavorite.mutate({
                          track: musicCardToTrackSnapshot(track),
                          isFavorited: true,
                        });
                        return;
                      }
                      removeTrack.mutate({ playlistId: id, trackId: track.id });
                    }}
                    onRename={(friendlyName) => {
                      if (isSavedTracks) {
                        updateFavoriteTrackName.mutate({
                          trackId: track.id,
                          friendlyName,
                        });
                        return;
                      }
                      updatePlaylistTrackName.mutate({
                        playlistId: id,
                        trackId: track.id,
                        friendlyName,
                      });
                    }}
                    isRenaming={
                      updateFavoriteTrackName.isPending ||
                      updatePlaylistTrackName.isPending
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-xl bg-muted/5">
                <Sparkles className="h-6 w-6 text-muted-foreground/40 mb-2 animate-pulse" />
                <p className="text-xs font-semibold text-muted-foreground mb-1">This collection is empty</p>
                <p className="text-[11px] text-muted-foreground/60 max-w-xs">Browse songs in the dashboard and add them to this crate.</p>
              </div>
            )}
          </div>
        </div>

        <NowPlayingCard />
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit collection</DialogTitle>
            <DialogDescription>
              Update the name and description for this collection.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Collection name</Label>
              <Input
                id="edit-name"
                type="text"
                required
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description (optional)</Label>
              <Textarea
                id="edit-desc"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter className="border-0 bg-transparent p-0 pt-1 -mx-0 -mb-0 gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!editName.trim() || updatePlaylist.isPending}
              >
                {updatePlaylist.isPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete collection?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">&quot;{name}&quot;</span>
              ? This will permanently clear this crate. Your songs will remain saved in
              other collections.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="border-0 bg-transparent p-0 pt-1 -mx-0 -mb-0 gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleting(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deletePlaylist.isPending}
            >
              {deletePlaylist.isPending ? "Deleting..." : "Delete crate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}

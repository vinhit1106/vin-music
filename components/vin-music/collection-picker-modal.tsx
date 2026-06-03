"use client";

import * as React from "react";
import { Plus, Check, Folder, FolderPlus, LoaderCircle } from "lucide-react";
import { useCollectionsStore } from "@/store/collections-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useAddTrackToPlaylist,
  useCreatePlaylist,
  useFavorites,
  usePlaylistDetails,
  usePlaylists,
  useRemoveTrackFromPlaylist,
  useToggleFavorite,
} from "@/src/lib/query/hooks";
import { musicCardToTrackSnapshot } from "@/src/lib/query/mappers";
import type { MusicCardModel } from "@/lib/vin-music/types";
import { useAuthContext } from "@/src/lib/auth/hooks";

export function CollectionPickerModal() {
  const pickerTrack = useCollectionsStore((state) => state.pickerTrack);

  if (!pickerTrack) return null;

  return (
    <CollectionPickerModalContent
      key={pickerTrack.id}
      pickerTrack={pickerTrack}
    />
  );
}

function CollectionPickerModalContent({
  pickerTrack,
}: {
  pickerTrack: MusicCardModel;
}) {
  const { closeCollectionPicker, addToCollection, removeFromCollection } =
    useCollectionsStore();
  const { user } = useAuthContext();

  const favoritesQuery = useFavorites({ enabled: Boolean(user) });
  const playlistsQuery = usePlaylists({ enabled: Boolean(user) });
  const playlistIds = React.useMemo(
    () => (playlistsQuery.data ?? []).map((playlist) => playlist.id),
    [playlistsQuery.data],
  );
  const playlistDetailsQuery = usePlaylistDetails(playlistIds, {
    enabled: Boolean(pickerTrack) && playlistIds.length > 0,
  });
  const toggleFavorite = useToggleFavorite();
  const addToPlaylist = useAddTrackToPlaylist();
  const removeFromPlaylist = useRemoveTrackFromPlaylist();
  const createPlaylist = useCreatePlaylist();

  const [isCreating, setIsCreating] = React.useState(false);
  const [newCollectionName, setNewCollectionName] = React.useState("");
  const [newCollectionDesc, setNewCollectionDesc] = React.useState("");
  const [pendingCollectionIds, setPendingCollectionIds] = React.useState<
    Set<string>
  >(new Set());
  const [optimisticMembership, setOptimisticMembership] = React.useState<
    Record<string, boolean>
  >({});

  const close = React.useCallback(() => {
    setIsCreating(false);
    setNewCollectionName("");
    setNewCollectionDesc("");
    setPendingCollectionIds(new Set());
    setOptimisticMembership({});
    closeCollectionPicker();
  }, [closeCollectionPicker]);

  const trackSnapshot = musicCardToTrackSnapshot(pickerTrack);
  const playlistMembership = React.useMemo(
    () =>
      new Map(
        (playlistDetailsQuery.data ?? []).map((detail) => [
          detail.playlist.id,
          new Set(detail.tracks.map((track) => track.track_id)),
        ]),
      ),
    [playlistDetailsQuery.data],
  );
  const isMembershipLoading =
    playlistIds.length > 0 && playlistDetailsQuery.isLoading;

  const getServerMembership = React.useCallback(
    (collectionId: string) => {
      if (collectionId === "saved-tracks") {
        return (favoritesQuery.data ?? []).some(
          (favorite) => favorite.track_id === pickerTrack.id,
        );
      }

      return playlistMembership.get(collectionId)?.has(pickerTrack.id) ?? false;
    },
    [favoritesQuery.data, pickerTrack.id, playlistMembership],
  );

  const getDisplayedMembership = React.useCallback(
    (collectionId: string) =>
      optimisticMembership[collectionId] ?? getServerMembership(collectionId),
    [getServerMembership, optimisticMembership],
  );

  const setCollectionPending = React.useCallback(
    (collectionId: string, pending: boolean) => {
      setPendingCollectionIds((current) => {
        const next = new Set(current);
        if (pending) {
          next.add(collectionId);
        } else {
          next.delete(collectionId);
        }
        return next;
      });
    },
    [],
  );

  const setOptimisticCollection = React.useCallback(
    (collectionId: string, isAdded: boolean) => {
      setOptimisticMembership((current) => ({
        ...current,
        [collectionId]: isAdded,
      }));
    },
    [],
  );

  const handleToggleCollection = (collectionId: string) => {
    if (
      pendingCollectionIds.has(collectionId) ||
      (collectionId !== "saved-tracks" && isMembershipLoading)
    ) {
      return;
    }

    const wasAdded = getDisplayedMembership(collectionId);
    const nextAdded = !wasAdded;
    setCollectionPending(collectionId, true);
    setOptimisticCollection(collectionId, nextAdded);

    if (collectionId === "saved-tracks") {
      void (async () => {
        try {
          await toggleFavorite.mutateAsync({
            track: trackSnapshot,
            isFavorited: wasAdded,
          });
        } catch {
          setOptimisticCollection(collectionId, wasAdded);
        } finally {
          setCollectionPending(collectionId, false);
        }
      })();
      return;
    }

    if (wasAdded) {
      removeFromCollection(collectionId, pickerTrack.id);

      void (async () => {
        try {
          await removeFromPlaylist.mutateAsync({
            playlistId: collectionId,
            trackId: pickerTrack.id,
          });
        } catch {
          addToCollection(collectionId, pickerTrack);
          setOptimisticCollection(collectionId, wasAdded);
        } finally {
          setCollectionPending(collectionId, false);
        }
      })();
    } else {
      addToCollection(collectionId, pickerTrack);

      void (async () => {
        try {
          await addToPlaylist.mutateAsync({
            playlistId: collectionId,
            track: trackSnapshot,
          });
        } catch {
          removeFromCollection(collectionId, pickerTrack.id);
          setOptimisticCollection(collectionId, wasAdded);
        } finally {
          setCollectionPending(collectionId, false);
        }
      })();
    }
  };

  const handleCreateAndSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    void (async () => {
      let createdPlaylistId: string | null = null;
      const name = newCollectionName.trim();
      const description = newCollectionDesc.trim() || undefined;

      try {
        const playlist = await createPlaylist.mutateAsync({
          name,
          description,
        });

        createdPlaylistId = playlist.id;
        setCollectionPending(playlist.id, true);
        setOptimisticCollection(playlist.id, true);

        await addToPlaylist.mutateAsync({
          playlistId: playlist.id,
          track: trackSnapshot,
        });

        setNewCollectionName("");
        setNewCollectionDesc("");
        setIsCreating(false);
      } catch {
        if (createdPlaylistId) {
          setOptimisticCollection(createdPlaylistId, false);
        }
      } finally {
        if (createdPlaylistId) {
          setCollectionPending(createdPlaylistId, false);
        }
      }
    })();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) close();
  };

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to Collection</DialogTitle>
          <DialogDescription>
            {pickerTrack.title} by {pickerTrack.author}
          </DialogDescription>
        </DialogHeader>

        {!isCreating ? (
          <>
            <div className="max-h-60 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-muted mb-4">
              {[
                {
                  id: "saved-tracks",
                  name: "Saved Tracks",
                  description: "Your collected sounds and music",
                  isSystem: true,
                  count: favoritesQuery.data?.length ?? 0,
                },
                ...(playlistsQuery.data ?? []).map((p) => ({
                  id: p.id,
                  name: p.name,
                  description: p.description ?? "",
                  isSystem: false,
                  count: playlistMembership.get(p.id)?.size ?? 0,
                })),
              ].map((col) => {
                const isAdded = getDisplayedMembership(col.id);
                const isItemPending = pendingCollectionIds.has(col.id);
                const isItemDisabled =
                  isItemPending || (!col.isSystem && isMembershipLoading);
                const isSystem = col.isSystem;

                return (
                  <button
                    key={col.id}
                    onClick={() => handleToggleCollection(col.id)}
                    disabled={isItemDisabled}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group cursor-pointer",
                      isItemDisabled && "cursor-not-allowed opacity-70",
                      isAdded
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-muted/10 border-border hover:bg-muted/30 text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                        isAdded
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                      )}>
                        <Folder className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate flex items-center gap-1.5 font-heading">
                          {col.name}
                          {isSystem && (
                            <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-normal border border-border">
                              Default
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {col.count} track{col.count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      {isItemPending ? (
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                      ) : isAdded ? (
                        <Check className="h-3.5 w-3.5 stroke-3" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              onClick={() => setIsCreating(true)}
              variant="outline"
              className="w-full"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Create new collection
            </Button>
          </>
        ) : (
          <form onSubmit={handleCreateAndSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="picker-col-name">Collection name</Label>
              <Input
                id="picker-col-name"
                type="text"
                required
                autoFocus
                placeholder="e.g. Lofi Vibes, Gym Mix..."
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="picker-col-desc">Description (optional)</Label>
              <Textarea
                id="picker-col-desc"
                placeholder="Describe your collection..."
                value={newCollectionDesc}
                onChange={(e) => setNewCollectionDesc(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter className="border-0 bg-transparent p-0 pt-1 -mx-0 -mb-0 gap-2 sm:justify-end">
              <Button
                type="button"
                onClick={() => setIsCreating(false)}
                variant="outline"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={!newCollectionName.trim() || createPlaylist.isPending}
              >
                {createPlaylist.isPending ? "Creating..." : "Create & save"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

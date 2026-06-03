import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Collection, CollectionItem, SAVED_TRACKS_ID } from "@/lib/vin-music/collections-types";
import type { MusicCardModel } from "@/lib/vin-music/types";

type CollectionsState = {
  collections: Collection[];
  pickerTrack: MusicCardModel | null;
  
  createCollection: (name: string, description?: string) => Collection;
  deleteCollection: (id: string) => void;
  updateCollection: (id: string, patch: Partial<Pick<Collection, "name" | "description">>) => void;
  addToCollection: (collectionId: string, track: MusicCardModel) => void;
  removeFromCollection: (collectionId: string, musicId: string) => void;
  
  openCollectionPicker: (track: MusicCardModel) => void;
  closeCollectionPicker: () => void;
  
  isCreateModalOpen: boolean;
  setCreateModalOpen: (open: boolean) => void;
  
  isTrackInAnyCollection: (musicId: string) => boolean;
  isTrackInCollection: (collectionId: string, musicId: string) => boolean;
};

const defaultSavedTracks: Collection = {
  id: SAVED_TRACKS_ID,
  name: "Saved Tracks",
  description: "Your collected sounds and music",
  isSystem: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  items: [],
};

export const useCollectionsStore = create<CollectionsState>()(
  persist(
    (set, get) => ({
      collections: [defaultSavedTracks],
      pickerTrack: null,
      isCreateModalOpen: false,
      setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),

      createCollection: (name, description) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const newCollection: Collection = {
          id,
          name,
          description,
          createdAt: now,
          updatedAt: now,
          items: [],
        };
        set((state) => ({
          collections: [...state.collections, newCollection],
        }));
        return newCollection;
      },

      deleteCollection: (id) => {
        if (id === SAVED_TRACKS_ID) return; // Guard system collection
        set((state) => ({
          collections: state.collections.filter((c) => c.id !== id),
        }));
      },

      updateCollection: (id, patch) => {
        if (id === SAVED_TRACKS_ID) return; // Guard system collection
        set((state) => ({
          collections: state.collections.map((c) => {
            if (c.id === id) {
              return {
                ...c,
                ...patch,
                updatedAt: new Date().toISOString(),
              };
            }
            return c;
          }),
        }));
      },

      addToCollection: (collectionId, track) => {
        const now = new Date().toISOString();
        set((state) => ({
          collections: state.collections.map((c) => {
            if (c.id === collectionId) {
              // Idempotency: check if track already exists in this collection
              const exists = c.items.some((item) => item.musicId === track.id);
              if (exists) return c;

              const newItem: CollectionItem = {
                id: crypto.randomUUID(),
                musicId: track.id,
                musicSnapshot: track,
                addedAt: now,
              };

              return {
                ...c,
                items: [newItem, ...c.items], // Add to beginning (newest first)
                updatedAt: now,
              };
            }
            return c;
          }),
        }));
      },

      removeFromCollection: (collectionId, musicId) => {
        const now = new Date().toISOString();
        set((state) => ({
          collections: state.collections.map((c) => {
            if (c.id === collectionId) {
              return {
                ...c,
                items: c.items.filter((item) => item.musicId !== musicId),
                updatedAt: now,
              };
            }
            return c;
          }),
        }));
      },

      openCollectionPicker: (track) => {
        set({ pickerTrack: track });
      },

      closeCollectionPicker: () => {
        set({ pickerTrack: null });
      },

      isTrackInAnyCollection: (musicId) => {
        const { collections } = get();
        return collections.some((c) => c.items.some((item) => item.musicId === musicId));
      },

      isTrackInCollection: (collectionId, musicId) => {
        const { collections } = get();
        const collection = collections.find((c) => c.id === collectionId);
        if (!collection) return false;
        return collection.items.some((item) => item.musicId === musicId);
      },
    }),
    {
      name: "vin-music-collections-store",
      partialize: (state) => ({
        collections: state.collections,
      }),
      // Ensure saved-tracks always exists and is marked isSystem: true on rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          const hasSavedTracks = state.collections.some((c) => c.id === SAVED_TRACKS_ID);
          if (!hasSavedTracks) {
            state.collections = [defaultSavedTracks, ...state.collections];
          } else {
            state.collections = state.collections.map((c) => {
              if (c.id === SAVED_TRACKS_ID) {
                return {
                  ...c,
                  name: "Saved Tracks",
                  isSystem: true,
                };
              }
              return c;
            });
          }
        }
      },
    }
  )
);

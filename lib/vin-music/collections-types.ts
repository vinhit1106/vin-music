import type { MusicCardModel } from "./types";

export type CollectionItem = {
  id: string; // unique item id inside the collection
  musicId: string;
  musicSnapshot: MusicCardModel;
  addedAt: string; // ISO string
};

export type Collection = {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean; // true for "saved-tracks" - cannot be renamed/deleted
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  items: CollectionItem[];
};

export const SAVED_TRACKS_ID = "saved-tracks";

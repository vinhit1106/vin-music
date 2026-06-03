export const queryKeys = {
  search: (q: string) => ["api", "search", q] as const,
  favorites: ["api", "favorites"] as const,
  playlists: ["api", "playlists"] as const,
  playlist: (id: string) => ["api", "playlists", id] as const,
  history: (limit?: number) => ["api", "history", limit ?? 50] as const,
  explore: (keyword: string, page?: number) => ["api", "explore", keyword, page ?? 0] as const,
  trackDetail: (id: string) => ["api", "track", id] as const,
  /** Sound context: metadata for a specific music ID */
  soundContext: (id: string) => ["api", "sound-context", id] as const,
  /** Paginated videos using a sound */
  soundPosts: (id: string) => ["api", "sound-posts", id] as const,
  /** Trending sounds aggregation per region */
  trending: (region: string) => ["api", "trending", region] as const,
};

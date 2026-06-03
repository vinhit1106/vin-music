import { unstable_cache } from "next/cache";
import { ApiError } from "@/src/lib/api/errors";
import { tikwmPostJson } from "@/src/lib/tikwm/client";
import { tikwmSearchResponseSchema } from "@/src/lib/tikwm/types";
import type { TikwmSearchVideo } from "@/src/lib/tikwm/types";
import type { TrackSnapshot } from "@/src/lib/tracks/types";
import { deduplicateTikwmSearchResults } from "@/lib/core/track/dedupe";

type TikwmSearchArgs = {
  keywords: string;
  count: number;
  cursor: number;
};

export type SearchTikwmTracksPage = {
  /** Deduplicated tracks with stats preserved — ready for UI rendering. */
  tracks: TrackSnapshot[];
  nextCursor: number | null;
  hasMore: boolean;
};

function toCursor(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.trunc(value);
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return Math.trunc(parsed);
    }
  }
  return null;
}

function toHasMore(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1";
  }
  return false;
}

// Transform search results and deduplicate by sound ID, preserving stats
function processSearchResults(videos: TikwmSearchVideo[]): TrackSnapshot[] {
  return deduplicateTikwmSearchResults(videos);
}

async function runTikwmSearch(args: TikwmSearchArgs): Promise<SearchTikwmTracksPage> {
  const json = await tikwmPostJson({
    path: "/api/feed/search",
    body: {
      keywords: args.keywords,
      count: args.count,
      cursor: args.cursor,
      web: 1,
      hd: 1,
    },
  });

  const parsed = tikwmSearchResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError({
      code: "UPSTREAM_ERROR",
      message: "TikWM search response was unexpected.",
      status: 502,
      details: parsed.error.flatten(),
    });
  }

  const responseData = parsed.data.data;
  const videos = responseData?.videos ?? [];

  // Process and deduplicate tracks — stats preserved in output
  const tracks = processSearchResults(videos);

  const candidateCursor = toCursor(
    responseData?.cursor ??
      responseData?.nextCursor ??
      responseData?.next_cursor ??
      responseData?.max_cursor,
  );
  const hasMore = toHasMore(
    responseData?.hasMore ?? responseData?.has_more ?? responseData?.more,
  );

  return {
    tracks,
    nextCursor: hasMore ? candidateCursor : null,
    hasMore: hasMore && candidateCursor !== null,
  };
}

const cachedSearch = unstable_cache(
  async (args: TikwmSearchArgs) => runTikwmSearch(args),
  ["tikwm-search-v1"],
  { revalidate: 300 },
);

export async function searchTikwmTracks(
  args: TikwmSearchArgs,
): Promise<SearchTikwmTracksPage> {
  const keywords = args.keywords.trim();
  if (!keywords) {
    return { tracks: [], nextCursor: null, hasMore: false };
  }
  if (keywords.length > 200) {
    throw new ApiError({
      code: "BAD_REQUEST",
      message: "Query is too long.",
      status: 400,
    });
  }

  // Cache by keyword (and cursor/count for correctness), revalidate every 5 minutes.
  return cachedSearch({ keywords, count: args.count, cursor: args.cursor });
}

// Export for testing
export { processSearchResults };

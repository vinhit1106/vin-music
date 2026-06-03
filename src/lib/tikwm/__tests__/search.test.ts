import { processSearchResults } from "@/src/lib/tikwm/search";
import type { TrackSnapshot } from "@/src/lib/tracks/types";

describe("TikWM Search Deduplication", () => {
  // Helper to create mock video data
  const createMockVideo = (
    id: string,
    title: string,
    author: string,
    playUrl: string,
    playCount: number,
    diggCount: number,
    collectCount: number
  ) => ({
    music_info: {
      id,
      title,
      author,
      play: playUrl,
      duration: 180,
      cover: `https://example.com/cover/${id}.jpg`,
      video_count: 10,
    },
    play_count: playCount,
    digg_count: diggCount,
    collect_count: collectCount,
  });

  test("deduplicates by music_info.id and keeps highest scoring version", () => {
    // Create mock search results with duplicate sounds
    const videos = [
      // Sound X - lower score version
      createMockVideo(
        "sound_x_1",
        "Song X Title",
        "Artist X",
        "https://example.com/audio/sound_x_1.mp3",
        100, // play_count
        10,  // digg_count
        5    // collect_count
        // Score: 100 + 10*5 + 5*10 = 100 + 50 + 50 = 200
      ),
      // Sound Y - unique sound
      createMockVideo(
        "sound_y_1",
        "Song Y Title",
        "Artist Y",
        "https://example.com/audio/sound_y_1.mp3",
        200,
        20,
        15
        // Score: 200 + 20*5 + 15*10 = 200 + 100 + 150 = 450
      ),
      // Sound X - higher score version (should be kept)
      createMockVideo(
        "sound_x_2",
        "Song X Title",
        "Artist X",
        "https://example.com/audio/sound_x_2.mp3",
        150, // play_count
        15,  // digg_count
        8    // collect_count
        // Score: 150 + 15*5 + 8*10 = 150 + 75 + 80 = 305
      ),
      // Sound X - another duplicate with medium score
      createMockVideo(
        "sound_x_3",
        "Song X Title",
        "Artist X",
        "https://example.com/audio/sound_x_3.mp3",
        120, // play_count
        12,  // digg_count
        6    // collect_count
        // Score: 120 + 12*5 + 6*10 = 120 + 60 + 60 = 240
      ),
    ];

    // Process the results
    const result: TrackSnapshot[] = processSearchResults(videos);

    // Should have 2 unique sounds: X and Y
    expect(result).toHaveLength(2);

    // Find the tracks by ID
    const trackX = result.find((t) => t.id === "sound_x_1" || t.id === "sound_x_2" || t.id === "sound_x_3");
    const trackY = result.find((t) => t.id === "sound_y_1");

    // Both tracks should be found
    expect(trackX).toBeDefined();
    expect(trackY).toBeDefined();

    // Sound X should be the version with ID "sound_x_2" (highest score: 305)
    expect(trackX?.id).toBe("sound_x_2");
    expect(trackX?.title).toBe("Song X Title");

    // Sound Y should be present
    expect(trackY?.id).toBe("sound_y_1");
    expect(trackY?.title).toBe("Song Y Title");
  });

  test("handles single page deduplication correctly", () => {
    const videos = [
      createMockVideo("sound_a_1", "Sound A", "Artist A", "https://example.com/a/a.mp3", 50, 5, 2),
      createMockVideo("sound_a_2", "Sound A", "Artist A", "https://example.com/a/a2.mp3", 100, 10, 5), // Higher score
      createMockVideo("sound_b_1", "Sound B", "Artist B", "https://example.com/b/b.mp3", 75, 8, 3),
    ];

    const result: TrackSnapshot[] = processSearchResults(videos);

    expect(result).toHaveLength(2);

    // Should keep sound_a_2 (higher score: 100 + 10*5 + 5*10 = 200)
    // Instead of sound_a_1 (50 + 5*5 + 2*10 = 50 + 25 + 20 = 95)
    const soundA = result.find(t => t.id.startsWith("sound_a"));
    expect(soundA?.id).toBe("sound_a_2");

    const soundB = result.find(t => t.id.startsWith("sound_b"));
    expect(soundB?.id).toBe("sound_b_1");
  });

  test("works with empty results", () => {
    const result: TrackSnapshot[] = processSearchResults([]);
    expect(result).toHaveLength(0);
  });

  test("works with no duplicates", () => {
    const videos = [
      createMockVideo("sound_1", "Sound 1", "Artist 1", "https://example.com/1.mp3", 100, 10, 5),
      createMockVideo("sound_2", "Sound 2", "Artist 2", "https://example.com/2.mp3", 200, 20, 10),
      createMockVideo("sound_3", "Sound 3", "Artist 3", "https://example.com/3.mp3", 150, 15, 7),
    ];

    const result: TrackSnapshot[] = processSearchResults(videos);
    expect(result).toHaveLength(3);

    // All should be present
    const ids = result.map(t => t.id).sort();
    expect(ids).toEqual(["sound_1", "sound_2", "sound_3"]);
  });
});
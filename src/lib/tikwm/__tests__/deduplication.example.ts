// Example demonstrating sound-level deduplication as specified in requirements

import type { BaseTrack } from "@/src/lib/tracks/types";
import { processSearchResults } from "@/src/lib/tikwm/search";

/*
Example scenario:
- Video A -> Sound X
- Video B -> Sound X (duplicate sound)
- Video C -> Sound Y

Expected result after deduplication:
- Sound X (strongest representative video)
- Sound Y
*/

// Mock TikTok video data that would come from TikWM API
const mockVideos = [
  // Video A -> Sound X
  {
    music_info: {
      id: "sound_x_001", // Sound ID
      title: "Catchy Song",
      author: "Music Creator",
      play: "https://example.com/audio/sound_x.mp3",
      duration: 150,
      cover: "https://example.com/cover/sound_x.jpg",
      video_count: 5
    },
    // Video A stats
    play_count: 1000,
    digg_count: 50,
    collect_count: 20
    // Score: 1000 + 50*5 + 20*10 = 1000 + 250 + 200 = 1450
  },
  // Video B -> Sound X (duplicate sound, different video)
  {
    music_info: {
      id: "sound_x_001", // SAME Sound ID as Video A
      title: "Catchy Song",
      author: "Music Creator",
      play: "https://example.com/audio/sound_x.mp3",
      duration: 150,
      cover: "https://example.com/cover/sound_x.jpg",
      video_count: 8
    },
    // Video B stats (stronger engagement)
    play_count: 1500,
    digg_count: 75,
    collect_count: 30
    // Score: 1500 + 75*5 + 30*10 = 1500 + 375 + 300 = 2175
  },
  // Video C -> Sound Y
  {
    music_info: {
      id: "sound_y_002", // Different Sound ID
      title: "Another Track",
      author: "Different Artist",
      play: "https://example.com/audio/sound_y.mp3",
      duration: 180,
      cover: "https://example.com/cover/sound_y.jpg",
      video_count: 3
    },
    // Video C stats
    play_count: 800,
    digg_count: 40,
    collect_count: 15
    // Score: 800 + 40*5 + 15*10 = 800 + 200 + 150 = 1150
  }
];

// Process the search results (this is what happens inside searchTikwmTracks)
const deduplicatedTracks: BaseTrack[] = processSearchResults(mockVideos);

// Log the results to demonstrate the functionality
console.log("Search Results Deduplication Example:");
console.log("=====================================");
console.log(`Input: ${mockVideos.length} videos`);
console.log(`Output: ${deduplicatedTracks.length} unique sounds`);
console.log("");

deduplicatedTracks.forEach((track, index) => {
  console.log(`Sound ${index + 1}:`);
  console.log(`  ID: ${track.id}`);
  console.log(`  Title: ${track.title}`);
  console.log(`  Artist: ${track.artist}`);
  console.log(`  Duration: ${track.duration}s`);
  console.log(`  Audio URL: ${track.audioUrl}`);
  console.log("");
});

// Expected output:
// Sound 1:
//   ID: sound_x_001
//   Title: Catchy Song
//   Artist: Music Creator
//   Duration: 150s
//   Audio URL: https://example.com/audio/sound_x.mp3
//
// Sound 2:
//   ID: sound_y_002
//   Title: Another Track
//   Artist: Different Artist
//   Duration: 180s
//   Audio URL: https://example.com/audio/sound_y.mp3

// Note: Sound X from Video B was selected because it had a higher score (2175 vs 1450)
// This demonstrates:
// * Dedupe by music_info.id
// * Use music_info.id as the canonical Track ID
// * Never use video_id as Track ID
// * Keep the strongest representative video based on scoring formula
// * Deduplication works inside a single page (this example)
// * The UI will never display the same sound twice

export {};
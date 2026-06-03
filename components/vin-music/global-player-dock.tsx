"use client";

import { useEffect, useMemo, useRef } from "react";

import {
  PlayerDock,
  type PlayerDockTrack,
} from "@/components/home/player-dock";
import { useCollectionsStore } from "@/store/collections-store";
import { useVinMusicPlayerStore } from "@/store/vin-music-player-store";
import { musicCardToTrackSnapshot, trackToMusicCard } from "@/src/lib/query/mappers";
import { useAuthContext } from "@/src/lib/auth/hooks";
import { useAddHistory } from "@/src/lib/query/hooks";

function trackFromStore(
  track: NonNullable<ReturnType<typeof useVinMusicPlayerStore.getState>["currentTrack"]>,
): PlayerDockTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.author,
    coverUrl: track.cover,
    duration: track.duration,
  };
}

export function GlobalPlayerDock() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = useVinMusicPlayerStore((s) => s.currentTrack);
  const isPlaying = useVinMusicPlayerStore((s) => s.isPlaying);
  const dockMode = useVinMusicPlayerStore((s) => s.dockMode);
  const currentTime = useVinMusicPlayerStore((s) => s.currentTime);
  const duration = useVinMusicPlayerStore((s) => s.duration);
  const volume = useVinMusicPlayerStore((s) => s.volume);
  const playbackMode = useVinMusicPlayerStore((s) => s.playbackMode);
  const queue = useVinMusicPlayerStore((s) => s.queue);

  const setPlayback = useVinMusicPlayerStore((s) => s.setPlayback);
  const setCurrentTime = useVinMusicPlayerStore((s) => s.setCurrentTime);
  const setDuration = useVinMusicPlayerStore((s) => s.setDuration);
  const togglePlayback = useVinMusicPlayerStore((s) => s.togglePlayback);
  const toggleDockExpanded = useVinMusicPlayerStore((s) => s.toggleDockExpanded);
  const hideDock = useVinMusicPlayerStore((s) => s.hideDock);
  const showDock = useVinMusicPlayerStore((s) => s.showDock);
  const setPlaybackMode = useVinMusicPlayerStore((s) => s.setPlaybackMode);
  const playNext = useVinMusicPlayerStore((s) => s.playNext);
  const playPrevious = useVinMusicPlayerStore((s) => s.playPrevious);
  const seek = useVinMusicPlayerStore((s) => s.seek);
  const setVolume = useVinMusicPlayerStore((s) => s.setVolume);
  const removeFromQueue = useVinMusicPlayerStore((s) => s.removeFromQueue);
  const clearQueue = useVinMusicPlayerStore((s) => s.clearQueue);
  const moveQueueItem = useVinMusicPlayerStore((s) => s.moveQueueItem);

  const addHistory = useAddHistory();
  const { user } = useAuthContext();
  const lastPlayedRef = useRef<string>("");
  const openCollectionPicker = useCollectionsStore((s) => s.openCollectionPicker);

  const dockTrack = useMemo(
    () => (currentTrack ? trackFromStore(currentTrack) : null),
    [currentTrack],
  );
  const dockQueue = useMemo(() => queue.map(trackFromStore), [queue]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    audio.volume = volume;

    if (audio.src !== currentTrack.play) {
      audio.src = currentTrack.play;
      audio.load();
    }

    if (isPlaying) {
      void audio.play().catch(() => setPlayback(false));
    } else {
      audio.pause();
    }
  }, [currentTrack, isPlaying, volume, setPlayback]);

  useEffect(() => {
    if (!user || !currentTrack || !isPlaying) return;
    if (lastPlayedRef.current === currentTrack.id) return;

    const trackId = currentTrack.id;
    lastPlayedRef.current = trackId;

    addHistory.mutate(musicCardToTrackSnapshot(currentTrack), {
      onSuccess: (data) => {
        const latestCurrentTrack = useVinMusicPlayerStore.getState().currentTrack;
        if (latestCurrentTrack?.id === trackId && data?.track_data) {
          const enriched = trackToMusicCard(data.track_data);
          useVinMusicPlayerStore.setState({
            currentTrack: {
              ...latestCurrentTrack,
              cover: enriched.cover || latestCurrentTrack.cover,
              stats: {
                ...latestCurrentTrack.stats,
                ...enriched.stats,
              },
            },
          });
        }
      },
    });
  }, [user, currentTrack, isPlaying, addHistory]);

  function handleEnded() {
    const mode = useVinMusicPlayerStore.getState().playbackMode;

    if (mode === "repeat-one") {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = 0;
      void audio.play().catch(() => setPlayback(false));
      return;
    }

    if (mode === "repeat-all" || mode === "shuffle" || mode === "autoplay-next") {
      playNext();
      return;
    }

    setPlayback(false);
    setCurrentTime(0);
  }

  function handleSeek(nextTime: number) {
    seek(nextTime);
    if (audioRef.current) {
      audioRef.current.currentTime = nextTime;
    }
  }

  if (!currentTrack || !dockTrack) return null;

  return (
    <>
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={(e) =>
          setDuration(e.currentTarget.duration || currentTrack.duration)
        }
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onPlay={() => setPlayback(true)}
        onPause={() => setPlayback(false)}
        onEnded={handleEnded}
      />
      <PlayerDock
        track={dockTrack}
        activeSource={currentTrack.play}
        isPlaying={isPlaying}
        dockMode={dockMode}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        playbackMode={playbackMode}
        isCurrentTrackSaved={false}
        onToggleDockExpanded={toggleDockExpanded}
        onHideDock={hideDock}
        onShowDock={showDock}
        onPlayPrevious={playPrevious}
        onTogglePlayback={togglePlayback}
        onPlayNext={playNext}
        onPlaybackModeChange={setPlaybackMode}
        onToggleSaveCurrentTrack={() => {
          if (!user) {
            window.location.href = "/login";
            return;
          }
          openCollectionPicker(currentTrack);
        }}
        onSeek={handleSeek}
        onVolumeChange={setVolume}
        queue={dockQueue}
        onRemoveFromQueue={removeFromQueue}
        onClearQueue={clearQueue}
        onMoveQueueItem={moveQueueItem}
      />
    </>
  );
}

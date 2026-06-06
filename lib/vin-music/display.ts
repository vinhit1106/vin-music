import type { MusicCardModel } from "./types";

export function getTrackDisplayTitle(track: Pick<MusicCardModel, "title" | "friendlyName">) {
  return track.friendlyName?.trim() || track.title;
}

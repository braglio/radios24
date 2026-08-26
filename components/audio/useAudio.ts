"use client";

import { createContext, useContext } from "react";
import type { AudioState, Station } from "@/types/station";

export type AudioContextValue = AudioState & {
  playStation: (station: Station) => Promise<void>;
  pause: () => void;
  resume: () => Promise<void>;
  stop: () => void;
  setVolume: (volume: number) => void;
};

export const AudioContext = createContext<AudioContextValue | null>(null);

export function useAudio() {
  const context = useContext(AudioContext);

  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }

  return context;
}

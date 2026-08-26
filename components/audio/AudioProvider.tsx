"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AudioError, AudioState, Station } from "@/types/station";
import { AudioContext, type AudioContextValue } from "./useAudio";

const initialState: AudioState = {
  status: "idle",
  currentStation: null,
  source: null,
  volume: 0.85,
  error: null,
  retryCount: 0,
};

function playbackError(error: unknown): AudioError {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return {
      code: "autoplay-blocked",
      message: "El navegador bloqueó la reproducción automática.",
      recoverable: true,
    };
  }

  return {
    code: "unknown",
    message: "No se pudo reproducir la emisora.",
    recoverable: true,
  };
}

export default function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const internalPauseRef = useRef(false);
  const [state, setState] = useState<AudioState>(initialState);

  const playStation = useCallback(async (station: Station) => {
    const audio = audioRef.current;
    if (!audio) return;

    internalPauseRef.current = true;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();

    setState((current) => ({
      ...current,
      status: "loading",
      currentStation: station,
      source: "primary",
      error: null,
      retryCount: 0,
    }));

    audio.src = station.streamUrl;
    audio.load();
    internalPauseRef.current = false;

    try {
      await audio.play();
    } catch (error) {
      setState((current) => ({
        ...current,
        status: "error",
        error: playbackError(error),
      }));
    }
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setState((current) =>
      current.currentStation ? { ...current, status: "paused" } : current
    );
  }, []);

  const resume = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    setState((current) => ({ ...current, status: "loading", error: null }));

    try {
      await audio.play();
    } catch (error) {
      setState((current) => ({
        ...current,
        status: "error",
        error: playbackError(error),
      }));
    }
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    internalPauseRef.current = true;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    internalPauseRef.current = false;
    setState((current) => ({
      ...initialState,
      volume: current.volume,
    }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    const nextVolume = Math.min(1, Math.max(0, volume));
    const audio = audioRef.current;

    if (audio) audio.volume = nextVolume;
    setState((current) => ({ ...current, volume: nextVolume }));
  }, []);

  const value = useMemo<AudioContextValue>(
    () => ({
      ...state,
      playStation,
      pause,
      resume,
      stop,
      setVolume,
    }),
    [pause, playStation, resume, setVolume, state, stop]
  );

  return (
    <AudioContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="none"
        className="hidden"
        aria-hidden="true"
        onPlaying={() =>
          setState((current) => ({ ...current, status: "playing", error: null }))
        }
        onPause={() => {
          if (internalPauseRef.current) return;
          setState((current) =>
            current.currentStation ? { ...current, status: "paused" } : current
          );
        }}
        onWaiting={() =>
          setState((current) =>
            current.currentStation ? { ...current, status: "loading" } : current
          )
        }
        onError={() =>
          setState((current) => ({
            ...current,
            status: "error",
            error: {
              code: "media",
              message: "El stream informó un error de reproducción.",
              recoverable: true,
            },
          }))
        }
      />
    </AudioContext.Provider>
  );
}

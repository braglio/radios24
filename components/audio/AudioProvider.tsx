"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AudioError, AudioState, Station } from "@/types/station";
import PlayerBar from "@/components/PlayerBar";
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

type AudioSession = {
  id: number;
  audio: HTMLAudioElement;
  events: AbortController;
  intent: "playing" | "paused" | "stopped";
};

export default function AudioProvider({ children }: { children: ReactNode }) {
  const sessionIdRef = useRef(0);
  const activeSessionRef = useRef<AudioSession | null>(null);
  const pausedSourceRef = useRef<string | null>(null);
  const volumeRef = useRef(initialState.volume);
  const [state, setState] = useState<AudioState>(initialState);

  const disposeSession = useCallback((session: AudioSession | null) => {
    if (!session) return;

    session.intent = "stopped";
    session.events.abort();
    session.audio.pause();
    session.audio.removeAttribute("src");
    session.audio.load();

    if (activeSessionRef.current === session) {
      activeSessionRef.current = null;
    }
  }, []);

  const createSession = useCallback(
    (source: string) => {
      disposeSession(activeSessionRef.current);

      const session: AudioSession = {
        id: ++sessionIdRef.current,
        audio: new Audio(),
        events: new AbortController(),
        intent: "playing",
      };
      const { audio, events } = session;
      const isCurrent = () =>
        activeSessionRef.current?.id === session.id &&
        activeSessionRef.current.audio === session.audio;

      audio.preload = "none";
      audio.volume = volumeRef.current;

      audio.addEventListener(
        "playing",
        () => {
          if (!isCurrent() || session.intent !== "playing") return;
          setState((current) => ({ ...current, status: "playing", error: null }));
        },
        { signal: events.signal }
      );
      audio.addEventListener(
        "pause",
        () => {
          if (!isCurrent() || session.intent !== "paused") return;
          setState((current) =>
            current.currentStation ? { ...current, status: "paused" } : current
          );
        },
        { signal: events.signal }
      );
      audio.addEventListener(
        "waiting",
        () => {
          if (!isCurrent() || session.intent !== "playing") return;
          setState((current) =>
            current.currentStation ? { ...current, status: "loading" } : current
          );
        },
        { signal: events.signal }
      );
      audio.addEventListener(
        "error",
        () => {
          if (!isCurrent() || session.intent !== "playing") return;
          setState((current) => ({
            ...current,
            status: "error",
            error: {
              code: "media",
              message: "El stream informó un error de reproducción.",
              recoverable: true,
            },
          }));
        },
        { signal: events.signal }
      );

      audio.src = source;
      activeSessionRef.current = session;
      audio.load();
      return session;
    },
    [disposeSession]
  );

  const playStation = useCallback(async (station: Station) => {
    pausedSourceRef.current = null;
    const session = createSession(station.streamUrl);

    setState((current) => ({
      ...current,
      status: "loading",
      currentStation: station,
      source: "primary",
      error: null,
      retryCount: 0,
    }));

    try {
      await session.audio.play();
    } catch (error) {
      if (activeSessionRef.current?.id !== session.id) return;
      if (activeSessionRef.current.audio !== session.audio) return;
      if (session.intent !== "playing") return;

      setState((current) => ({
        ...current,
        status: "error",
        error: playbackError(error),
      }));
    }
  }, [createSession]);

  const pause = useCallback(() => {
    const session = activeSessionRef.current;
    if (!session) return;

    session.intent = "paused";
    pausedSourceRef.current = session.audio.src;
    session.audio.pause();
    setState((current) =>
      current.currentStation ? { ...current, status: "paused" } : current
    );
  }, []);

  const resume = useCallback(async () => {
    const source = pausedSourceRef.current;
    if (!source) return;

    const session = createSession(source);
    pausedSourceRef.current = null;
    setState((current) => ({ ...current, status: "loading", error: null }));

    try {
      await session.audio.play();
    } catch (error) {
      if (activeSessionRef.current?.id !== session.id) return;
      if (activeSessionRef.current.audio !== session.audio) return;
      if (session.intent !== "playing") return;

      setState((current) => ({
        ...current,
        status: "error",
        error: playbackError(error),
      }));
    }
  }, [createSession]);

  const stop = useCallback(() => {
    pausedSourceRef.current = null;
    disposeSession(activeSessionRef.current);
    setState((current) => ({
      ...initialState,
      volume: current.volume,
    }));
  }, [disposeSession]);

  const setVolume = useCallback((volume: number) => {
    const nextVolume = Math.min(1, Math.max(0, volume));
    const session = activeSessionRef.current;

    volumeRef.current = nextVolume;
    if (session) session.audio.volume = nextVolume;
    setState((current) => ({ ...current, volume: nextVolume }));
  }, []);

  useEffect(
    () => () => {
      pausedSourceRef.current = null;
      disposeSession(activeSessionRef.current);
    },
    [disposeSession]
  );

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
      <PlayerBar />
    </AudioContext.Provider>
  );
}

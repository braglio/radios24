"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AudioError,
  AudioState,
  Station,
  StreamSource,
} from "@/types/station";
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

const reconnectDelays = [2000, 5000, 10000] as const;

function playbackError(error: unknown): AudioError {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    "recoverable" in error
  ) {
    return error as AudioError;
  }

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
  station: Station;
  source: StreamSource;
  retryCount: number;
  failureHandled: boolean;
};

type PausedPlayback = {
  station: Station;
  source: StreamSource;
};

export default function AudioProvider({ children }: { children: ReactNode }) {
  const sessionIdRef = useRef(0);
  const activeSessionRef = useRef<AudioSession | null>(null);
  const pausedPlaybackRef = useRef<PausedPlayback | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackOperationIdRef = useRef(0);
  const volumeRef = useRef(initialState.volume);
  const [state, setState] = useState<AudioState>(initialState);

  const cancelReconnect = useCallback(() => {
    if (reconnectTimerRef.current === null) return;

    clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = null;
  }, []);

  const beginManualOperation = useCallback(() => {
    cancelReconnect();
    playbackOperationIdRef.current += 1;
    return playbackOperationIdRef.current;
  }, [cancelReconnect]);

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
    (
      station: Station,
      source: StreamSource,
      streamUrl: string,
      retryCount: number,
      onPlaying: (session: AudioSession) => void,
      onFailure: (session: AudioSession, error: unknown) => void
    ) => {
      disposeSession(activeSessionRef.current);

      const session: AudioSession = {
        id: ++sessionIdRef.current,
        audio: new Audio(),
        events: new AbortController(),
        intent: "playing",
        station,
        source,
        retryCount,
        failureHandled: false,
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
          onPlaying(session);
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
          onFailure(session, {
            code: "media",
            message: "El stream informó un error de reproducción.",
            recoverable: true,
          } satisfies AudioError);
        },
        { signal: events.signal }
      );

      audio.src = streamUrl;
      activeSessionRef.current = session;
      audio.load();
      return session;
    },
    [disposeSession]
  );

  const startPlayback = useCallback(
    async (
      station: Station,
      initialSource: StreamSource,
      operationId: number,
      initialRetryCount = 0
    ) => {
      const fallbackUrl = station.fallbackStreamUrl?.trim();
      const hasFallback =
        Boolean(fallbackUrl) && fallbackUrl !== station.streamUrl;

      const isActive = (session: AudioSession) =>
        playbackOperationIdRef.current === operationId &&
        activeSessionRef.current?.id === session.id &&
        activeSessionRef.current.audio === session.audio &&
        session.intent === "playing";

      const streamUrlFor = (source: StreamSource) =>
        source === "fallback" ? fallbackUrl! : station.streamUrl;

      function handlePlaying(session: AudioSession) {
        if (!isActive(session)) return;

        cancelReconnect();
        session.retryCount = 0;
        setState((current) => ({
          ...current,
          status: "playing",
          error: null,
          retryCount: 0,
        }));
      }

      function scheduleReconnect(
        session: AudioSession,
        retryCount: number,
        error: AudioError
      ) {
        if (!isActive(session)) return;

        cancelReconnect();
        if (retryCount >= reconnectDelays.length) {
          setState((current) => ({
            ...current,
            status: "error",
            error: {
              code: "retries-exhausted",
              message: "No se pudo restablecer la reproducción.",
              recoverable: true,
            },
            retryCount,
          }));
          return;
        }

        const nextRetryCount = retryCount + 1;
        const timer = setTimeout(() => {
          if (
            reconnectTimerRef.current !== timer ||
            playbackOperationIdRef.current !== operationId
          ) {
            return;
          }

          reconnectTimerRef.current = null;
          void startCycle("primary", nextRetryCount);
        }, reconnectDelays[retryCount]);

        reconnectTimerRef.current = timer;
        setState((current) => ({
          ...current,
          status: "error",
          error,
          retryCount: nextRetryCount,
        }));
      }

      async function handleFailure(
        session: AudioSession,
        error: unknown
      ) {
        if (!isActive(session) || session.failureHandled) return;

        session.failureHandled = true;
        const classifiedError = playbackError(error);
        if (classifiedError.code === "autoplay-blocked") {
          cancelReconnect();
          setState((current) => ({
            ...current,
            status: "error",
            error: classifiedError,
            retryCount: 0,
          }));
          return;
        }

        if (session.source === "primary" && hasFallback) {
          await startAttempt("fallback", session.retryCount);
          return;
        }

        scheduleReconnect(session, session.retryCount, classifiedError);
      }

      async function startAttempt(
        source: StreamSource,
        retryCount: number
      ) {
        const session = createSession(
          station,
          source,
          streamUrlFor(source),
          retryCount,
          handlePlaying,
          (failedSession, error) => {
            void handleFailure(failedSession, error);
          }
        );

        pausedPlaybackRef.current = null;
        setState((current) => ({
          ...current,
          status: "loading",
          currentStation: station,
          source,
          error: null,
          retryCount,
        }));

        try {
          await session.audio.play();
        } catch (error) {
          await handleFailure(session, error);
        }
      }

      async function startCycle(source: StreamSource, retryCount: number) {
        if (playbackOperationIdRef.current !== operationId) return;
        await startAttempt(source, retryCount);
      }

      await startCycle(initialSource, initialRetryCount);
    },
    [cancelReconnect, createSession]
  );

  const playStation = useCallback(
    async (station: Station) => {
      const operationId = beginManualOperation();
      await startPlayback(station, "primary", operationId);
    },
    [beginManualOperation, startPlayback]
  );

  const pause = useCallback(() => {
    beginManualOperation();
    const session = activeSessionRef.current;
    if (!session) return;

    session.intent = "paused";
    pausedPlaybackRef.current = {
      station: session.station,
      source: session.source,
    };
    session.audio.pause();
    setState((current) =>
      current.currentStation ? { ...current, status: "paused" } : current
    );
  }, [beginManualOperation]);

  const resume = useCallback(async () => {
    const pausedPlayback = pausedPlaybackRef.current;
    if (!pausedPlayback) return;

    const operationId = beginManualOperation();
    await startPlayback(
      pausedPlayback.station,
      pausedPlayback.source,
      operationId
    );
  }, [beginManualOperation, startPlayback]);

  const stop = useCallback(() => {
    beginManualOperation();
    pausedPlaybackRef.current = null;
    disposeSession(activeSessionRef.current);
    setState((current) => ({
      ...initialState,
      volume: current.volume,
    }));
  }, [beginManualOperation, disposeSession]);

  const setVolume = useCallback((volume: number) => {
    const nextVolume = Math.min(1, Math.max(0, volume));
    const session = activeSessionRef.current;

    volumeRef.current = nextVolume;
    if (session) session.audio.volume = nextVolume;
    setState((current) => ({ ...current, volume: nextVolume }));
  }, []);

  useEffect(
    () => () => {
      cancelReconnect();
      playbackOperationIdRef.current += 1;
      pausedPlaybackRef.current = null;
      disposeSession(activeSessionRef.current);
    },
    [cancelReconnect, disposeSession]
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

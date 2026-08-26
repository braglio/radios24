"use client";

import { useAudio } from "@/components/audio/useAudio";

const statusLabels = {
  idle: "Listo para reproducir",
  loading: "Conectando con la señal…",
  playing: "Reproduciendo en vivo",
  paused: "Reproducción pausada",
  error: "No se pudo reproducir",
} as const;

export default function PlayerBar() {
  const {
    currentStation,
    status,
    volume,
    error,
    pause,
    resume,
    playStation,
    setVolume,
  } = useAudio();

  if (!currentStation) return null;

  const isPlaying = status === "playing";
  const isLoading = status === "loading";
  const hasError = status === "error";

  const handlePrimaryAction = () => {
    if (isPlaying) {
      pause();
      return;
    }

    if (hasError) {
      void playStation(currentStation);
      return;
    }

    void resume();
  };

  const actionLabel = isPlaying
    ? `Pausar ${currentStation.name}`
    : hasError
      ? `Reintentar ${currentStation.name}`
      : `Reproducir ${currentStation.name}`;

  return (
    <section
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/95 shadow-[0_-16px_48px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      aria-label="Reproductor global"
    >
      <div className="mx-auto flex min-h-20 max-w-7xl items-center gap-3 px-3 py-3 sm:gap-5 sm:px-6">
        <img
          src={currentStation.logo}
          alt=""
          width="56"
          height="56"
          className="h-12 w-12 shrink-0 rounded-xl bg-zinc-950 object-contain p-1 sm:h-14 sm:w-14"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white sm:text-base">
            {currentStation.name}
          </p>
          <p className="truncate text-xs text-zinc-400">
            {currentStation.genre}
          </p>
          <p
            className={`mt-0.5 truncate text-xs font-medium ${
              hasError ? "text-red-300" : "text-cyan-300"
            }`}
            role="status"
            aria-live="polite"
          >
            {hasError && error?.message
              ? error.message
              : statusLabels[status]}
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrimaryAction}
          disabled={isLoading}
          aria-label={isLoading ? `Conectando ${currentStation.name}` : actionLabel}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-lg font-black text-black transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:cursor-wait disabled:opacity-70 sm:h-14 sm:w-14"
        >
          <span aria-hidden="true">
            {isLoading ? "…" : isPlaying ? "Ⅱ" : hasError ? "↻" : "▶"}
          </span>
        </button>

        <label className="hidden min-w-32 items-center gap-3 sm:flex lg:min-w-48">
          <span className="sr-only">Volumen</span>
          <span aria-hidden="true" className="text-zinc-400">
            {volume === 0 ? "🔇" : "🔊"}
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(volume * 100)}
            onChange={(event) => setVolume(Number(event.target.value) / 100)}
            aria-label={`Volumen: ${Math.round(volume * 100)}%`}
            className="min-w-0 flex-1 accent-cyan-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
          />
        </label>

        <label className="flex shrink-0 items-center sm:hidden">
          <span className="sr-only">Volumen</span>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(volume * 100)}
            onChange={(event) => setVolume(Number(event.target.value) / 100)}
            aria-label={`Volumen: ${Math.round(volume * 100)}%`}
            className="w-16 accent-cyan-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
          />
        </label>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

type Radio = {
  id: number;
  slug: string;
  name: string;
  genre: string;
  description: string;
  streamUrl: string;
  logo: string;
  originalLogo: string;
  status: string;
  color: string;
};

export default function PlayerClient({ radio }: { radio: Radio }) {

  const sendAnalyticsEvent = async (type: "open" | "play") => {
    try {
      await fetch("/api/analytics/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: radio.slug,
          type,
        }),
      });
    } catch {}
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState("Listo para reproducir");
  const [metadata, setMetadata] = useState("Cargando metadata...");
  const [volume, setVolume] = useState(0.85);

  useEffect(() => {
    sendAnalyticsEvent("open");
    const channel = new BroadcastChannel("radios24-player");

    channel.onmessage = (event) => {
      if (event.data?.type === "PLAYING" && event.data.slug !== radio.slug) {
        if (audioRef.current) {
          audioRef.current.pause();
          setPlaying(false);
          setStatus("Pausado por otra emisora");
        }
      }
    };

    return () => channel.close();
  }, [radio.slug]);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const res = await fetch(
          `/api/metadata?slug=${encodeURIComponent(radio.slug)}`,
          { cache: "no-store" }
        );

        const data = await res.json();

        if (data?.title) {
          setMetadata(data.title);
        } else {
          setMetadata("Transmitiendo en vivo");
        }
      } catch {
        setMetadata("Metadata no disponible");
      }
    };

    loadMetadata();
    const timer = setInterval(loadMetadata, 20000);

    return () => clearInterval(timer);
  }, [radio.streamUrl]);

  const startPlayback = async () => {
    if (!audioRef.current) return;

    audioRef.current.src = radio.streamUrl;
    audioRef.current.volume = volume;

    setStatus("Conectando...");

    try {
      await audioRef.current.play();

      const channel = new BroadcastChannel("radios24-player");
      channel.postMessage({ type: "PLAYING", slug: radio.slug });
      channel.close();

      await sendAnalyticsEvent("play");
      setPlaying(true);
      setStatus("Transmitiendo en vivo");
    } catch {
      setPlaying(false);
      setStatus("No se pudo conectar al stream");
    }
  };

  const toggle = async () => {
    if (!audioRef.current) return;

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      setStatus("Pausado");
      return;
    }

    await startPlayback();
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <audio ref={audioRef} preload="none" />

      <div className="absolute inset-0 opacity-25 blur-3xl">
        <div className={`h-full w-full bg-gradient-to-br ${radio.color}`} />
      </div>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 py-8 md:py-12">
        <nav className="mb-6 flex items-center justify-between gap-4">
          <a
            href="/"
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:border-cyan-400/50 hover:text-white"
          >
            ← Todas las emisoras
          </a>
          <p className="text-sm font-black tracking-[0.16em]">
            RADIOS<span className="text-cyan-400">24</span>
          </p>
        </nav>

        <div className="grid items-stretch gap-6 lg:grid-cols-[420px_1fr]">
          <div className="flex min-h-[680px] w-full flex-col rounded-[2rem] border border-white/10 bg-black/85 p-5 shadow-2xl backdrop-blur-xl">
          <div className="aspect-square max-h-[280px] overflow-hidden rounded-[1.5rem] bg-zinc-900">
            <img
              src={radio.logo}
              alt={radio.name}
              className="h-full w-full object-contain p-4"
            />
          </div>

          <p className="mt-5 text-xs uppercase tracking-[0.35em] text-cyan-400">
            RADIOS 24 PLAYER
          </p>

          <h1 className="mt-3 line-clamp-2 text-3xl font-black leading-tight">
            {radio.name}
          </h1>

          <p className="mt-2 text-cyan-300">{radio.genre}</p>

          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-400">
            {radio.description}
          </p>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className={playing ? "text-emerald-400" : "text-zinc-400"}>
              {playing ? "● " : "○ "}
              {status}
            </p>

            <div className="mt-3 border-t border-white/10 pt-3">
              <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-600">
                Ahora suena
              </p>
              <p className="mt-1 line-clamp-2 text-sm font-semibold text-cyan-300">
                {metadata}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(volume * 100)}
              onChange={(event) => {
                const nextVolume = Number(event.target.value) / 100;
                setVolume(nextVolume);
                if (audioRef.current) audioRef.current.volume = nextVolume;
              }}
              className="w-full"
            />
          </div>

          <button
            onClick={toggle}
            className="mt-auto flex h-16 w-full items-center justify-center rounded-2xl bg-white text-2xl font-black text-black transition hover:scale-[1.02]"
          >
            {playing ? "▌▌ PAUSAR" : "▶ PLAY"}
          </button>

            <div className="mt-4 text-center text-[10px] uppercase tracking-[0.35em] text-zinc-600">
              Reproductor oficial RADIOS24
            </div>
          </div>

          <aside className="flex flex-col rounded-[2rem] border border-emerald-400/20 bg-[#07100d]/90 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-emerald-300">
              Ecosistema SYNKAST
            </p>
            <h2 className="mt-4 text-3xl font-black md:text-5xl">
              Dos formas de escuchar la misma señal.
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-zinc-400">
              Usá el reproductor principal de RADIOS24 o la versión distribuida
              por SYNKAST. Ambos conectan con la señal en vivo de {radio.name}.
            </p>

            <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-[#050709]">
              <iframe
                src={`https://synkast.com/embed/audio/${encodeURIComponent(radio.slug)}`}
                width="100%"
                height="150"
                className="block border-0"
                allow="autoplay"
                loading="lazy"
                title={`Reproductor SYNKAST de ${radio.name}`}
              />
            </div>

            <p className="mt-4 text-sm text-zinc-500">
              Para evitar superposición de audio, pausá un reproductor antes de
              iniciar el otro.
            </p>

            <div className="mt-auto grid gap-3 pt-10 sm:grid-cols-2">
              <a
                href={`https://synkast.com/embed/audio/${encodeURIComponent(radio.slug)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl bg-emerald-300 px-5 py-4 text-center font-black text-black transition hover:bg-emerald-200"
              >
                Abrir en SYNKAST
              </a>
              <a
                href="/"
                className="rounded-2xl border border-white/10 px-5 py-4 text-center font-bold transition hover:border-white/30"
              >
                Explorar más radios
              </a>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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

type PlayerState = "idle" | "loading" | "playing" | "paused" | "error";

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default function RadioPortalClient({
  radios,
  featuredSlugs,
}: {
  radios: Radio[];
  featuredSlugs: string[];
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [activeRadio, setActiveRadio] = useState<Radio | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const [volume, setVolume] = useState(0.85);
  const [metadata, setMetadata] = useState("Transmitiendo en vivo");

  const categories = useMemo(() => {
    const list = radios.map((radio) => radio.genre.split("/")[0].trim());
    return ["Todas", ...Array.from(new Set(list)).sort()];
  }, [radios]);

  const filtered = useMemo(() => {
    const normalizedQuery = normalize(query.trim());

    return radios.filter((radio) => {
      const haystack = normalize(
        `${radio.name} ${radio.genre} ${radio.description}`
      );
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      const matchesCategory =
        category === "Todas" ||
        normalize(radio.genre).includes(normalize(category));

      return matchesQuery && matchesCategory;
    });
  }, [category, query, radios]);

  const featured = useMemo(
    () =>
      featuredSlugs
        .map((slug) => radios.find((radio) => radio.slug === slug))
        .filter((radio): radio is Radio => Boolean(radio))
        .slice(0, 4),
    [featuredSlugs, radios]
  );

  useEffect(() => {
    if (!activeRadio) return;

    let cancelled = false;

    async function loadMetadata() {
      try {
        const response = await fetch(
          `/api/metadata?slug=${encodeURIComponent(activeRadio!.slug)}`,
          { cache: "no-store" }
        );
        const data = await response.json();

        if (!cancelled) {
          setMetadata(data?.title || "Transmitiendo en vivo");
        }
      } catch {
        if (!cancelled) setMetadata("Transmitiendo en vivo");
      }
    }

    loadMetadata();
    const timer = window.setInterval(loadMetadata, 25000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeRadio]);

  async function report(type: "open" | "play", radio: Radio) {
    try {
      await fetch("/api/analytics/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: radio.slug, type }),
        keepalive: true,
      });
    } catch {
      // Analytics must never interrupt playback.
    }
  }

  async function playRadio(radio: Radio) {
    const audio = audioRef.current;
    if (!audio) return;

    if (activeRadio?.slug === radio.slug && playerState === "playing") {
      audio.pause();
      return;
    }

    if (activeRadio?.slug !== radio.slug) {
      setActiveRadio(radio);
      setMetadata("Buscando información de la canción…");
      setPlayerState("loading");
      audio.src = radio.streamUrl;
      audio.load();
      void report("open", radio);
    }

    try {
      setPlayerState("loading");
      audio.volume = volume;
      await audio.play();
      void report("play", radio);
    } catch {
      setPlayerState("error");
    }
  }

  function playAdjacent(direction: -1 | 1) {
    if (!activeRadio || radios.length < 2) return;
    const currentIndex = radios.findIndex(
      (radio) => radio.slug === activeRadio.slug
    );
    const nextIndex =
      (currentIndex + direction + radios.length) % radios.length;
    void playRadio(radios[nextIndex]);
  }

  const isPlaying = playerState === "playing";

  return (
    <main className="min-h-screen bg-[#050506] pb-36 text-white">
      <audio
        ref={audioRef}
        preload="none"
        onPlaying={() => setPlayerState("playing")}
        onPause={() =>
          setPlayerState((current) =>
            current === "error" ? current : "paused"
          )
        }
        onWaiting={() => setPlayerState("loading")}
        onError={() => setPlayerState("error")}
      />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050506]/90 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:gap-5 sm:px-5 sm:py-4 md:px-8">
          <a href="#inicio" className="group" aria-label="Radios 24, inicio">
            <p className="text-xl font-black tracking-[0.08em] sm:text-2xl">
              RADIOS<span className="text-cyan-400">24</span>
            </p>
            <p className="hidden text-[9px] font-semibold uppercase tracking-[0.38em] text-zinc-500 transition group-hover:text-zinc-300 sm:block">
              Sonidos sin fronteras
            </p>
          </a>

          <nav className="hidden items-center gap-7 text-sm text-zinc-400 md:flex">
            <a className="transition hover:text-white" href="#destacadas">
              Destacadas
            </a>
            <a className="transition hover:text-white" href="#emisoras">
              Emisoras
            </a>
            <a className="transition hover:text-white" href="#nosotros">
              La red
            </a>
            <a
              className="transition hover:text-white"
              href="https://blog.radios24.com"
            >
              Blog
            </a>
            <a
              className="transition hover:text-white"
              href="https://play.google.com/store/apps/details?id=radios.n242"
              target="_blank"
              rel="noopener noreferrer"
            >
              App Android
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="https://blog.radios24.com"
              className="rounded-full border border-white/15 px-3 py-2 text-xs font-bold text-zinc-200 transition hover:border-cyan-400/50 hover:text-cyan-200 sm:px-4 sm:text-sm"
            >
              Blog
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=radios.n242"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-emerald-300 px-3 py-2 text-xs font-black text-black transition hover:bg-emerald-200 sm:px-4 sm:text-sm"
              aria-label="Descargar RADIOS 24 en Google Play"
            >
              App
            </a>
            <a
              href="#emisoras"
              className="hidden rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-cyan-300 sm:inline-flex"
            >
              Escuchar ahora
            </a>
          </div>
        </div>
      </header>

      <section
        id="inicio"
        className="hero-grid relative isolate overflow-hidden border-b border-white/5"
      >
        <div className="hero-glow hero-glow-cyan" />
        <div className="hero-glow hero-glow-magenta" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-5 sm:py-16 md:px-8 lg:min-h-[650px] lg:grid-cols-[1.12fr_0.88fr] lg:gap-14 lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
              <span className="live-dot" />
              50 señales verificadas
            </div>

            <h1 className="mt-7 max-w-4xl text-4xl font-black leading-[0.95] tracking-[-0.045em] sm:text-6xl sm:leading-[0.92] md:text-8xl md:tracking-[-0.055em]">
              Tu mundo
              <br />
              <span className="gradient-text">suena mejor.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl">
              Una red de emisoras digitales creada en Paraguay para acompañarte
              donde estés. Música, cultura, información y nuevas comunidades,
              en vivo las 24 horas.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#emisoras"
                className="rounded-full bg-cyan-400 px-7 py-3.5 font-black text-black transition hover:bg-cyan-300"
              >
                Explorar emisoras
              </a>
              <button
                type="button"
                onClick={() => featured[0] && void playRadio(featured[0])}
                className="rounded-full border border-white/15 bg-white/5 px-7 py-3.5 font-bold transition hover:border-white/35 hover:bg-white/10"
              >
                ▶ Reproducir una señal
              </button>
              <a
                href="https://play.google.com/store/apps/details?id=radios.n242"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-7 py-3.5 font-bold text-emerald-200 transition hover:border-emerald-300 hover:bg-emerald-300 hover:text-black"
              >
                Descargar app Android
              </a>
            </div>

            <dl className="mt-10 grid max-w-xl grid-cols-3 gap-3 border-t border-white/10 pt-6 sm:mt-12 sm:gap-5 sm:pt-7">
              <div>
                <dt className="text-xs uppercase tracking-widest text-zinc-600">
                  Emisoras
                </dt>
                <dd className="mt-1 text-2xl font-black sm:text-3xl">{radios.length}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-zinc-600">
                  Disponibilidad
                </dt>
                <dd className="mt-1 text-2xl font-black sm:text-3xl">24/7</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-zinc-600">
                  Acceso
                </dt>
                <dd className="mt-1 text-2xl font-black sm:text-3xl">Global</dd>
              </div>
            </dl>
          </div>

          <div id="destacadas" className="mx-auto grid w-full max-w-xl grid-cols-2 gap-3 pb-7 sm:pb-8 md:gap-4 lg:max-w-none">
            {featured.map((radio, index) => (
              <button
                key={radio.slug}
                type="button"
                onClick={() => void playRadio(radio)}
                className={`station-tile group relative aspect-square overflow-hidden rounded-[1.75rem] border p-5 text-left ${
                  activeRadio?.slug === radio.slug
                    ? "border-cyan-400/80"
                    : "border-white/10"
                } ${index % 2 ? "translate-y-4 sm:translate-y-7" : ""}`}
                aria-label={`Escuchar ${radio.name}`}
              >
                <span className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent" />
                <img
                  src={radio.logo}
                  alt=""
                  width="240"
                  height="240"
                  className="relative h-full w-full object-contain drop-shadow-2xl transition duration-500 group-hover:scale-105"
                />
                <span className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-xl transition group-hover:scale-110">
                  {activeRadio?.slug === radio.slug && isPlaying ? "Ⅱ" : "▶"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="emisoras" className="mx-auto max-w-7xl px-4 py-14 sm:px-5 sm:py-20 md:px-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-cyan-400">
              Elegí tu frecuencia
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
              Emisoras para cada momento
            </h2>
          </div>
          <p className="max-w-md text-zinc-500">
            Buscá por nombre, estilo o tema y empezá a escuchar sin registros ni
            interrupciones.
          </p>
        </div>

        <div className="mt-10 grid gap-3 rounded-3xl border border-white/10 bg-white/[0.025] p-3 md:grid-cols-[1fr_260px]">
          <label className="sr-only" htmlFor="radio-search">
            Buscar emisoras
          </label>
          <input
            id="radio-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar una emisora, género o tema…"
            className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400"
          />

          <label className="sr-only" htmlFor="radio-category">
            Filtrar por categoría
          </label>
          <select
            id="radio-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-zinc-300 outline-none transition focus:border-cyan-400"
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="mt-6 flex items-center justify-between text-sm text-zinc-500">
          <p>
            <span className="font-bold text-white">{filtered.length}</span>{" "}
            emisoras disponibles
          </p>
          {(query || category !== "Todas") && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("Todas");
              }}
              className="font-semibold text-cyan-300 hover:text-cyan-200"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {filtered.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {filtered.map((radio) => {
              const selected = activeRadio?.slug === radio.slug;

              return (
                <article
                  key={radio.slug}
                  className={`radio-row group grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3 rounded-2xl border p-3 text-left transition sm:flex sm:gap-4 ${
                    selected
                      ? "border-cyan-400/60 bg-cyan-400/[0.07]"
                      : "border-white/10 bg-white/[0.025] hover:border-white/25 hover:bg-white/[0.05]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => void playRadio(radio)}
                    className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-950 p-2 sm:h-20 sm:w-20"
                    aria-label={`${selected && isPlaying ? "Pausar" : "Escuchar"} ${radio.name}`}
                  >
                    <img
                      src={radio.logo}
                      alt=""
                      width="80"
                      height="80"
                      loading="lazy"
                      className="h-full w-full object-contain"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-lg opacity-0 transition group-hover:opacity-100">
                      {selected && isPlaying ? "Ⅱ" : "▶"}
                    </span>
                  </button>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-bold text-white group-hover:text-cyan-200">
                      {radio.name}
                    </span>
                    <span className="mt-1 block truncate text-sm text-zinc-500">
                      {radio.genre}
                    </span>
                    <span className="mt-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                      <span className="live-dot live-dot-small" />
                      En vivo
                    </span>
                  </span>

                  <div className="col-span-2 grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:flex-col">
                    <button
                      type="button"
                      onClick={() => void playRadio(radio)}
                      className="rounded-full bg-white px-4 py-2 text-xs font-black text-black transition hover:bg-cyan-300"
                    >
                      {selected && isPlaying ? "Pausar" : "Escuchar"}
                    </button>
                    <Link
                      href={`/player/${radio.slug}`}
                      className="rounded-full border border-white/15 px-4 py-2 text-center text-xs font-bold text-zinc-300 transition hover:border-cyan-400/50 hover:text-cyan-200"
                    >
                      Ver página
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-white/15 px-6 py-16 text-center">
            <p className="text-xl font-bold">No encontramos esa emisora</p>
            <p className="mt-2 text-zinc-500">
              Probá con otro nombre, género o categoría.
            </p>
          </div>
        )}
      </section>

      <section
        id="nosotros"
        className="border-y border-white/10 bg-white/[0.025]"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 md:px-8 lg:grid-cols-[0.8fr_1.2fr]">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-fuchsia-400">
            Una red nacida en Paraguay
          </p>
          <div>
            <h2 className="text-3xl font-black leading-tight md:text-5xl">
              Voces locales. Audiencias globales.
            </h2>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-400">
              Radios 24 reúne proyectos musicales, culturales, comunitarios y
              temáticos en una plataforma rápida y simple. Cada emisora conserva
              su identidad y gana una nueva puerta de entrada al mundo.
            </p>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-10 text-sm text-zinc-600 md:flex-row md:items-center md:justify-between md:px-8">
        <p>© {new Date().getFullYear()} Radios 24. Todos los derechos reservados.</p>
        <div className="flex items-center gap-5">
          <a className="transition hover:text-cyan-300" href="https://blog.radios24.com">
            Blog RADIOS24
          </a>
          <a
            className="transition hover:text-emerald-300"
            href="https://play.google.com/store/apps/details?id=radios.n242"
            target="_blank"
            rel="noopener noreferrer"
          >
            App Android
          </a>
          <p>Streaming digital desde Paraguay.</p>
        </div>
      </footer>

      {activeRadio && (
        <section
          className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#09090b]/95 shadow-[0_-20px_60px_rgba(0,0,0,.55)] backdrop-blur-2xl"
          aria-label="Reproductor"
        >
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 md:gap-6 md:px-8">
            <img
              src={activeRadio.logo}
              alt=""
              width="58"
              height="58"
              className="h-14 w-14 shrink-0 rounded-xl bg-black object-contain p-1.5"
            />

            <div className="min-w-0 flex-1 md:max-w-sm">
              <p className="truncate font-bold">{activeRadio.name}</p>
              <p
                className={`truncate text-xs ${
                  playerState === "error"
                    ? "text-red-400"
                    : playerState === "loading"
                      ? "text-amber-300"
                      : "text-cyan-300"
                }`}
              >
                {playerState === "error"
                  ? "No se pudo conectar. Intentá nuevamente."
                  : playerState === "loading"
                    ? "Conectando con la señal…"
                    : metadata}
              </p>
            </div>

            <div className="flex items-center gap-1 md:gap-3">
              <button
                type="button"
                onClick={() => playAdjacent(-1)}
                className="hidden h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white sm:flex"
                aria-label="Emisora anterior"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={() => void playRadio(activeRadio)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg font-black text-black transition hover:scale-105"
                aria-label={isPlaying ? "Pausar" : "Reproducir"}
              >
                {playerState === "loading" ? "…" : isPlaying ? "Ⅱ" : "▶"}
              </button>
              <button
                type="button"
                onClick={() => playAdjacent(1)}
                className="hidden h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white sm:flex"
                aria-label="Siguiente emisora"
              >
                ▶
              </button>
            </div>

            <label className="hidden items-center gap-3 lg:flex">
              <span className="text-zinc-500" aria-hidden="true">
                ◖))
              </span>
              <span className="sr-only">Volumen</span>
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
                className="accent-cyan-400"
              />
            </label>

            <a
              href={`/player/${activeRadio.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-zinc-300 transition hover:border-white/30 md:block"
            >
              Abrir player
            </a>
          </div>
        </section>
      )}
    </main>
  );
}
